from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from app.database.database import get_db
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateResponse
from app.services.matching_orchestrator import MatchingOrchestrationService
from app.services.resume_extractor import normalize_email

router = APIRouter(prefix="/candidates", tags=["Candidates"])
orchestrator = MatchingOrchestrationService()


@router.get("", response_model=List[CandidateResponse])
def get_candidates(
    skip: int = 0,
    limit: int = 100,
    unique: bool = Query(True, description="Return deduplicated representative candidates per normalized email"),
    db: Session = Depends(get_db)
):
    """
    Get extracted candidate profiles.
    When unique=True (default), groups candidates by normalized email and selects
    the best representative using deterministic fitness (identical to recruiter ranking).
    Candidates without an email remain independent.
    """
    if unique:
        candidates = (
            db.query(Candidate)
            .options(selectinload(Candidate.skills))
            .all()
        )
        if not candidates:
            return []
        representatives = orchestrator.select_unique_representatives(candidates)
        representatives.sort(key=lambda c: c.id)
        for r in representatives:
            setattr(r, "duplicate_count", getattr(r, "_duplicate_count", 1))
        return representatives[skip : skip + limit]
    else:
        candidates = (
            db.query(Candidate)
            .options(selectinload(Candidate.skills))
            .offset(skip)
            .limit(limit)
            .all()
        )
        for c in candidates:
            setattr(c, "duplicate_count", 1)
        return candidates


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate_profile(candidate_id: int, db: Session = Depends(get_db)):
    """
    Get candidate profile details by ID.
    Preloads skills and aggregates duplicate count and sibling skills in-memory.
    """
    candidate = (
        db.query(Candidate)
        .options(selectinload(Candidate.skills))
        .filter(Candidate.id == candidate_id)
        .first()
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # If the candidate has sibling profiles with the same normalized email, count them and aggregate skills in-memory
    if getattr(candidate, "email", None):
        norm_email = normalize_email(candidate.email)
        if norm_email:
            siblings = (
                db.query(Candidate)
                .options(selectinload(Candidate.skills))
                .filter(func.lower(Candidate.email) == norm_email)
                .all()
            )
            setattr(candidate, "duplicate_count", len(siblings))
            existing_skill_ids = {s.id for s in (candidate.skills or []) if hasattr(s, "id")}
            aggregated_skills = list(candidate.skills or [])
            for s_cand in siblings:
                for s in (s_cand.skills or []):
                    s_id = getattr(s, "id", None)
                    if s_id and s_id not in existing_skill_ids:
                        existing_skill_ids.add(s_id)
                        aggregated_skills.append(s)
            candidate.skills = aggregated_skills
    else:
        setattr(candidate, "duplicate_count", 1)

    return candidate


@router.delete("/{candidate_id}", status_code=status.HTTP_200_OK)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a candidate from the system.
    Cascades to candidate_skills, matching_results, skill_gaps, and recommendations.
    Optionally removes uploaded resume file if present.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate with ID {candidate_id} not found."
        )

    cand_name = candidate.name or f"Candidate #{candidate.id}"
    resume_path = candidate.resume_path

    # Delete candidate record (cascades automatically via ON DELETE CASCADE)
    db.delete(candidate)
    db.commit()

    # Safely remove resume file if it exists
    if resume_path:
        try:
            import os
            if os.path.isfile(resume_path):
                os.remove(resume_path)
        except Exception:
            pass

    return {
        "success": True,
        "message": f"Candidate #{candidate_id} ({cand_name}) was permanently deleted successfully.",
        "candidate_id": candidate_id
    }

