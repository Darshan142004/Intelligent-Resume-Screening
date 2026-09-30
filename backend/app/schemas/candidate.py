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
    projects: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = None


class CandidateCreate(CandidateBase):
    raw_text: Optional[str] = None
    resume_path: Optional[str] = None
    skills: List[str] = []


class CandidateResponse(CandidateBase):
    id: int
    raw_text: Optional[str] = None
    resume_path: Optional[str] = None
    created_at: datetime
    skills: List[SkillResponse] = []

    class Config:
        from_attributes = True


class CandidateExtractionResponse(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    projects: Optional[str] = None
    certifications: Optional[str] = None
    languages: Optional[str] = None
    resume_path: Optional[str] = None
    skills: List[str] = []
    created_at: datetime
    extraction_status: str = "success"

    class Config:
        from_attributes = True


class BulkUploadErrorItem(BaseModel):
    filename: str
    error: str


class BulkUploadSummary(BaseModel):
    total_files: int
    successful_files: int
    failed_files: int
    candidates_created: List[int] = []
    candidates: List[CandidateExtractionResponse] = []
    errors: List[BulkUploadErrorItem] = []
