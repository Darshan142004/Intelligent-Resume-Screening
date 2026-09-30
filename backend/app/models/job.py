from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.database.database import Base

job_required_skills = Table(
    "job_required_skills",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
)

job_preferred_skills = Table(
    "job_preferred_skills",
    Base.metadata,
    Column("job_id", Integer, ForeignKey("jobs.id", ondelete="CASCADE"), primary_key=True),
    Column("skill_id", Integer, ForeignKey("skills.id", ondelete="CASCADE"), primary_key=True)
)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    company = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    experience_required = Column(String(50), nullable=True)
    education_required = Column(String(100), nullable=True)
    domain = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    required_skills = relationship("Skill", secondary=job_required_skills, backref="jobs_required")
    preferred_skills = relationship("Skill", secondary=job_preferred_skills, backref="jobs_preferred")
