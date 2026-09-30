from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateResponse

router = APIRouter(prefix="/candidates", tags=["Candidates"])


@router.get("", response_model=List[CandidateResponse])
def get_candidates(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """
    Get all extracted candidate profiles.
    """
    candidates = db.query(Candidate).offset(skip).limit(limit).all()
    return candidates


@router.get("/{candidate_id}", response_model=CandidateResponse)
def get_candidate_profile(candidate_id: int, db: Session = Depends(get_db)):
    """
    Get candidate profile details by ID.
    """
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate
