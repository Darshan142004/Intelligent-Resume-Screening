from app.database.database import Base
from app.models.user import User
from app.models.job import Job, job_required_skills, job_preferred_skills
from app.models.skill import Skill
from app.models.candidate import Candidate, candidate_skills
from app.models.matching import MatchingResult, SkillGap
from app.models.recommendation import Recommendation

__all__ = [
    "Base",
    "User",
    "Job",
    "job_required_skills",
    "job_preferred_skills",
    "Skill",
    "Candidate",
    "candidate_skills",
    "MatchingResult",
    "SkillGap",
    "Recommendation"
]
