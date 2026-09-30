from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.job import Job
from app.schemas.job import JobCreate, JobResponse

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=List[JobResponse])
def get_jobs(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    List all created job descriptions.
    """
    jobs = db.query(Job).offset(skip).limit(limit).all()
    return jobs


@router.post("", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
def create_job(job_in: JobCreate, db: Session = Depends(get_db)):
    """
    Create a new job description with required and preferred skills.
    """
    new_job = Job(
        title=job_in.title,
        company=job_in.company,
        description=job_in.description,
        experience_required=job_in.experience_required,
        education_required=job_in.education_required,
        domain=job_in.domain
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.get("/{job_id}", response_model=JobResponse)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    """
    Get job description details by ID.
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
