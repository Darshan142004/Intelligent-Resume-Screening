from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.database.database import get_db
from app.models.job import Job
from app.models.skill import Skill
from app.schemas.job import JobCreate, JobResponse
from app.services.skill_vocabulary import normalize_skill

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def process_skill_list(db: Session, raw_skills: List[str]) -> List[Skill]:
    """
    Normalizes skills, reuses existing Skill records, creates missing ones,
    and prevents duplicate entries in the returned list.
    """
    if not raw_skills:
        return []

    skill_objects: List[Skill] = []
    seen_names = set()

    for raw in raw_skills:
        if not raw or not isinstance(raw, str):
            continue
        cleaned = raw.strip()
        if not cleaned:
            continue

        normalized_name = normalize_skill(cleaned)
        if normalized_name in seen_names:
            continue
        seen_names.add(normalized_name)

        skill_obj = db.query(Skill).filter(Skill.name == normalized_name).first()
        if not skill_obj:
            skill_obj = Skill(name=normalized_name, category="technical")
            db.add(skill_obj)
            db.flush()

        skill_objects.append(skill_obj)

    return skill_objects


@router.get("", response_model=List[JobResponse])
def get_jobs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    List all created job descriptions.
    """
    jobs = (
        db.query(Job)
        .options(
            selectinload(Job.required_skills),
            selectinload(Job.preferred_skills)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return jobs


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    """
    Create a new job description with required and preferred skills.
    Prevents duplicate entries if an identical job (same title, company, and description) already exists.
    """
    try:
        # Check if identical job posting already exists (same title, company, and description)
        existing_job = (
            db.query(Job)
            .options(
                selectinload(Job.required_skills),
                selectinload(Job.preferred_skills)
            )
            .filter(
                Job.title == job_in.title,
                Job.company == job_in.company,
                Job.description == job_in.description
            )
            .first()
        )
        if existing_job:
            # Update attributes and skills idempotently without duplicating job record
            existing_job.experience_required = job_in.experience_required
            existing_job.education_required = job_in.education_required
            existing_job.domain = job_in.domain
            if job_in.required_skills is not None:
                existing_job.required_skills = process_skill_list(db, job_in.required_skills)
            if job_in.preferred_skills is not None:
                existing_job.preferred_skills = process_skill_list(db, job_in.preferred_skills)
            db.commit()
            db.refresh(existing_job)
            return existing_job

        new_job = Job(
            title=job_in.title,
            company=job_in.company,
            description=job_in.description,
            experience_required=job_in.experience_required,
            education_required=job_in.education_required,
            domain=job_in.domain
        )
        db.add(new_job)
        db.flush()

        if job_in.required_skills:
            new_job.required_skills = process_skill_list(db, job_in.required_skills)

        if job_in.preferred_skills:
            new_job.preferred_skills = process_skill_list(db, job_in.preferred_skills)

        db.commit()
        db.refresh(new_job)
        return new_job
    except Exception:
        db.rollback()
        raise


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    """
    Get job description details by ID.
    """
    job = (
        db.query(Job)
        .options(
            selectinload(Job.required_skills),
            selectinload(Job.preferred_skills)
        )
        .filter(Job.id == job_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a job description.
    Cascades safely to job_required_skills, job_preferred_skills,
    matching_results, recommendations, and skill_gaps.
    Shared Skill entities are preserved.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found."
        )

    job_title = job.title
    job_company = job.company or "N/A"

    db.delete(job)
    db.commit()

    return {
        "success": True,
        "message": f"Job #{job_id} ('{job_title}' at {job_company}) was permanently deleted successfully.",
        "job_id": job_id
    }

