import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.candidate import Candidate
from app.models.skill import Skill
from app.schemas.candidate import CandidateExtractionResponse, BulkUploadSummary, BulkUploadErrorItem
from app.services.resume_parser import parse_resume, ResumeParsingError
from app.services.resume_extractor import extract_structured_information
from app.services.skill_vocabulary import normalize_skill

router = APIRouter(prefix="/resumes", tags=["Resumes"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads", "resumes")
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def save_upload_file(file: UploadFile) -> str:
    """Save uploaded file to local disk and return absolute file path."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = file.filename.lower().rsplit('.', 1)[-1] if '.' in file.filename else 'bin'
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)
    
    file.file.seek(0)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path


def process_single_resume_data(file: UploadFile, db: Session) -> CandidateExtractionResponse:
    """Helper function to parse, extract, and save a single candidate resume."""
    filename = file.filename or "uploaded_resume"
    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''
    
    if ext not in ['pdf', 'docx']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Only PDF (.pdf) and Word (.docx) files are supported."
        )

    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File '{filename}' is empty (0 bytes).")
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"File '{filename}' exceeds maximum size limit of 10MB.")

    file_bytes = file.file.read()

    # Step 1: Parse Text
    try:
        raw_text = parse_resume(file_bytes, filename)
    except ResumeParsingError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Extraction failed for '{filename}': {str(e)}")

    # Step 2: Extract Structured Information
    extracted = extract_structured_information(raw_text)

    # Step 3: Save file locally
    saved_path = save_upload_file(file)

    # Step 4: Create Candidate DB Record
    candidate = Candidate(
        name=extracted["name"],
        email=extracted["email"],
        phone=extracted["phone"],
        education=extracted["education"],
        experience=extracted["experience"],
        projects=extracted["projects"],
        certifications=extracted["certifications"],
        languages=extracted["languages"],
        raw_text=raw_text,
        resume_path=saved_path
    )
    db.add(candidate)
    db.flush()

    # Step 5: Associate Normalized Skills avoiding duplicates
    skill_names = extracted["skills"]
    attached_skill_names = []
    for sname in skill_names:
        norm_name = normalize_skill(sname)
        skill_obj = db.query(Skill).filter(Skill.name == norm_name).first()
        if not skill_obj:
            skill_obj = Skill(name=norm_name, category="technical")
            db.add(skill_obj)
            db.flush()
        if skill_obj not in candidate.skills:
            candidate.skills.append(skill_obj)
        attached_skill_names.append(norm_name)

    db.commit()
    db.refresh(candidate)

    return CandidateExtractionResponse(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        education=candidate.education,
        experience=candidate.experience,
        projects=candidate.projects,
        certifications=candidate.certifications,
        languages=candidate.languages,
        resume_path=candidate.resume_path,
        skills=attached_skill_names,
        created_at=candidate.created_at,
        extraction_status="success"
    )


@router.post("/upload/single", response_model=CandidateExtractionResponse, status_code=status.HTTP_201_CREATED)
def upload_single_resume(
    file: UploadFile = File(...),
    job_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Upload and process a single candidate resume (PDF or DOCX).
    Parses text, extracts contact info, skills, education, experience, and creates a database candidate profile.
    """
    return process_single_resume_data(file, db)


@router.post("/upload/bulk", response_model=BulkUploadSummary, status_code=status.HTTP_200_OK)
def upload_bulk_resumes(
    files: List[UploadFile] = File(...),
    job_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Process multiple candidate resumes in bulk.
    Errors in individual files do not interrupt processing for valid files in the batch.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for bulk processing.")

    successful_candidates: List[CandidateExtractionResponse] = []
    errors: List[BulkUploadErrorItem] = []
    candidate_ids: List[int] = []

    for file in files:
        try:
            cand_resp = process_single_resume_data(file, db)
            successful_candidates.append(cand_resp)
            candidate_ids.append(cand_resp.id)
        except HTTPException as he:
            errors.append(BulkUploadErrorItem(filename=file.filename or "unknown", error=str(he.detail)))
        except Exception as e:
            errors.append(BulkUploadErrorItem(filename=file.filename or "unknown", error=f"Unexpected error: {str(e)}"))

    return BulkUploadSummary(
        total_files=len(files),
        successful_files=len(successful_candidates),
        failed_files=len(errors),
        candidates_created=candidate_ids,
        candidates=successful_candidates,
        errors=errors
    )
