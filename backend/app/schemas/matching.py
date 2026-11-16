from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class MatchingResultResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    tfidf_score: Optional[float] = 0.0
    semantic_score: Optional[float] = 0.0
    skill_score: Optional[float] = 0.0
    hybrid_score: Optional[float] = 0.0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SkillGapResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    skill: str
    gap_type: str

    model_config = ConfigDict(from_attributes=True)


class CandidateRankingItem(BaseModel):
    candidate_id: int
    candidate_name: Optional[str] = None
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    job_id: int
    tfidf_score: float
    semantic_score: float
    skill_score: float
    hybrid_score: float
    rank: int
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    matched_required_skills: List[str] = []
    missing_required_skills: List[str] = []
    matched_preferred_skills: List[str] = []
    missing_preferred_skills: List[str] = []
    duplicate_count: int = 1

    model_config = ConfigDict(from_attributes=True)


class CandidateSummary(BaseModel):
    id: int
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    skills: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class JobSummary(BaseModel):
    id: int
    title: str
    company: str
    description: Optional[str] = None
    experience_required: Optional[str] = None
    education_required: Optional[str] = None
    domain: Optional[str] = None
    required_skills: List[str] = []
    preferred_skills: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class CandidateJobComparisonResponse(BaseModel):
    candidate_id: int
    job_id: int
    candidate: CandidateSummary
    job: JobSummary
    tfidf_score: float
    semantic_score: float
    skill_score: float
    skill_overlap_score: float
    hybrid_score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    matched_required_skills: List[str] = []
    missing_required_skills: List[str] = []
    matched_preferred_skills: List[str] = []
    missing_preferred_skills: List[str] = []
    duplicate_count: int = 1

    model_config = ConfigDict(from_attributes=True)
