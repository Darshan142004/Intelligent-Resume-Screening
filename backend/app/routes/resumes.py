from typing import List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("/upload/single")
def upload_single_resume(
    file: UploadFile = File(...),
    job_id: int = Form(None),
    db: Session = Depends(get_db)
):
    """
    Endpoint shell for single resume upload (PDF/DOCX).
    """
    if not file.filename.endswith(('.pdf', '.docx', '.doc')):
        raise HTTPException(status_code=400, detail="Invalid file format. Supported: PDF, DOCX")
    
    return {
        "message": "Resume uploaded successfully. Processing shell ready.",
        "filename": file.filename,
        "job_id": job_id
    }


@router.post("/upload/bulk")
def upload_bulk_resumes(
    files: List[UploadFile] = File(...),
    job_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint shell for bulk resume upload.
    """
    return {
        "message": f"Received {len(files)} resumes for job {job_id}. Processing shell ready.",
        "processed_count": len(files)
    }
