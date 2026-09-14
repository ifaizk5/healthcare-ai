from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.db import get_db
from app.core.security import get_current_user, require_admin
from app.models.entities import User, Model, ModelVersion

router = APIRouter(prefix="/models", tags=["Model Registry"])

class ModelVersionResponse(BaseModel):
    id: int
    model_id: int
    model_name: str
    model_type: str
    version_tag: str
    status: str
    accuracy: Optional[float] = None
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    roc_auc: Optional[float] = None
    pr_auc: Optional[float] = None
    latency_ms: Optional[float] = None
    created_at: str

class StatusUpdateRequest(BaseModel):
    status: str  # "EXPERIMENTAL", "VALIDATED", "PRODUCTION", "ARCHIVED"

@router.get("", response_model=List[ModelVersionResponse])
def list_models(db: Session = Depends(get_db)):
    versions = db.query(ModelVersion).all()
    results = []
    for v in versions:
        metrics = v.metrics.get("metrics", {}) if v.metrics else {}
        results.append(
            ModelVersionResponse(
                id=v.id,
                model_id=v.model_id,
                model_name=v.model.name if v.model else "Unknown",
                model_type=v.model.model_type if v.model else "Unknown",
                version_tag=v.version_tag,
                status=v.status,
                accuracy=metrics.get("accuracy"),
                precision=metrics.get("precision"),
                recall=metrics.get("recall"),
                f1_score=metrics.get("f1_score"),
                roc_auc=metrics.get("roc_auc"),
                pr_auc=metrics.get("pr_auc"),
                latency_ms=metrics.get("latency_ms"),
                created_at=v.created_at.isoformat()
            )
        )
    return results

@router.get("/{version_id}")
def get_model_version_details(version_id: int, db: Session = Depends(get_db)):
    version = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found.")
    return {
        "id": version.id,
        "model_name": version.model.name,
        "model_type": version.model.model_type,
        "version_tag": version.version_tag,
        "status": version.status,
        "metrics": version.metrics,
        "created_at": version.created_at.isoformat()
    }

@router.patch("/{version_id}/status")
def update_model_status(
    version_id: int, 
    req: StatusUpdateRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    if req.status not in ["EXPERIMENTAL", "VALIDATED", "PRODUCTION", "ARCHIVED"]:
        raise HTTPException(status_code=400, detail="Invalid status option.")

    version = db.query(ModelVersion).filter(ModelVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Model version not found.")

    version.status = req.status
    db.commit()
    return {"message": f"Model status updated to {req.status} successfully."}
