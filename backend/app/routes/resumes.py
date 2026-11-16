import os
import uuid
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Response
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.candidate import Candidate
from app.models.skill import Skill
from app.schemas.candidate import CandidateExtractionResponse, BulkUploadSummary, BulkUploadErrorItem
from app.services.resume_parser import parse_resume, ResumeParsingError
from app.services.resume_extractor import extract_structured_information, normalize_email
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


def process_single_resume_data(
    file: UploadFile,
    db: Session,
    update_existing: bool = False
) -> CandidateExtractionResponse:
    """
    Helper function to parse, extract, and save/update a single candidate resume.
    
    Duplicate Handling Strategy:
    - Normalizes extracted email address (lowercase + trimmed).
    - If email exists and update_existing is False: raises HTTP 409 Conflict with candidate details.
    - If email exists and update_existing is True: safely updates existing profile, preserves matching history.
    - If email is not detected: creates a new candidate record without merging (prevents false merges).
    """
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

    # Step 2: Extract Structured Information & Normalize Email
    extracted = extract_structured_information(raw_text)
    clean_email = normalize_email(extracted.get("email"))

    # Step 3: Check for Existing Candidate with Same Normalized Email
    existing_candidate = None
    if clean_email:
        existing_candidate = (
            db.query(Candidate)
            .filter(func.lower(Candidate.email) == clean_email)
            .order_by(Candidate.id.desc())
            .first()
        )

    # Step 4: Handle Duplicate Detection
    if existing_candidate:
        if not update_existing:
            cand_info = f"Candidate #{existing_candidate.id}"
            if existing_candidate.name:
                cand_info += f" ({existing_candidate.name})"
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Candidate profile with email '{clean_email}' already exists ({cand_info}). Set update_existing=true to update this profile."
            )

        # Update Workflow: Update existing profile cleanly
        saved_path = save_upload_file(file)
        if extracted.get("name"):
            existing_candidate.name = extracted["name"]
        existing_candidate.email = clean_email
        if extracted.get("phone"):
            existing_candidate.phone = extracted["phone"]
        if extracted.get("education"):
            existing_candidate.education = extracted["education"]
        if extracted.get("experience"):
            existing_candidate.experience = extracted["experience"]
        if extracted.get("projects"):
            existing_candidate.projects = extracted["projects"]
        if extracted.get("certifications"):
            existing_candidate.certifications = extracted["certifications"]
        if extracted.get("languages"):
            existing_candidate.languages = extracted["languages"]
        existing_candidate.raw_text = raw_text
        existing_candidate.resume_path = saved_path

        # Update/Merge Technical Skills
        skill_names = extracted.get("skills", [])
        for sname in skill_names:
            norm_name = normalize_skill(sname)
            skill_obj = db.query(Skill).filter(Skill.name == norm_name).first()
            if not skill_obj:
                skill_obj = Skill(name=norm_name, category="technical")
                db.add(skill_obj)
                db.flush()
            if skill_obj not in existing_candidate.skills:
                existing_candidate.skills.append(skill_obj)

        db.commit()
        db.refresh(existing_candidate)

        attached_skill_names = [s.name for s in existing_candidate.skills]
        return CandidateExtractionResponse(
            id=existing_candidate.id,
            name=existing_candidate.name,
            email=existing_candidate.email,
            phone=existing_candidate.phone,
            education=existing_candidate.education,
            experience=existing_candidate.experience,
            projects=existing_candidate.projects,
            certifications=existing_candidate.certifications,
            languages=existing_candidate.languages,
            resume_path=existing_candidate.resume_path,
            skills=attached_skill_names,
            created_at=existing_candidate.created_at,
            extraction_status="updated",
            is_updated=True
        )

    # Step 5: Save File and Create New Candidate Record
    saved_path = save_upload_file(file)
    candidate = Candidate(
        name=extracted.get("name"),
        email=clean_email,
        phone=extracted.get("phone"),
        education=extracted.get("education"),
        experience=extracted.get("experience"),
        projects=extracted.get("projects"),
        certifications=extracted.get("certifications"),
        languages=extracted.get("languages"),
        raw_text=raw_text,
        resume_path=saved_path
    )
    db.add(candidate)
    db.flush()

    # Step 6: Associate Normalized Skills avoiding duplicates
    skill_names = extracted.get("skills", [])
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
        extraction_status="success",
        is_updated=False
    )


@router.post("/upload/single", response_model=CandidateExtractionResponse, status_code=status.HTTP_201_CREATED)
def upload_single_resume(
    response: Response,
    file: UploadFile = File(...),
    job_id: Optional[int] = Form(None),
    update_existing: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Upload and process a single candidate resume (PDF or DOCX).
    Parses text, extracts contact info, skills, education, experience, and creates or updates a candidate profile.
    If a candidate with the same email already exists and update_existing is False, returns HTTP 409 Conflict.
    If update_existing is True, safely updates the existing candidate profile.
    """
    result = process_single_resume_data(file, db, update_existing=update_existing)
    if result.is_updated:
        response.status_code = status.HTTP_200_OK
    return result


@router.post("/upload/bulk", response_model=BulkUploadSummary, status_code=status.HTTP_200_OK)
def upload_bulk_resumes(
    files: List[UploadFile] = File(...),
    job_id: Optional[int] = Form(None),
    update_existing: bool = Form(False),
    db: Session = Depends(get_db)
):
    """
    Process multiple candidate resumes in bulk.
    Errors in individual files (such as duplicate candidate profiles or unparseable files)
    do not interrupt processing for other valid files in the batch.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided for bulk processing.")

    successful_candidates: List[CandidateExtractionResponse] = []
    errors: List[BulkUploadErrorItem] = []
    candidate_ids: List[int] = []

    for file in files:
        try:
            cand_resp = process_single_resume_data(file, db, update_existing=update_existing)
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
