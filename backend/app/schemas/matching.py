from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class MatchingResultResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    tfidf_score: Optional[float] = 0.0
    semantic_score: Optional[float] = 0.0
    skill_score: Optional[float] = 0.0
    hybrid_score: Optional[float] = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


class SkillGapResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    skill: str
    gap_type: str

    class Config:
        from_attributes = True


class CandidateRankingItem(BaseModel):
    candidate_id: int
    candidate_name: Optional[str]
    job_id: int
    tfidf_score: float
    semantic_score: float
    skill_score: float
    hybrid_score: float
    rank: int
    matched_skills: List[str] = []
    missing_skills: List[str] = []
