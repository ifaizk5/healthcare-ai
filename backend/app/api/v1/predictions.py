import pickle
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.entities import User, ModelVersion, Prediction, PredictionExplanation
from app.services.ml_engine import ModelTrainerEngine
from app.services.explainability_service import ExplainabilityService
from app.services.feature_engineering import HealthcareFeatureEngineer

router = APIRouter(prefix="/predictions", tags=["Inference & Explainability"])

class PatientRiskRequest(BaseModel):
    model_version_id: int
    features: Dict[str, float]  # e.g., {"age": 75, "time_in_hospital": 6, "number_inpatient": 2, "a1c_result": 3, ...} (see sample_data/diabetes_readmission.csv)
    threshold: Optional[float] = 0.50

class PredictionResponse(BaseModel):
    prediction_id: int
    predicted_class: int
    probability: float
    probability_percentage: str
    risk_category: str
    threshold_used: float
    model_name: str
    model_version: str
    shap_explanations: list

@router.post("/patient-risk", response_model=PredictionResponse)
def predict_patient_risk(
    req: PatientRiskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    model_ver = db.query(ModelVersion).filter(ModelVersion.id == req.model_version_id).first()
    if not model_ver:
        raise HTTPException(status_code=404, detail="Model version not found.")

    if model_ver.status not in ["VALIDATED", "PRODUCTION"]:
        raise HTTPException(status_code=400, detail="Only VALIDATED or PRODUCTION models can be used for inference.")

    # Load artifact payload
    with open(model_ver.artifact_path, "rb") as f:
        artifact = pickle.load(f)

    model = artifact["model"]
    scaler = artifact["scaler"]
    feature_names = artifact["feature_names"]
    model_type = artifact["model_type"]

    # 1. Feature Engineering on input dict
    input_df = pd.DataFrame([req.features])
    input_fe = HealthcareFeatureEngineer.engineer_features(input_df)

    # 2. Align features with scaler/training schema
    input_encoded = pd.get_dummies(input_fe, drop_first=True)
    
    # Reindex to ensure exact column alignment
    input_aligned = input_encoded.reindex(columns=feature_names, fill_value=0)
    input_scaled = scaler.transform(input_aligned)

    # 3. Predict probability
    probs = ModelTrainerEngine.predict_proba(model, model_type, input_scaled)
    prob_val = float(probs[0])
    threshold = req.threshold or 0.50

    pred_class = 1 if prob_val >= threshold else 0

    # Risk categorization
    if prob_val < 0.35:
        risk_cat = "LOW"
    elif prob_val < 0.70:
        risk_cat = "MODERATE"
    else:
        risk_cat = "HIGH"

    # 4. SHAP Feature attribution
    shap_explanations = ExplainabilityService.explain_prediction(
        model, model_type, input_scaled, feature_names
    )

    # 5. Persist prediction in Database
    db_pred = Prediction(
        model_version_id=model_ver.id,
        user_id=current_user.id,
        input_data=req.features,
        predicted_class=pred_class,
        probability=prob_val,
        risk_category=risk_cat,
        threshold_used=threshold
    )
    db.add(db_pred)
    db.commit()
    db.refresh(db_pred)

    db_exp = PredictionExplanation(
        prediction_id=db_pred.id,
        feature_contributions=shap_explanations
    )
    db.add(db_exp)
    db.commit()

    return PredictionResponse(
        prediction_id=db_pred.id,
        predicted_class=pred_class,
        probability=round(prob_val, 4),
        probability_percentage=f"{round(prob_val * 100, 1)}%",
        risk_category=risk_cat,
        threshold_used=threshold,
        model_name=model_ver.model.name,
        model_version=model_ver.version_tag,
        shap_explanations=shap_explanations
    )
