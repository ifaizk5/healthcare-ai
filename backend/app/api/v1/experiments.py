from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.db import get_db
from app.models.entities import Experiment, DatasetVersion

router = APIRouter(prefix="/experiments", tags=["Experiment Tracking"])

class ExperimentResponse(BaseModel):
    id: int
    name: str
    dataset_version_tag: str
    framework: str
    model_type: str
    hyperparams: dict
    metrics: dict
    created_at: str

@router.get("", response_model=List[ExperimentResponse])
def list_experiments(db: Session = Depends(get_db)):
    experiments = db.query(Experiment).order_by(Experiment.id.desc()).all()
    results = []
    for exp in experiments:
        results.append(
            ExperimentResponse(
                id=exp.id,
                name=exp.name,
                dataset_version_tag=exp.dataset_version.version_tag if exp.dataset_version else "v1.0",
                framework=exp.framework,
                model_type=exp.model_type,
                hyperparams=exp.hyperparams or {},
                metrics=exp.metrics or {},
                created_at=exp.created_at.isoformat()
            )
        )
    return results
