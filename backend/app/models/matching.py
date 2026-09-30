from datetime import datetime, timezone
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.database import Base


class MatchingResult(Base):
    __tablename__ = "matching_results"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    tfidf_score = Column(Float, nullable=True)
    semantic_score = Column(Float, nullable=True)
    skill_score = Column(Float, nullable=True)
    hybrid_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate")
    job = relationship("Job")


class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    skill = Column(String(100), nullable=False)
    gap_type = Column(String(50), nullable=False)  # missing_required, missing_preferred

    candidate = relationship("Candidate")
    job = relationship("Job")
