from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.database.database import get_db
from app.models.candidate import Candidate
from app.models.job import Job
from app.schemas.matching import (
    CandidateJobComparisonResponse,
    CandidateSummary,
    JobSummary
)
from app.services.matching_orchestrator import MatchingOrchestrationService

router = APIRouter(prefix="/analysis", tags=["Skill Gap Analysis & Comparison"])

orchestrator = MatchingOrchestrationService()


@router.get(
    "/skill-gap/{candidate_id}/{job_id}",
    response_model=CandidateJobComparisonResponse
)
@router.get(
    "/compare/{candidate_id}/{job_id}",
    response_model=CandidateJobComparisonResponse
)
def compare_candidate_to_job(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db)
):
    """
    Detailed candidate-to-job NLP matching and skill gap comparison.

    Returns:
    - Candidate details (name, contact, extracted skills, experience)
    - Job details (title, company, required skills, preferred skills)
    - TF-IDF lexical match score
    - Dense semantic similarity score
    - Structured skill overlap score
    - Composite hybrid match score
    - Breakdown of matched skills, missing required skills, and missing preferred skills
    """
    # 1. Validate candidate exists
    candidate = (
        db.query(Candidate)
        .options(selectinload(Candidate.skills))
        .filter(Candidate.id == candidate_id)
        .first()
    )
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found."
        )

    # 2. Validate job exists
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

    # 3. Execute matching and idempotent result persistence
    match_result = orchestrator.match_candidate_and_job(
        db=db,
        candidate=candidate,
        job=job,
        persist=True
    )

    # 4. Construct candidate and job summaries
    candidate_summary = CandidateSummary(
        id=candidate.id,
        name=candidate.name,
        email=candidate.email,
        phone=candidate.phone,
        education=candidate.education,
        experience=candidate.experience,
        skills=[s.name for s in candidate.skills] if candidate.skills else []
    )

    job_summary = JobSummary(
        id=job.id,
        title=job.title,
        company=job.company,
        description=job.description,
        experience_required=job.experience_required,
        education_required=job.education_required,
        domain=job.domain,
        required_skills=[s.name for s in job.required_skills] if job.required_skills else [],
        preferred_skills=[s.name for s in job.preferred_skills] if job.preferred_skills else []
    )

    return CandidateJobComparisonResponse(
        candidate_id=candidate.id,
        job_id=job.id,
        candidate=candidate_summary,
        job=job_summary,
        tfidf_score=match_result["tfidf_score"],
        semantic_score=match_result["semantic_score"],
        skill_score=match_result["skill_score"],
        skill_overlap_score=match_result["skill_overlap_score"],
        hybrid_score=match_result["hybrid_score"],
        matched_skills=match_result["matched_skills"],
        missing_skills=match_result["missing_skills"],
        matched_required_skills=match_result["matched_required_skills"],
        missing_required_skills=match_result["missing_required_skills"],
        matched_preferred_skills=match_result["matched_preferred_skills"],
        missing_preferred_skills=match_result["missing_preferred_skills"]
    )
