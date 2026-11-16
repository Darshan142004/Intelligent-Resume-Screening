import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.skill import Skill
from app.models.matching import MatchingResult
from tests.conftest import get_or_create_skill

client = TestClient(app)


def test_ranking_valid_job_multiple_candidates_order_and_scores(db_session):
    """
    Verify candidate ranking API:
    - Ranks multiple candidates correctly by hybrid score descending.
    - Strong candidate ranks highest, unrelated candidate ranks lowest.
    - All score components (TF-IDF, Semantic, Skill, Hybrid) are present and valid.
    - Includes contact information and skill breakdown.
    """
    # 1. Create or retrieve normalized skills
    skill_py = get_or_create_skill(db_session, "Python")
    skill_fastapi = get_or_create_skill(db_session, "FastAPI")
    skill_docker = get_or_create_skill(db_session, "Docker")
    skill_pg = get_or_create_skill(db_session, "PostgreSQL")
    skill_tax = get_or_create_skill(db_session, "Taxation", category="domain")

    # 2. Create Job
    job = Job(
        title="Lead Python Backend Engineer",
        company="NexTech Solutions",
        description="We are seeking an experienced Python Backend Engineer skilled in FastAPI, PostgreSQL, and Docker containerization.",
        required_skills=[skill_py, skill_fastapi],
        preferred_skills=[skill_docker, skill_pg]
    )
    db_session.add(job)

    # 3. Candidate A: Perfect / Strong match
    cand_a = Candidate(
        name="Alice Pythonista",
        email="alice@example.com",
        phone="+1-555-0101",
        raw_text="Senior Python Backend Engineer with 6 years experience architecting FastAPI microservices, PostgreSQL databases, and Docker pipelines.",
        skills=[skill_py, skill_fastapi, skill_docker, skill_pg]
    )

    # 4. Candidate B: Moderate / Partial match
    cand_b = Candidate(
        name="Bob Junior",
        email="bob@example.com",
        phone="+1-555-0102",
        raw_text="Junior developer with fundamental Python programming skills and FastAPI project experience.",
        skills=[skill_py, skill_fastapi]
    )

    # 5. Candidate C: Unrelated domain
    cand_c = Candidate(
        name="Charlie Auditor",
        email="charlie@example.com",
        phone="+1-555-0103",
        raw_text="Experienced accountant specializing in corporate tax compliance, audit readiness, and payroll ledgers.",
        skills=[skill_tax]
    )

    db_session.add_all([cand_a, cand_b, cand_c])
    db_session.commit()

    # Call Ranking API
    response = client.get(f"/api/v1/ranking/job/{job.id}")
    assert response.status_code == 200
    rankings = response.json()

    assert len(rankings) >= 3

    # Filter to only the candidates in this test
    test_cand_ids = {cand_a.id, cand_b.id, cand_c.id}
    test_rankings = [r for r in rankings if r["candidate_id"] in test_cand_ids]
    assert len(test_rankings) == 3

    # Verify descending sort order by hybrid score
    scores = [r["hybrid_score"] for r in test_rankings]
    assert scores == sorted(scores, reverse=True), f"Rankings not sorted descending: {scores}"

    # Alice must rank highest, Charlie must rank lowest
    assert test_rankings[0]["candidate_id"] == cand_a.id
    assert test_rankings[2]["candidate_id"] == cand_c.id
    assert test_rankings[0]["hybrid_score"] > test_rankings[1]["hybrid_score"] > test_rankings[2]["hybrid_score"]

    # Verify Alice's details and scores
    top = test_rankings[0]
    assert top["candidate_name"] == "Alice Pythonista"
    assert top["candidate_email"] == "alice@example.com"
    assert top["candidate_phone"] == "+1-555-0101"
    assert top["job_id"] == job.id
    assert 0.0 < top["tfidf_score"] <= 1.0
    assert 0.0 < top["semantic_score"] <= 1.0
    assert 0.0 < top["skill_score"] <= 1.0
    assert 0.0 < top["hybrid_score"] <= 1.0
    assert "Python" in top["matched_required_skills"]
    assert "FastAPI" in top["matched_required_skills"]
    assert top["missing_required_skills"] == []
    assert "Docker" in top["matched_preferred_skills"]
    assert "PostgreSQL" in top["matched_preferred_skills"]
    assert top["missing_preferred_skills"] == []

    # Verify Charlie's missing skills
    bottom = test_rankings[2]
    assert "Python" in bottom["missing_required_skills"]
    assert "FastAPI" in bottom["missing_required_skills"]


