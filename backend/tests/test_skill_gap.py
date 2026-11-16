import pytest
from app.services.skill_gap import SkillGapAnalysisService
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.skill import Skill


def test_matched_and_missing_required_skills():
    """Verify correct identification of matched and missing required skills."""
    service = SkillGapAnalysisService()

    candidate_skills = ["Python", "FastAPI", "Docker"]
    required_skills = ["Python", "FastAPI", "PostgreSQL", "Docker"]
    preferred_skills = []

    result = service.analyze_skill_gap(candidate_skills, required_skills, preferred_skills)

    assert result["matched_required_skills"] == ["Docker", "FastAPI", "Python"]
    assert result["missing_required_skills"] == ["PostgreSQL"]
    assert result["matched_preferred_skills"] == []
    assert result["missing_preferred_skills"] == []
    # 3 out of 4 required matched (0.75), preferred is empty -> 0.75
    assert result["required_match_ratio"] == 0.75
    assert result["preferred_match_ratio"] == 0.0
    assert result["skill_overlap_score"] == 0.75


def test_matched_and_missing_preferred_skills():
    """Verify correct identification of matched and missing preferred skills."""
    service = SkillGapAnalysisService()

    candidate_skills = ["AWS", "Redis"]
    required_skills = []
    preferred_skills = ["AWS", "Kubernetes", "Redis", "Kafka"]

    result = service.analyze_skill_gap(candidate_skills, required_skills, preferred_skills)

    assert result["matched_required_skills"] == []
    assert result["missing_required_skills"] == []
    assert result["matched_preferred_skills"] == ["AWS", "Redis"]
    assert result["missing_preferred_skills"] == ["Kafka", "Kubernetes"]
    # 2 out of 4 preferred matched (0.50), required is empty -> 0.50
    assert result["required_match_ratio"] == 0.0
    assert result["preferred_match_ratio"] == 0.50
    assert result["skill_overlap_score"] == 0.50


def test_both_required_and_preferred_composite_score():
    """Verify score calculation when both required and preferred skills are present."""
    service = SkillGapAnalysisService(required_weight=0.70, preferred_weight=0.30)

    # 2/2 required matched = 1.0; 1/2 preferred matched = 0.5
    # Composite: 0.70 * 1.0 + 0.30 * 0.5 = 0.70 + 0.15 = 0.85
    candidate_skills = ["Python", "FastAPI", "AWS"]
    required_skills = ["Python", "FastAPI"]
    preferred_skills = ["AWS", "Kubernetes"]

    result = service.analyze_skill_gap(candidate_skills, required_skills, preferred_skills)

    assert result["matched_required_skills"] == ["FastAPI", "Python"]
    assert result["missing_required_skills"] == []
    assert result["matched_preferred_skills"] == ["AWS"]
    assert result["missing_preferred_skills"] == ["Kubernetes"]
    assert result["required_match_ratio"] == 1.0
    assert result["preferred_match_ratio"] == 0.5
    assert result["skill_overlap_score"] == 0.85


def test_empty_skill_lists():
    """Verify edge cases when candidate skills or job skills are completely empty."""
    service = SkillGapAnalysisService()

    # Both candidate and job skills empty
    res1 = service.analyze_skill_gap([], [], [])
    assert res1["skill_overlap_score"] == 0.0
    assert res1["matched_required_skills"] == []
    assert res1["missing_required_skills"] == []
    assert res1["matched_preferred_skills"] == []
    assert res1["missing_preferred_skills"] == []

    # Candidate has skills, but job has no skills specified
    res2 = service.analyze_skill_gap(["Python", "SQL"], [], [])
    assert res2["skill_overlap_score"] == 0.0
    assert res2["matched_skills"] == []
    assert res2["missing_skills"] == []

    # Candidate has empty skills, but job requires skills
    res3 = service.analyze_skill_gap([], ["Python", "SQL"], ["Docker"])
    assert res3["skill_overlap_score"] == 0.0
    assert res3["matched_required_skills"] == []
    assert res3["missing_required_skills"] == ["Python", "SQL"]
    assert res3["matched_preferred_skills"] == []
    assert res3["missing_preferred_skills"] == ["Docker"]

    # None inputs handled safely
    res4 = service.analyze_skill_gap(None, None, None)
    assert res4["skill_overlap_score"] == 0.0


def test_skill_normalization_and_alias_mapping():
    """Verify that skill aliases are normalized to canonical vocabulary before matching."""
    service = SkillGapAnalysisService()

    # Candidate has aliases: "py", "k8s", "c++", "dl"
    # Job requires canonical: "Python", "Kubernetes", "C++", "Deep Learning"
    candidate_skills = ["py", "k8s", "c++", "dl"]
    required_skills = ["Python", "Kubernetes"]
    preferred_skills = ["C++", "Deep Learning"]

    result = service.analyze_skill_gap(candidate_skills, required_skills, preferred_skills)

    assert result["matched_required_skills"] == ["Kubernetes", "Python"]
    assert result["missing_required_skills"] == []
    assert result["matched_preferred_skills"] == ["C++", "Deep Learning"]
    assert result["missing_preferred_skills"] == []
    assert result["skill_overlap_score"] == 1.0


def test_skill_service_weight_validation():
    """Verify validation of required and preferred weights in SkillGapAnalysisService."""
    # Valid custom weights summing to 1.0
    service = SkillGapAnalysisService(required_weight=0.80, preferred_weight=0.20)
    assert service.required_weight == 0.80
    assert service.preferred_weight == 0.20

    # Invalid weights not summing to 1.0
    with pytest.raises(ValueError, match="must sum to 1.0"):
        SkillGapAnalysisService(required_weight=0.50, preferred_weight=0.30)

    # Negative weights
    with pytest.raises(ValueError, match="non-negative"):
        SkillGapAnalysisService(required_weight=-0.20, preferred_weight=1.20)


def test_skill_gap_analysis_with_sqlalchemy_models():
    """Verify skill gap analysis directly with Candidate, Job, and Skill SQLAlchemy models."""
    service = SkillGapAnalysisService()

    skill_py = Skill(name="Python", category="technical")
    skill_fastapi = Skill(name="FastAPI", category="technical")
    skill_pg = Skill(name="PostgreSQL", category="technical")
    skill_docker = Skill(name="Docker", category="technical")
    skill_k8s = Skill(name="Kubernetes", category="technical")

    candidate = Candidate(
        name="Alice Developer",
        skills=[skill_py, skill_fastapi, skill_docker]
    )

    job = Job(
        title="Senior Python Backend Engineer",
        required_skills=[skill_py, skill_fastapi, skill_pg],
        preferred_skills=[skill_docker, skill_k8s]
    )

    result = service.analyze_candidate_job_gap(candidate, job)

    assert result["matched_required_skills"] == ["FastAPI", "Python"]
    assert result["missing_required_skills"] == ["PostgreSQL"]
    assert result["matched_preferred_skills"] == ["Docker"]
    assert result["missing_preferred_skills"] == ["Kubernetes"]
    assert result["required_match_ratio"] == round(2 / 3, 4)
    assert result["preferred_match_ratio"] == 0.5
    # Composite: 0.70 * (2/3) + 0.30 * 0.5 = 0.4667 + 0.15 = 0.6167
    expected_score = round(0.70 * (2 / 3) + 0.30 * 0.5, 4)
    assert result["skill_overlap_score"] == expected_score

    # Model helper method
    score_only = service.compute_candidate_job_skill_score(candidate, job)
    assert score_only == expected_score

