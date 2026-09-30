from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.schemas.recommendation import RecommendationResponse

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/candidate/{candidate_id}", response_model=List[RecommendationResponse])
def get_candidate_recommendations(candidate_id: int, db: Session = Depends(get_db)):
    """
    Get job recommendations for a specific candidate.
    """
    # Shell structure: return empty list until recommendation engine is implemented
    return []
