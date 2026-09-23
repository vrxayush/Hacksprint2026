# backend/app/api/cases.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os, shutil

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/cases", response_model=schemas.Case)
async def create_case(
    case_name: str = Form(...),
    description: str = Form(None),
    fraud_amount: float = Form(None),
    files: List[UploadFile] = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_case = models.Case(
        case_name=case_name,
        description=description,
        fraud_amount=fraud_amount,
        user_id=current_user.id
    )
    db.add(new_case)
    db.commit()
    db.refresh(new_case)
    
    if files:
        for file in files:
            file_path = os.path.join(UPLOAD_DIR, f"{new_case.id}_{file.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            evidence = models.EvidenceFile(
                filename=file.filename,
                file_type=file.content_type,
                file_path=file_path,
                case_id=new_case.id
            )
            db.add(evidence)
    
    db.commit()
    db.refresh(new_case)
    
    return new_case

@router.get("/cases", response_model=List[schemas.Case])
def get_user_cases(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cases = db.query(models.Case).filter(models.Case.user_id == current_user.id).all()
    return cases

@router.get("/cases/{case_id}")
def get_case_details(
    case_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(models.Case).filter(models.Case.id == case_id, models.Case.user_id == current_user.id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    
    evidence_files = db.query(models.EvidenceFile).filter(models.EvidenceFile.case_id == case_id).all()
    analysis_results = db.query(models.AnalysisResult).filter(models.AnalysisResult.case_id == case_id).all()
    
    return {
        "case": case,
        "evidence_files": evidence_files,
        "analysis_results": analysis_results
    }