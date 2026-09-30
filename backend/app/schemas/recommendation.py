from typing import List, Optional
from pydantic import BaseModel
from app.schemas.job import JobResponse


class RecommendationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    score: float
    reason: Optional[str] = None
    job: Optional[JobResponse] = None

    class Config:
        from_attributes = True
