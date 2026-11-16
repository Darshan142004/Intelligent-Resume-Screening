import pytest
import numpy as np
from app.services.hybrid_matcher import HybridMatcherService
from app.models.candidate import Candidate
from app.models.job import Job
from tests.conftest import get_or_create_skill


def test_hybrid_score_calculation_default_experimental_weights():
    """
    Verify the hybrid score calculation using initial experimental weights:
    TF-IDF: 0.25, Semantic: 0.45, Skill Overlap: 0.30.
    """
    service = HybridMatcherService()

    # Case 1: 0.25 * 0.40 + 0.45 * 0.60 + 0.30 * 0.80 = 0.10 + 0.27 + 0.24 = 0.61
    score = service.compute_hybrid_score(
        tfidf_score=0.40,
        semantic_score=0.60,
        skill_score=0.80
    )
    assert np.isclose(score, 0.61, atol=1e-4)

    # Case 2: Perfect matches across all components
    perfect_score = service.compute_hybrid_score(1.0, 1.0, 1.0)
    assert np.isclose(perfect_score, 1.0, atol=1e-4)

    # Case 3: Zero matches across all components
    zero_score = service.compute_hybrid_score(0.0, 0.0, 0.0)
    assert np.isclose(zero_score, 0.0, atol=1e-4)


def test_custom_weight_configuration():
    """Verify configuring custom valid weights summing to 1.0."""
    service = HybridMatcherService(
        tfidf_weight=0.20,
        semantic_weight=0.50,
        skill_weight=0.30
    )
    assert service.tfidf_weight == 0.20
    assert service.semantic_weight == 0.50
    assert service.skill_weight == 0.30

    # 0.20 * 0.5 + 0.50 * 0.8 + 0.30 * 0.6 = 0.10 + 0.40 + 0.18 = 0.68
    score = service.compute_hybrid_score(0.5, 0.8, 0.6)
    assert np.isclose(score, 0.68, atol=1e-4)


def test_weight_validation_sum_must_equal_one():
    """Verify that weights not summing to 1.0 raise ValueError."""
    with pytest.raises(ValueError, match="must sum to 1.0"):
        HybridMatcherService(tfidf_weight=0.3, semantic_weight=0.3, skill_weight=0.3)

    with pytest.raises(ValueError, match="must sum to 1.0"):
        HybridMatcherService(tfidf_weight=0.5, semantic_weight=0.5, skill_weight=0.5)


def test_weight_validation_non_negative_and_types():
    """Verify that negative or non-numeric weights raise errors."""
    with pytest.raises(ValueError, match="non-negative"):
        HybridMatcherService(tfidf_weight=-0.1, semantic_weight=0.6, skill_weight=0.5)

    with pytest.raises(TypeError, match="must be numeric"):
        HybridMatcherService(tfidf_weight="0.25", semantic_weight=0.45, skill_weight=0.30)

    with pytest.raises(TypeError, match="must be numeric"):
        HybridMatcherService(tfidf_weight=True, semantic_weight=0.0, skill_weight=0.0)


def test_invalid_input_scores_raise_value_errors():
    """Verify that out-of-range, NaN, Inf, None, or invalid type scores are rejected."""
    service = HybridMatcherService()

    # Out of range scores (< 0.0 or > 1.0)
    with pytest.raises(ValueError, match="between 0.0 and 1.0"):
        service.compute_hybrid_score(-0.01, 0.5, 0.5)

    with pytest.raises(ValueError, match="between 0.0 and 1.0"):
        service.compute_hybrid_score(0.5, 1.05, 0.5)

    with pytest.raises(ValueError, match="between 0.0 and 1.0"):
        service.compute_hybrid_score(0.5, 0.5, 2.0)

    # None inputs
    with pytest.raises(ValueError, match="cannot be None"):
        service.compute_hybrid_score(None, 0.5, 0.5)

    with pytest.raises(ValueError, match="cannot be None"):
        service.compute_hybrid_score(0.5, None, 0.5)

    with pytest.raises(ValueError, match="cannot be None"):
        service.compute_hybrid_score(0.5, 0.5, None)

    # NaN / Inf inputs
    with pytest.raises(ValueError, match="finite number"):
        service.compute_hybrid_score(float("nan"), 0.5, 0.5)

    with pytest.raises(ValueError, match="finite number"):
        service.compute_hybrid_score(0.5, float("inf"), 0.5)

    # Non-numeric inputs
    with pytest.raises(TypeError, match="must be numeric"):
        service.compute_hybrid_score("0.5", 0.5, 0.5)

    with pytest.raises(TypeError, match="must be numeric"):
        service.compute_hybrid_score(True, 0.5, 0.5)


