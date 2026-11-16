import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.skill import Skill
from app.models.matching import MatchingResult
from tests.conftest import get_or_create_skill

client = TestClient(app)


def test_candidate_job_comparison_success(db_session):
    """
    Verify candidate vs selected job comparison API:
    - Returns candidate details and job details.
    - Returns TF-IDF, Semantic, Skill Overlap, and Hybrid scores.
    - Returns matched skills, missing required skills, and missing preferred skills.
    - Verified on both /analysis/skill-gap/ and /analysis/compare/ endpoints.
    """
    skill_py = get_or_create_skill(db_session, "Python")
    skill_fastapi = get_or_create_skill(db_session, "FastAPI")
    skill_docker = get_or_create_skill(db_session, "Docker")
    skill_aws = get_or_create_skill(db_session, "AWS")

    job = Job(
        title="Full Stack Python Engineer",
        company="Alpha Systems",
        description="Looking for a Python backend engineer with FastAPI and Docker experience.",
        experience_required="3+ years",
        education_required="B.S. in Computer Science",
        domain="Web Development",
        required_skills=[skill_py, skill_fastapi],
        preferred_skills=[skill_docker, skill_aws]
    )
    cand = Candidate(
        name="Elena Rostova",
        email="elena@example.com",
        phone="+1-555-0199",
        education="M.S. Software Engineering",
        experience="4 years building backend APIs with Python and FastAPI, containerizing with Docker.",
        raw_text="Elena Rostova. Backend software engineer. Skills: Python, FastAPI, Docker. 4 years building APIs.",
        skills=[skill_py, skill_fastapi, skill_docker]
    )
    db_session.add_all([job, cand])
    db_session.commit()

    # Call /analysis/skill-gap/{candidate_id}/{job_id}
    res_gap = client.get(f"/api/v1/analysis/skill-gap/{cand.id}/{job.id}")
    assert res_gap.status_code == 200
    data = res_gap.json()

    assert data["candidate_id"] == cand.id
    assert data["job_id"] == job.id

    # Check candidate details
    assert data["candidate"]["name"] == "Elena Rostova"
    assert data["candidate"]["email"] == "elena@example.com"
    assert "Python" in data["candidate"]["skills"]

    # Check job details
    assert data["job"]["title"] == "Full Stack Python Engineer"
    assert data["job"]["company"] == "Alpha Systems"
    assert "Python" in data["job"]["required_skills"]
    assert "AWS" in data["job"]["preferred_skills"]

    # Check scores
    assert 0.0 < data["tfidf_score"] <= 1.0
    assert 0.0 < data["semantic_score"] <= 1.0
    assert 0.0 < data["skill_score"] <= 1.0
    assert data["skill_score"] == data["skill_overlap_score"]
    assert 0.0 < data["hybrid_score"] <= 1.0

    # Check skill gap analysis
    assert "Python" in data["matched_required_skills"]
    assert "FastAPI" in data["matched_required_skills"]
    assert data["missing_required_skills"] == []
    assert "Docker" in data["matched_preferred_skills"]
    assert "AWS" in data["missing_preferred_skills"]

    # Call alias /analysis/compare/{candidate_id}/{job_id}
    res_cmp = client.get(f"/api/v1/analysis/compare/{cand.id}/{job.id}")
    assert res_cmp.status_code == 200
    assert res_cmp.json() == data


def test_comparison_invalid_candidate_id(db_session):
    """Verify that comparing a non-existent candidate ID returns 404."""
    job = Job(
        title="Test Job",
        company="Test Company",
        description="Job for testing."
    )
    db_session.add(job)
    db_session.commit()

    response = client.get(f"/api/v1/analysis/skill-gap/999999/{job.id}")
    assert response.status_code == 404
    assert "candidate with id 999999 not found" in response.json()["detail"].lower()


def test_comparison_invalid_job_id(db_session):
    """Verify that comparing a candidate to a non-existent job ID returns 404."""
    cand = Candidate(
        name="Test Candidate",
        email="test@example.com",
        raw_text="Candidate raw text"
    )
    db_session.add(cand)
    db_session.commit()

    response = client.get(f"/api/v1/analysis/skill-gap/{cand.id}/999999")
    assert response.status_code == 404
    assert "job with id 999999 not found" in response.json()["detail"].lower()


def test_comparison_idempotent_matching_results(db_session):
    """Verify repeated comparison calls update existing MatchingResult without creating duplicate rows."""
    job = Job(
        title="Python Dev",
        company="PyCorp",
        description="Python developer role"
    )
    cand = Candidate(
        name="Dev One",
        email="dev1@example.com",
        raw_text="Python programming experience"
    )
    db_session.add_all([job, cand])
    db_session.commit()

    # First call
    r1 = client.get(f"/api/v1/analysis/skill-gap/{cand.id}/{job.id}")
    assert r1.status_code == 200

    results1 = db_session.query(MatchingResult).filter(
        MatchingResult.candidate_id == cand.id,
        MatchingResult.job_id == job.id
    ).all()
    assert len(results1) == 1
    match_id = results1[0].id

    # Second call
    r2 = client.get(f"/api/v1/analysis/skill-gap/{cand.id}/{job.id}")
    assert r2.status_code == 200

    results2 = db_session.query(MatchingResult).filter(
        MatchingResult.candidate_id == cand.id,
        MatchingResult.job_id == job.id
    ).all()
    assert len(results2) == 1
    assert results2[0].id == match_id
