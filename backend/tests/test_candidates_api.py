import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models.candidate import Candidate
from app.models.skill import Skill
from app.models.matching import MatchingResult
from app.models.job import Job
from tests.conftest import get_or_create_skill

client = TestClient(app)


def test_get_candidates_unique_and_historical(db_session):
    """
    Test GET /api/v1/candidates with unique=true and unique=false.
    """
    skill = get_or_create_skill(db_session, "Python")

    cand1 = Candidate(
        name="Alex Smith",
        email="alex@example.com",
        skills=[skill]
    )
    cand2 = Candidate(
        name="Alex S.",
        email="alex@example.com",
        skills=[skill]
    )
    db_session.add_all([cand1, cand2])
    db_session.commit()

    # Unique query
    res_unique = client.get("/api/v1/candidates?unique=true")
    assert res_unique.status_code == 200
    data_unique = res_unique.json()
    emails = [c["email"] for c in data_unique]
    assert emails.count("alex@example.com") == 1

    # Historical query
    res_all = client.get("/api/v1/candidates?unique=false&limit=100")
    assert res_all.status_code == 200
    data_all = res_all.json()
    all_emails = [c["email"] for c in data_all]
    assert all_emails.count("alex@example.com") == 2


def test_delete_candidate_success_and_cascade(db_session):
    """
    Test DELETE /api/v1/candidates/{id} permanently deletes candidate
    and cascades to matching_results and candidate_skills.
    """
    skill = get_or_create_skill(db_session, "PostgreSQL")
    job = Job(title="Database Admin", company="DataCorp", description="PostgreSQL expert needed")
    db_session.add(job)
    db_session.commit()

    cand = Candidate(
        name="Charlie DeleteMe",
        email="charlie@example.com",
        skills=[skill]
    )
    db_session.add(cand)
    db_session.commit()

    # Create matching result
    mr = MatchingResult(
        candidate_id=cand.id,
        job_id=job.id,
        tfidf_score=0.5,
        semantic_score=0.5,
        skill_score=1.0,
        hybrid_score=0.6
    )
    db_session.add(mr)
    db_session.commit()

    cand_id = cand.id
    mr_id = mr.id

    # Call DELETE endpoint
    res = client.delete(f"/api/v1/candidates/{cand_id}")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["candidate_id"] == cand_id

    # Verify candidate is gone from DB
    deleted_cand = db_session.query(Candidate).filter(Candidate.id == cand_id).first()
    assert deleted_cand is None

    # Verify matching result was cascaded
    deleted_mr = db_session.query(MatchingResult).filter(MatchingResult.id == mr_id).first()
    assert deleted_mr is None


def test_delete_candidate_not_found():
    """
    Test DELETE /api/v1/candidates/{id} returns 404 for non-existent candidate.
    """
    res = client.delete("/api/v1/candidates/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

