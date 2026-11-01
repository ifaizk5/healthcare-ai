import os
import shutil
import threading
import pickle
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.db import engine, Base, SessionLocal
from app.models.entities import User, Dataset, DatasetVersion, Model, ModelVersion
from app.core.security import get_password_hash
from app.services.data_pipeline import HealthcareDataPipeline
from app.services.feature_engineering import HealthcareFeatureEngineer
from app.services.ml_engine import ModelTrainerEngine
from app.services.evaluation_service import ModelEvaluationService
from app.services.nlp_service import ClinicalCorpus

SEED_DATASET_NAME = "Diabetes 130-US Hospitals Readmission"
SEED_DATASET_FILE = "diabetes_readmission.csv"
SEED_TARGET = "readmitted_30d"

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
    ## HealthLens Healthcare AI/ML Engineering Platform API
    
    > **DISCLAIMER:** HealthLens is an educational and research demonstration platform. 
    > It is not a medical diagnostic system and must not be used to make clinical decisions.
    """,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in dev environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mandatory Disclaimer Header Middleware
@app.middleware("http")
async def add_disclaimer_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-HealthLens-Disclaimer"] = "Research/Educational Demonstration Only. Not for clinical decision making."
    return response

# Include API Routers
from app.api.v1 import auth, datasets, training, models, predictions, nlp, experiments

app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(datasets.router, prefix=settings.API_V1_STR)
app.include_router(training.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(predictions.router, prefix=settings.API_V1_STR)
app.include_router(nlp.router, prefix=settings.API_V1_STR)
app.include_router(experiments.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "project": "HealthLens",
        "version": settings.VERSION,
        "status": "Online",
        "docs_url": "/docs",
        "disclaimer": "Educational and research demonstration platform. Not for clinical diagnostic use."
    }

@app.on_event("startup")
def seed_initial_data():
    """Seeds default user accounts, dataset, and trained baseline models on app startup."""
    db = SessionLocal()
    try:
        # Seed or refresh Admin & Demo User credentials
        admin = db.query(User).filter(User.email == "admin@healthlens.ai").first()
        if not admin:
            admin = User(
                email="admin@healthlens.ai",
                hashed_password=get_password_hash("AdminSecret123!"),
                full_name="Dr. Alex Rivera (Lead MLE)",
                role="ADMIN"
            )
            db.add(admin)
        else:
            admin.hashed_password = get_password_hash("AdminSecret123!")

        demo_user = db.query(User).filter(User.email == "demo@healthlens.ai").first()
        if not demo_user:
            demo_user = User(
                email="demo@healthlens.ai",
                hashed_password=get_password_hash("DemoUser123!"),
                full_name="Clinical Demo User",
                role="USER"
            )
            db.add(demo_user)
        else:
            demo_user.hashed_password = get_password_hash("DemoUser123!")
        db.commit()
        db.refresh(admin)

        # Seed the Diabetes 130-US Hospitals readmission dataset (run scripts/prepare_datasets.py first)
        sample_csv = os.path.join(settings.SAMPLE_DATA_DIR, SEED_DATASET_FILE)
        seed_exists = db.query(Dataset).filter(Dataset.name == SEED_DATASET_NAME).first()
        if not os.path.exists(sample_csv):
            print(f"Seed dataset not found at {sample_csv}. Run: py scripts/prepare_datasets.py")
        elif not seed_exists:
            dest_path = os.path.join(settings.UPLOAD_DIR, "diabetes_readmission_v1.csv")
            shutil.copyfile(sample_csv, dest_path)

            df = HealthcareDataPipeline.load_dataset(dest_path)
            val_result = HealthcareDataPipeline.validate_dataset(df, target_column=SEED_TARGET)

            dataset = Dataset(
                name=SEED_DATASET_NAME,
                description=(
                    "Diabetes 130-US Hospitals (1999-2008), UCI ML Repository #296, CC BY 4.0. "
                    "One encounter per patient; target = readmitted within 30 days."
                ),
                file_format="CSV",
                row_count=val_result["row_count"],
                column_count=val_result["column_count"],
                owner_id=admin.id,
                target_column=SEED_TARGET,
                processing_status="VALIDATED"
            )
            db.add(dataset)
            db.commit()
            db.refresh(dataset)

            dataset_ver = DatasetVersion(
                dataset_id=dataset.id,
                version_tag="v1.0",
                hash=HealthcareDataPipeline.compute_file_hash(dest_path),
                file_path=dest_path,
                row_count=val_result["row_count"],
                feature_schema=val_result["column_types"],
                validation_summary=val_result
            )
            db.add(dataset_ver)
            db.commit()

            # Train baseline Random Forest & Logistic Regression models
            df_fe = HealthcareFeatureEngineer.engineer_features(df)
            splits, scaler, feature_names = HealthcareDataPipeline.split_and_transform_without_leakage(
                df_fe, target_column=SEED_TARGET, test_size=0.15, val_size=0.15, random_state=42
            )

            models_to_seed = [
                ("Random Forest Readmission Classifier", "random_forest", os.path.join(settings.CONFIGS_DIR, "random_forest.yaml")),
                ("Logistic Regression Baseline", "logistic_regression", os.path.join(settings.CONFIGS_DIR, "logistic_regression.yaml")),
                ("XGBoost Readmission Classifier", "xgboost", os.path.join(settings.CONFIGS_DIR, "xgboost.yaml")),
                ("PyTorch Feed-Forward NN", "pytorch_nn", os.path.join(settings.CONFIGS_DIR, "pytorch_nn.yaml"))
            ]

            for m_name, m_type, cfg_path in models_to_seed:
                cfg = ModelTrainerEngine.load_config(cfg_path)
                trained_model, duration = ModelTrainerEngine.train_model(m_type, cfg, splits)
                eval_res = ModelEvaluationService.evaluate_model(
                    trained_model, m_type, splits["X_test"], splits["y_test"], threshold=0.50
                )
                eval_res["metrics"]["training_duration_seconds"] = duration

                art_name = f"{m_name.replace(' ', '_')}_{m_type}.pkl"
                art_path = os.path.join(settings.ARTIFACTS_DIR, art_name)
                
                with open(art_path, "wb") as f:
                    pickle.dump({
                        "model": trained_model,
                        "scaler": scaler,
                        "feature_names": feature_names,
                        "model_type": m_type,
                        "target_column": SEED_TARGET,
                        "metrics": eval_res["metrics"]
                    }, f)

                model_record = Model(name=m_name, model_type=m_type, owner_id=admin.id)
                db.add(model_record)
                db.commit()
                db.refresh(model_record)

                ver_record = ModelVersion(
                    model_id=model_record.id,
                    version_tag="v1.0",
                    artifact_path=art_path,
                    metrics=eval_res,
                    status="VALIDATED"
                )
                db.add(ver_record)
                db.commit()

    except Exception as e:
        print(f"Startup Seed Error: {str(e)}")
    finally:
        db.close()

    # Train the MTSamples specialty classifier + search index in the background (~20s) so the first NLP call is fast
    threading.Thread(target=ClinicalCorpus.ensure_loaded, daemon=True).start()