def test_score_boundaries_and_clamping():
    """Verify score boundary edges at 0.0 and 1.0."""
    service = HybridMatcherService()

    assert service.compute_hybrid_score(0.0, 0.0, 0.0) == 0.0
    assert service.compute_hybrid_score(1.0, 1.0, 1.0) == 1.0
    assert 0.0 <= service.compute_hybrid_score(0.0001, 0.0001, 0.0001) <= 1.0


def test_service_integration_with_persisted_sqlalchemy_models(db_session):
    """
    Phase 5 & 6 Integration Test:
    Ensures all 3 matching engines work seamlessly together with actual Candidate,
    Job, and Skill SQLAlchemy models persisted in the isolated test database.
    """
    # 1. Create or retrieve normalized skills in the isolated test database
    skill_py = get_or_create_skill(db_session, "Python")
    skill_fastapi = get_or_create_skill(db_session, "FastAPI")
    skill_docker = get_or_create_skill(db_session, "Docker")
    skill_k8s = get_or_create_skill(db_session, "Kubernetes")

    # 2. Create Candidate with real skills and raw text
    candidate = Candidate(
        name="John Doe",
        email="john.doe@testdb.org",
        raw_text=(
            "Experienced Python backend developer skilled in building RESTful APIs using FastAPI, "
            "PostgreSQL database management, and deploying microservices with Docker containerization."
        ),
        skills=[skill_py, skill_fastapi, skill_docker]
    )
    db_session.add(candidate)

    # 3. Create Job with required and preferred skills and description
    job = Job(
        title="Senior Python Backend Engineer",
        company="TechCorp Innovations",
        description=(
            "We are seeking a Python backend engineer with strong expertise in FastAPI, "
            "PostgreSQL, and Docker to build and maintain high-performance microservices."
        ),
        required_skills=[skill_py, skill_fastapi],
        preferred_skills=[skill_docker, skill_k8s]
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(candidate)
    db_session.refresh(job)

    # 4. Execute full matching pipeline
    hybrid_service = HybridMatcherService()
    match_result = hybrid_service.match_candidate_job(candidate, job)

    assert match_result["candidate_id"] == candidate.id
    assert match_result["job_id"] == job.id

    # Verify component scores are in [0.0, 1.0] and non-zero for well-matched candidate
    assert 0.0 < match_result["tfidf_score"] <= 1.0
    assert 0.0 < match_result["semantic_score"] <= 1.0
    assert 0.0 < match_result["skill_score"] <= 1.0
    assert 0.0 < match_result["hybrid_score"] <= 1.0

    # Verify skill gap breakdown
    assert "Python" in match_result["matched_required_skills"]
    assert "FastAPI" in match_result["matched_required_skills"]
    assert match_result["missing_required_skills"] == []
    assert "Docker" in match_result["matched_preferred_skills"]
    assert "Kubernetes" in match_result["missing_preferred_skills"]

    # Verify mathematical formula of hybrid score
    expected_hybrid = round(
        (0.25 * match_result["tfidf_score"]) +
        (0.45 * match_result["semantic_score"]) +
        (0.30 * match_result["skill_score"]),
        4
    )
    assert np.isclose(match_result["hybrid_score"], expected_hybrid, atol=1e-4)

