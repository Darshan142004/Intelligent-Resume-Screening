from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class SkillBase(BaseModel):
    name: str
    category: Optional[str] = "technical"


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int

    class Config:
        from_attributes = True


class JobBase(BaseModel):
    title: str
    company: str
    description: str
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    domain: Optional[str] = None


class JobCreate(JobBase):
    required_skills: List[str] = []
    preferred_skills: List[str] = []


class JobResponse(JobBase):
    id: int
    created_at: datetime
    required_skills: List[SkillResponse] = []
    preferred_skills: List[SkillResponse] = []

    class Config:
        from_attributes = True
