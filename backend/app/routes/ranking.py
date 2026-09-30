from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.matching import CandidateRankingItem

router = APIRouter(prefix="/ranking", tags=["Ranking"])


@router.get("/job/{job_id}", response_model=List[CandidateRankingItem])
def get_job_candidate_rankings(job_id: int, db: Session = Depends(get_db)):
    """
    Get candidate rankings for a specific job description.
    """
    # Shell structure: return empty list until matching logic is implemented
    return []
