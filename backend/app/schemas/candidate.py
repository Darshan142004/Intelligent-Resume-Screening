from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.job import SkillResponse


class CandidateBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None


class CandidateCreate(CandidateBase):
    resume_path: Optional[str] = None
    skills: List[str] = []


class CandidateResponse(CandidateBase):
    id: int
    resume_path: Optional[str] = None
    created_at: datetime
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True
