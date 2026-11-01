import os
import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.db import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.entities import User, Dataset, DatasetVersion, Experiment, Model, ModelVersion
from app.services.data_pipeline import HealthcareDataPipeline
from app.services.feature_engineering import HealthcareFeatureEngineer
from app.services.ml_engine import ModelTrainerEngine
from app.services.evaluation_service import ModelEvaluationService

router = APIRouter(prefix="/training", tags=["Model Training"])

class TrainRequest(BaseModel):
    dataset_id: int
    model_type: str  # "logistic_regression", "random_forest", "xgboost", "pytorch_nn", "tf_nn"
    model_name: str
    config_path: Optional[str] = None
    threshold: Optional[float] = 0.50

def run_training_task(
    experiment_id: int, 
    dataset_version_path: str, 
    target_col: str, 
    model_type: str, 
    model_name: str,
    config_data: dict,
    user_id: int
):
    db = next(get_db())
    try:
        # 1. Load data & engineer features
        df_raw = HealthcareDataPipeline.load_dataset(dataset_version_path)
        df_fe = HealthcareFeatureEngineer.engineer_features(df_raw)

        # 2. Leakage-free split & scaling
        splits, scaler, feature_names = HealthcareDataPipeline.split_and_transform_without_leakage(
            df_fe, target_column=target_col, test_size=0.15, val_size=0.15, random_state=42
        )

        # 3. Train model
        model, train_duration = ModelTrainerEngine.train_model(model_type, config_data, splits)

        # 4. Evaluate model
        eval_result = ModelEvaluationService.evaluate_model(
            model, model_type, splits["X_test"], splits["y_test"], threshold=0.50
        )
        eval_result["metrics"]["training_duration_seconds"] = train_duration

        # 5. Save combined artifact (preprocessor + model + metadata) PRD Section 56
        artifact_filename = f"{model_name.replace(' ', '_')}_{model_type}.pkl"
        artifact_path = os.path.join(settings.ARTIFACTS_DIR, artifact_filename)
        
        artifact_payload = {
            "model": model,
            "scaler": scaler,
            "feature_names": feature_names,
            "model_type": model_type,
            "target_column": target_col,
            "metrics": eval_result["metrics"]
        }

        with open(artifact_path, "wb") as f:
            pickle.dump(artifact_payload, f)

        # 6. Update database experiment & create model version
        exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
        if exp:
            exp.metrics = eval_result["metrics"]
            db.commit()

        # Create or update parent Model
        db_model = db.query(Model).filter(Model.name == model_name).first()
        if not db_model:
            db_model = Model(name=model_name, model_type=model_type, owner_id=user_id)
            db.add(db_model)
            db.commit()
            db.refresh(db_model)

        version_tag = f"v{len(db_model.versions) + 1}.0"
        model_ver = ModelVersion(
            model_id=db_model.id,
            experiment_id=experiment_id,
            version_tag=version_tag,
            artifact_path=artifact_path,
            metrics=eval_result,
            status="VALIDATED"  # Mark VALIDATED for inference
        )
        db.add(model_ver)
        db.commit()

    except Exception as e:
        db.rollback()
        print(f"Training Task Failed: {str(e)}")

@router.post("/run")
def start_training_job(
    req: TrainRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    dataset = db.query(Dataset).filter(Dataset.id == req.dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")

    version = db.query(DatasetVersion).filter(DatasetVersion.dataset_id == req.dataset_id).order_by(DatasetVersion.id.desc()).first()
    if not version:
        raise HTTPException(status_code=400, detail="Dataset has no versions.")

    # Load config file
    config_file = req.config_path or os.path.join(settings.CONFIGS_DIR, f"{req.model_type}.yaml")
    if not os.path.exists(config_file):
        config_data = {"model": {"type": req.model_type, "random_state": 42}}
    else:
        config_data = ModelTrainerEngine.load_config(config_file)

    exp = Experiment(
        name=f"Training {req.model_name}",
        dataset_version_id=version.id,
        framework="scikit-learn/pytorch/tf",
        model_type=req.model_type,
        hyperparams=config_data
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)

    background_tasks.add_task(
        run_training_task,
        exp.id,
        version.file_path,
        dataset.target_column or "target",
        req.model_type,
        req.model_name,
        config_data,
        current_user.id
    )

    return {
        "message": "Training job queued successfully.",
        "experiment_id": exp.id,
        "model_type": req.model_type,
        "status": "QUEUED"
    }