def test_ranking_matching_result_persistence_and_idempotence(db_session):
    """
    Verify that calling ranking:
    1. Persists records to the matching_results table.
    2. Repeated calls update existing records without creating duplicates.
    """
    skill_java = get_or_create_skill(db_session, "Java")

    job = Job(
        title="Java Developer",
        company="Enterprise Java Corp",
        description="Core Java enterprise backend development with Spring Boot.",
        required_skills=[skill_java]
    )
    cand = Candidate(
        name="David JavaDev",
        email="david@example.com",
        raw_text="Java software developer building microservices with Spring Boot.",
        skills=[skill_java]
    )
    db_session.add_all([job, cand])
    db_session.commit()

    # First ranking call
    resp1 = client.get(f"/api/v1/ranking/job/{job.id}")
    assert resp1.status_code == 200

    # Query matching_results
    results_q1 = db_session.query(MatchingResult).filter(
        MatchingResult.candidate_id == cand.id,
        MatchingResult.job_id == job.id
    ).all()
    assert len(results_q1) == 1
    original_id = results_q1[0].id

    # Second ranking call
    resp2 = client.get(f"/api/v1/ranking/job/{job.id}")
    assert resp2.status_code == 200

    # Query matching_results again - should NOT have created duplicate
    results_q2 = db_session.query(MatchingResult).filter(
        MatchingResult.candidate_id == cand.id,
        MatchingResult.job_id == job.id
    ).all()
    assert len(results_q2) == 1
    assert results_q2[0].id == original_id, "Matching result ID must remain identical on idempotent update"


def test_ranking_empty_candidate_list(db_session):
    """Verify that ranking returns an empty list gracefully when no candidates exist."""
    # Create a job, but delete all candidates in test database
    db_session.execute(text("DELETE FROM candidates;"))
    db_session.commit()

    job = Job(
        title="Solo Job",
        company="Lonely Corp",
        description="Job with zero applicants."
    )
    db_session.add(job)
    db_session.commit()

    response = client.get(f"/api/v1/ranking/job/{job.id}")
    assert response.status_code == 200
    assert response.json() == []


