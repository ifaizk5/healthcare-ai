import json
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.db import get_db
from app.core.security import get_current_user
from app.models.entities import User, NLPRequest
from app.services.nlp_service import ClinicalNLPService

router = APIRouter(prefix="/nlp", tags=["Clinical NLP"])

class AnalyzeTextRequest(BaseModel):
    text: str

class SemanticSearchRequest(BaseModel):
    query: str

@router.post("/analyze")
def analyze_clinical_text(
    req: AnalyzeTextRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    entities = ClinicalNLPService.extract_entities(req.text)
    classification = ClinicalNLPService.classify_clinical_text(req.text)
    summary = ClinicalNLPService.summarize_note(req.text)

    output = {
        "classification": classification,
        "entities": entities,
        "summary": summary
    }

    db_nlp = NLPRequest(
        user_id=current_user.id,
        input_text=req.text,
        task_type="ANALYZE",
        output_data=output
    )
    db.add(db_nlp)
    db.commit()

    return output

@router.post("/search")
def search_clinical_notes(
    req: SemanticSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        with open("sample_data/clinical_notes.json", "r") as f:
            notes = json.load(f)
    except Exception:
        notes = []

    results = ClinicalNLPService.semantic_search(req.query, notes)
    return {"query": req.query, "results": results}
