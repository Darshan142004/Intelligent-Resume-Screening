from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.database.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.schemas.matching import CandidateRankingItem
from app.services.matching_orchestrator import MatchingOrchestrationService

router = APIRouter(prefix="/ranking", tags=["Ranking"])

orchestrator = MatchingOrchestrationService()


@router.get("/job/{job_id}", response_model=List[CandidateRankingItem])
def get_job_candidate_rankings(job_id: int, db: Session = Depends(get_db)):
    """
    Get candidate rankings for a specific job description.

    - Validates that the job exists (404 if not found).
    - Retrieves candidate records with preloaded skills to avoid N+1 queries.
    - Computes TF-IDF, Semantic, Skill Overlap, and Hybrid match scores.
    - Persists matching results in matching_results table idempotently.
    - Returns ranked candidate list ordered by hybrid match score descending.
    """
    # 1. Validate job exists
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
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID {job_id} not found."
        )

    # 2. Retrieve actual candidates with preloaded skills
    candidates = (
        db.query(Candidate)
        .options(selectinload(Candidate.skills))
        .all()
    )

    if not candidates:
        return []

    # 3. Calculate scores and rankings via orchestration service
    rankings = orchestrator.rank_candidates_for_job(
        db=db,
        job=job,
        candidates=candidates,
        persist=True
    )

    return rankings