def test_ranking_invalid_job_id():
    """Verify that ranking with a non-existent job ID returns 404."""
    response = client.get("/api/v1/ranking/job/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_ranking_handles_empty_resume_text(db_session):
    """
    Verify candidate ranking with empty, null, and whitespace resume text:
    - Does not crash the ranking engine.
    - Candidates are included (not silently discarded).
    - Candidates receive strictly 0.0 scores across all NLP components.
    - Candidates are ranked below valid candidates without skewing ranking quality.
    """
    skill_py = get_or_create_skill(db_session, "Python")
    job = Job(
        title="Python Developer",
        company="TechCorp",
        description="Looking for an experienced Python developer.",
        required_skills=[skill_py]
    )
    valid_cand = Candidate(
        name="Valid Candidate",
        email="valid.cand@example.com",
        raw_text="Senior Python developer with extensive project experience.",
        skills=[skill_py]
    )
    empty_cand = Candidate(
        name="Empty Resume User",
        email="empty.user@example.com",
        raw_text="",
        skills=[]
    )
    whitespace_cand = Candidate(
        name="Whitespace Resume User",
        email="whitespace.user@example.com",
        raw_text="   \n\t  \n  ",
        skills=[]
    )
    null_cand = Candidate(
        name="Null Resume User",
        email="null.user@example.com",
        raw_text=None,
        skills=[]
    )
    db_session.add_all([job, valid_cand, empty_cand, whitespace_cand, null_cand])
    db_session.commit()

    response = client.get(f"/api/v1/ranking/job/{job.id}")
    assert response.status_code == 200
    rankings = response.json()

    # All candidates must be present
    all_returned_ids = {r["candidate_id"] for r in rankings}
    assert valid_cand.id in all_returned_ids
    assert empty_cand.id in all_returned_ids
    assert whitespace_cand.id in all_returned_ids
    assert null_cand.id in all_returned_ids

    # Valid candidate must rank higher than empty/whitespace/null candidates
    valid_match = next(r for r in rankings if r["candidate_id"] == valid_cand.id)
    assert valid_match["hybrid_score"] > 0.0

    for cand_id in [empty_cand.id, whitespace_cand.id, null_cand.id]:
        cand_match = next(r for r in rankings if r["candidate_id"] == cand_id)
        assert cand_match["semantic_score"] == 0.0
        assert cand_match["tfidf_score"] == 0.0
        assert cand_match["skill_score"] == 0.0
        assert cand_match["hybrid_score"] == 0.0
        assert cand_match["rank"] > valid_match["rank"]


def test_ranking_deduplicates_duplicate_email_profiles_selects_best_representative(db_session):
    """
    Verify unique candidate ranking:
    - Multiple profiles sharing the same normalized email appear ONLY ONCE in the ranking.
    - Selects the most complete representative candidate based on fitness criteria.
    - Aggregates skills non-destructively in-memory.
    - Sets duplicate_count to the number of consolidated profiles.
    """
    skill_py = get_or_create_skill(db_session, "Python")
    skill_docker = get_or_create_skill(db_session, "Docker")
    skill_fastapi = get_or_create_skill(db_session, "FastAPI")

    job = Job(
        title="Senior Python Architect",
        company="GlobalTech",
        description="Senior engineer with Python, FastAPI, and Docker expertise.",
        required_skills=[skill_py, skill_fastapi],
        preferred_skills=[skill_docker]
    )
    db_session.add(job)

    # 3 duplicate profiles for the same person
    # Profile 1: Incomplete, partial name, 1 skill
    cand_1 = Candidate(
        name="Darshan",
        email="darshan.testdup@example.com",
        phone="9999900001",
        raw_text="Basic software profile.",
        skills=[skill_py]
    )
    # Profile 2: Highly complete, full name, education, experience, 2 skills
    cand_2 = Candidate(
        name="Darshan Bhagwat",
        email="darshan.testdup@example.com",
        phone="9999900001",
        education="MCA Graduate 2024",
        experience="5 years Python & FastAPI microservices architecture.",
        projects="Intelligent Resume Screening NLP Engine",
        certifications="AWS Certified Cloud Practitioner",
        raw_text="Darshan Bhagwat. Senior Backend Architect with 5 years experience in Python, FastAPI, and cloud design.",
        skills=[skill_py, skill_fastapi]
    )
    # Profile 3: Moderate completeness, has an additional skill (Docker)
    cand_3 = Candidate(
        name="Darshan Bhagwat",
        email="darshan.testdup@example.com",
        phone="9999900001",
        raw_text="Darshan Bhagwat. Docker and containerization specialist.",
        skills=[skill_docker]
    )
    db_session.add_all([cand_1, cand_2, cand_3])
    db_session.commit()

    response = client.get(f"/api/v1/ranking/job/{job.id}")
    assert response.status_code == 200
    rankings = response.json()

    # Find entries for this email
    email_rankings = [r for r in rankings if r["candidate_email"] == "darshan.testdup@example.com"]
    assert len(email_rankings) == 1, f"Expected 1 ranking entry, got {len(email_rankings)}"

    rep = email_rankings[0]
    # Candidate 2 must be selected as the representative
    assert rep["candidate_id"] == cand_2.id
    assert rep["candidate_name"] == "Darshan Bhagwat"
    assert rep["duplicate_count"] == 3
    # Candidate 2 should have inherited Docker from Candidate 3 via non-destructive in-memory aggregation
    assert "Docker" in rep["matched_skills"] or "Docker" in rep["matched_preferred_skills"]


def test_ranking_email_case_variations_and_same_name_different_emails(db_session):
    """
    Verify:
    1. Uppercase / lowercase email variations are grouped into a single ranking entry.
    2. Candidates with the SAME name but DIFFERENT emails remain separate unique entries.
    """
    skill_py = get_or_create_skill(db_session, "Python")
    job = Job(title="Backend Dev", company="Co", description="Python dev", required_skills=[skill_py])
    db_session.add(job)

    # 2 profiles with case variation: John Doe
    john_lower = Candidate(name="John Doe", email="john.unique@example.com", raw_text="Python engineer.", skills=[skill_py])
    john_upper = Candidate(name="John Doe", email="JOHN.UNIQUE@EXAMPLE.COM", raw_text="Senior Python.", skills=[skill_py])

    # 2 different candidates who happen to share the exact same name
    same_name_1 = Candidate(name="Alex Smith", email="alex.one@example.com", raw_text="Python dev.", skills=[skill_py])
    same_name_2 = Candidate(name="Alex Smith", email="alex.two@example.com", raw_text="Python dev.", skills=[skill_py])

    db_session.add_all([john_lower, john_upper, same_name_1, same_name_2])
    db_session.commit()

    response = client.get(f"/api/v1/ranking/job/{job.id}")
    assert response.status_code == 200
    rankings = response.json()

    # John Doe should appear exactly once
    john_entries = [r for r in rankings if r["candidate_email"] and r["candidate_email"].lower() == "john.unique@example.com"]
    assert len(john_entries) == 1
    assert john_entries[0]["duplicate_count"] == 2

    # Alex Smith #1 and Alex Smith #2 must BOTH appear as separate entries
    alex1 = [r for r in rankings if r["candidate_email"] == "alex.one@example.com"]
    alex2 = [r for r in rankings if r["candidate_email"] == "alex.two@example.com"]
    assert len(alex1) == 1
    assert len(alex2) == 1
    assert alex1[0]["candidate_id"] != alex2[0]["candidate_id"]


def test_ranking_candidates_without_email_kept_independent(db_session):
    """
    Verify candidates missing emails are not merged and appear independently.
    """
    job = Job(title="Tester", company="Co", description="Test job")
    cand_no_email_1 = Candidate(name="No Email One", email=None, raw_text="Text one")
    cand_no_email_2 = Candidate(name="No Email Two", email=None, raw_text="Text two")
    db_session.add_all([job, cand_no_email_1, cand_no_email_2])
    db_session.commit()

    response = client.get(f"/api/v1/ranking/job/{job.id}")
    assert response.status_code == 200
    rankings = response.json()

    returned_ids = {r["candidate_id"] for r in rankings}
    assert cand_no_email_1.id in returned_ids
    assert cand_no_email_2.id in returned_ids


def test_ranking_idempotency_repeated_calls(db_session):
    """
    Verify that calling ranking multiple times for the same job updates matching results in-place
    and does not create duplicate MatchingResult records.
    """
    skill_py = get_or_create_skill(db_session, "Python")
    job = Job(title="Idempotent Test Job", company="Co", description="Python job", required_skills=[skill_py])
    cand = Candidate(name="Idempotent Cand", email="idempotent@example.com", raw_text="Python engineer.", skills=[skill_py])
    db_session.add_all([job, cand])
    db_session.commit()

    # First call
    res1 = client.get(f"/api/v1/ranking/job/{job.id}")
    assert res1.status_code == 200
    count_1 = db_session.query(MatchingResult).filter(MatchingResult.job_id == job.id).count()

    # Second call
    res2 = client.get(f"/api/v1/ranking/job/{job.id}")
    assert res2.status_code == 200
    count_2 = db_session.query(MatchingResult).filter(MatchingResult.job_id == job.id).count()

    assert count_1 == count_2
    assert count_1 >= 1
