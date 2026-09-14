import os
import shutil
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.db import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.entities import User, Dataset, DatasetVersion
from app.services.data_pipeline import HealthcareDataPipeline

router = APIRouter(prefix="/datasets", tags=["Datasets"])

class DatasetResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    file_format: str
    row_count: int
    column_count: int
    upload_date: str
    target_column: Optional[str]
    processing_status: str

@router.post("/upload", response_model=DatasetResponse)
async def upload_dataset(
    name: str = Form(...),
    description: str = Form(""),
    target_column: str = Form("target"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not (file.filename.endswith(".csv") or file.filename.endswith(".parquet")):
        raise HTTPException(status_code=400, detail="Only CSV and Parquet formats are supported.")
        
    file_ext = "CSV" if file.filename.endswith(".csv") else "Parquet"
    file_path = os.path.join(settings.UPLOAD_DIR, f"{name}_{file.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    df = HealthcareDataPipeline.load_dataset(file_path)
    val_result = HealthcareDataPipeline.validate_dataset(df, target_column=target_column)
    
    status_str = "VALIDATED" if val_result["is_valid"] else "FAILED"
    
    db_dataset = Dataset(
        name=name,
        description=description,
        file_format=file_ext,
        row_count=val_result["row_count"],
        column_count=val_result["column_count"],
        owner_id=current_user.id,
        target_column=target_column,
        processing_status=status_str
    )
    db.add(db_dataset)
    db.commit()
    db.refresh(db_dataset)
    
    file_hash = HealthcareDataPipeline.compute_file_hash(file_path)
    db_version = DatasetVersion(
        dataset_id=db_dataset.id,
        version_tag="v1.0",
        hash=file_hash,
        file_path=file_path,
        row_count=val_result["row_count"],
        feature_schema=val_result["column_types"],
        validation_summary=val_result
    )
    db.add(db_version)
    db.commit()
    
    return DatasetResponse(
        id=db_dataset.id,
        name=db_dataset.name,
        description=db_dataset.description,
        file_format=db_dataset.file_format,
        row_count=db_dataset.row_count,
        column_count=db_dataset.column_count,
        upload_date=db_dataset.upload_date.isoformat(),
        target_column=db_dataset.target_column,
        processing_status=db_dataset.processing_status
    )

@router.get("", response_model=List[DatasetResponse])
def list_datasets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    datasets = db.query(Dataset).all()
    return [
        DatasetResponse(
            id=d.id,
            name=d.name,
            description=d.description,
            file_format=d.file_format,
            row_count=d.row_count,
            column_count=d.column_count,
            upload_date=d.upload_date.isoformat(),
            target_column=d.target_column,
            processing_status=d.processing_status
        )
        for d in datasets
    ]

@router.get("/{dataset_id}/validation")
def get_dataset_validation(dataset_id: int, db: Session = Depends(get_db)):
    version = db.query(DatasetVersion).filter(DatasetVersion.dataset_id == dataset_id).order_by(DatasetVersion.id.desc()).first()
    if not version:
        raise HTTPException(status_code=404, detail="Dataset version not found.")
    return version.validation_summary
