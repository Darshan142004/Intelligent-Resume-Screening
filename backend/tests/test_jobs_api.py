import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_job_empty_skills():
    """Test job creation when skill lists are explicitly empty."""
    payload = {
        "title": "Backend Intern",
        "company": "StartupX",
        "description": "General internship role for software development.",
        "experience_required": "0-1 years",
        "education_required": "B.Tech / MCA",
        "domain": "Software Development",
        "required_skills": [],
        "preferred_skills": []
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Backend Intern"
    assert data["company"] == "StartupX"
    assert data["required_skills"] == []
    assert data["preferred_skills"] == []


def test_create_job_required_skills_only():
    """Test job creation specifying only required skills."""
    payload = {
        "title": "Python Developer",
        "company": "PyTech Labs",
        "description": "Develop backend microservices and APIs.",
        "required_skills": ["Python", "FastAPI", "PostgreSQL"],
        "preferred_skills": []
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 201
    data = response.json()
    req_names = [s["name"] for s in data["required_skills"]]
    assert len(req_names) == 3
    assert "Python" in req_names
    assert "FastAPI" in req_names
    assert "PostgreSQL" in req_names
    assert data["preferred_skills"] == []


def test_create_job_preferred_skills_only():
    """Test job creation specifying only preferred skills."""
    payload = {
        "title": "Cloud Architect",
        "company": "CloudCorp Systems",
        "description": "Cloud infrastructure optimization and CI/CD pipelines.",
        "required_skills": [],
        "preferred_skills": ["AWS", "Docker", "Kubernetes"]
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["required_skills"] == []
    pref_names = [s["name"] for s in data["preferred_skills"]]
    assert len(pref_names) == 3
    assert "AWS" in pref_names
    assert "Docker" in pref_names
    assert "Kubernetes" in pref_names


def test_create_job_both_skill_types_together():
    """Test job creation specifying both required and preferred skills together."""
    payload = {
        "title": "Full Stack Engineer",
        "company": "WebCorp Tech",
        "description": "Build high-scale React frontends and Node.js backend services.",
        "required_skills": ["React", "Node.js"],
        "preferred_skills": ["TypeScript", "GraphQL"]
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 201
    data = response.json()
    req_names = [s["name"] for s in data["required_skills"]]
    pref_names = [s["name"] for s in data["preferred_skills"]]
    assert "React" in req_names
    assert "Node.js" in req_names
    assert "TypeScript" in pref_names
    assert "GraphQL" in pref_names
    assert len(req_names) == 2
    assert len(pref_names) == 2


def test_create_job_duplicate_skills_deduplication():
    """Test deduplication of duplicate and alias-equivalent skill entries."""
    payload = {
        "title": "Data Scientist",
        "company": "DataCorp Analytics",
        "description": "Machine learning research and predictive modeling.",
        "required_skills": ["Python", "python", "py", "Machine Learning", "ml"],
        "preferred_skills": ["Docker", "docker", "DOCKER", "containerization"]
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 201
    data = response.json()
    req_names = [s["name"] for s in data["required_skills"]]
    pref_names = [s["name"] for s in data["preferred_skills"]]
    assert req_names.count("Python") == 1
    assert req_names.count("Machine Learning") == 1
    assert len(req_names) == 2
    assert pref_names.count("Docker") == 1
    assert len(pref_names) == 1


def test_create_job_skill_alias_normalization():
    """Test that skill aliases are properly mapped to canonical names."""
    payload = {
        "title": "Frontend Engineer",
        "company": "UI Studios",
        "description": "Modern frontend development using TypeScript and React.",
        "required_skills": ["js", "ts", "postgres", "nodejs"],
        "preferred_skills": ["k8s", "c++", "dl"]
    }
    response = client.post("/api/v1/jobs", json=payload)
    assert response.status_code == 201
    data = response.json()
    req_names = [s["name"] for s in data["required_skills"]]
    pref_names = [s["name"] for s in data["preferred_skills"]]
    assert "JavaScript" in req_names
    assert "TypeScript" in req_names
    assert "PostgreSQL" in req_names
    assert "Node.js" in req_names
    assert "Kubernetes" in pref_names
    assert "C++" in pref_names
    assert "Deep Learning" in pref_names


def test_retrieve_persisted_job_skills():
    """Test that retrieving a created job by ID and in job listing returns persisted skills."""
    payload = {
        "title": "DevOps Engineer",
        "company": "InfraSys Global",
        "description": "CI/CD and infrastructure automation.",
        "required_skills": ["Linux", "Git", "CI/CD"],
        "preferred_skills": ["AWS", "Terraform"]
    }
    create_resp = client.post("/api/v1/jobs", json=payload)
    assert create_resp.status_code == 201
    job_id = create_resp.json()["id"]

    # Retrieve by ID
    get_resp = client.get(f"/api/v1/jobs/{job_id}")
    assert get_resp.status_code == 200
    job_data = get_resp.json()
    assert job_data["id"] == job_id
    req_names = [s["name"] for s in job_data["required_skills"]]
    pref_names = [s["name"] for s in job_data["preferred_skills"]]
    assert "Linux" in req_names
    assert "Git" in req_names
    assert "CI/CD" in req_names
    assert "AWS" in pref_names
    assert "Terraform" in pref_names

    # Retrieve in job list
    list_resp = client.get("/api/v1/jobs")
    assert list_resp.status_code == 200
    jobs_list = list_resp.json()
    matching_job = next((j for j in jobs_list if j["id"] == job_id), None)
    assert matching_job is not None
    assert len(matching_job["required_skills"]) == 3
    assert len(matching_job["preferred_skills"]) == 2


def test_skill_reuse_across_jobs():
    """Test that existing Skill records are reused rather than duplicated in the database."""
    job1_payload = {
        "title": "Backend Dev 1",
        "company": "Company A",
        "description": "Testing skill reuse 1",
        "required_skills": ["Python", "FastAPI"]
    }
    job2_payload = {
        "title": "Backend Dev 2",
        "company": "Company B",
        "description": "Testing skill reuse 2",
        "required_skills": ["FastAPI", "Python"]
    }
    r1 = client.post("/api/v1/jobs", json=job1_payload)
    r2 = client.post("/api/v1/jobs", json=job2_payload)
    assert r1.status_code == 201
    assert r2.status_code == 201

    j1_skills = {s["name"]: s["id"] for s in r1.json()["required_skills"]}
    j2_skills = {s["name"]: s["id"] for s in r2.json()["required_skills"]}

    assert j1_skills["Python"] == j2_skills["Python"]
    assert j1_skills["FastAPI"] == j2_skills["FastAPI"]


def test_get_jobs_returns_unique_job_ids():
    """Verify GET /api/v1/jobs returns each stored job only once without duplicate IDs."""
    response = client.get("/api/v1/jobs?limit=100")
    assert response.status_code == 200
    jobs = response.json()
    job_ids = [j["id"] for j in jobs]
    assert len(job_ids) == len(set(job_ids)), f"Duplicate job IDs found in GET /jobs: {job_ids}"


def test_different_companies_can_post_same_job_title():
    """Verify different companies can post jobs with the same title without collision."""
    payload_a = {
        "title": "Site Reliability Engineer",
        "company": "Company Alpha",
        "description": "Alpha SRE role for infrastructure uptime.",
        "required_skills": ["Linux", "Kubernetes"]
    }
    payload_b = {
        "title": "Site Reliability Engineer",
        "company": "Company Beta",
        "description": "Beta SRE role focused on cloud operations.",
        "required_skills": ["AWS", "Terraform"]
    }
    res_a = client.post("/api/v1/jobs", json=payload_a)
    res_b = client.post("/api/v1/jobs", json=payload_b)
    assert res_a.status_code == 201
    assert res_b.status_code == 201

    job_a = res_a.json()
    job_b = res_b.json()
    assert job_a["id"] != job_b["id"]
    assert job_a["title"] == job_b["title"] == "Site Reliability Engineer"
    assert job_a["company"] == "Company Alpha"
    assert job_b["company"] == "Company Beta"


def test_different_descriptions_remain_separate_jobs():
    """Verify same company can post multiple jobs with different descriptions."""
    payload_1 = {
        "title": "Security Specialist",
        "company": "CyberCorp Global",
        "description": "Application security penetration testing and threat modeling.",
        "required_skills": ["Security", "Python"]
    }
    payload_2 = {
        "title": "Security Specialist",
        "company": "CyberCorp Global",
        "description": "Cloud security compliance and identity access management.",
        "required_skills": ["AWS", "Docker"]
    }
    res_1 = client.post("/api/v1/jobs", json=payload_1)
    res_2 = client.post("/api/v1/jobs", json=payload_2)
    assert res_1.status_code == 201
    assert res_2.status_code == 201

    job_1 = res_1.json()
    job_2 = res_2.json()
    assert job_1["id"] != job_2["id"]
    assert job_1["description"] != job_2["description"]


def test_repeated_job_creation_is_idempotent():
    """Verify repeated creation of identical job does not create duplicate database records."""
    payload = {
        "title": "Mobile Engineer",
        "company": "AppForge Technologies",
        "description": "Build high-performance native and cross-platform mobile apps.",
        "required_skills": ["Flutter", "Dart"],
        "preferred_skills": ["GraphQL"]
    }

    # First creation
    res1 = client.post("/api/v1/jobs", json=payload)
    assert res1.status_code == 201
    job1 = res1.json()
    id1 = job1["id"]

    # Second creation with identical (title, company, description)
    res2 = client.post("/api/v1/jobs", json=payload)
    assert res2.status_code == 201
    job2 = res2.json()
    id2 = job2["id"]

    assert id1 == id2, f"Expected idempotent reuse of job ID {id1}, got new ID {id2}"

    # Verify GET /jobs only contains this job once
    list_res = client.get("/api/v1/jobs?limit=100")
    matching = [j for j in list_res.json() if j["id"] == id1]
    assert len(matching) == 1


def test_delete_job_success_and_cascade(db_session):
    """
    Test DELETE /api/v1/jobs/{job_id} permanently deletes the job,
    cascades associated matching_results, preserves shared skills and candidates.
    """
    from app.models.candidate import Candidate
    from app.models.matching import MatchingResult
    from app.models.skill import Skill
    from app.models.job import Job
    from tests.conftest import get_or_create_skill

    # 1. Create shared skills
    skill_req = get_or_create_skill(db_session, "Kubernetes")
    skill_pref = get_or_create_skill(db_session, "Terraform")

    # 2. Create Candidate with skill
    cand = Candidate(
        name="DevOps Candidate",
        email="devops@example.com",
        skills=[skill_req]
    )
    db_session.add(cand)
    db_session.commit()

    # 3. Create Job
    job = Job(
        title="Cloud DevOps Engineer",
        company="InfraCloud Inc.",
        description="Manage Kubernetes clusters and Terraform infrastructure.",
        required_skills=[skill_req],
        preferred_skills=[skill_pref]
    )
    db_session.add(job)
    db_session.commit()

    # 4. Create MatchingResult
    mr = MatchingResult(
        candidate_id=cand.id,
        job_id=job.id,
        tfidf_score=0.4,
        semantic_score=0.5,
        skill_score=0.8,
        hybrid_score=0.55
    )
    db_session.add(mr)
    db_session.commit()

    job_id = job.id
    cand_id = cand.id
    mr_id = mr.id
    skill_req_id = skill_req.id

    # 5. Call DELETE endpoint
    response = client.delete(f"/api/v1/jobs/{job_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["job_id"] == job_id

    # 6. Verify Job is deleted
    assert db_session.query(Job).filter(Job.id == job_id).first() is None

    # 7. Verify matching_results for this job were cascade-deleted
    assert db_session.query(MatchingResult).filter(MatchingResult.id == mr_id).first() is None

    # 8. Verify Candidate remains completely intact
    persisted_cand = db_session.query(Candidate).filter(Candidate.id == cand_id).first()
    assert persisted_cand is not None
    assert persisted_cand.name == "DevOps Candidate"

    # 9. Verify Shared Skill is PRESERVED
    persisted_skill = db_session.query(Skill).filter(Skill.id == skill_req_id).first()
    assert persisted_skill is not None
    assert persisted_skill.name == "Kubernetes"


def test_delete_job_not_found():
    """Test DELETE /api/v1/jobs/{job_id} returns 404 for non-existent job."""
    response = client.delete("/api/v1/jobs/999999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_rankings_return_404_for_deleted_job(db_session):
    """Test recruiter ranking returns 404 after a job is deleted."""
    from app.models.job import Job

    job = Job(
        title="Temporary Role",
        company="Ephemeral Corp",
        description="This job will be deleted promptly."
    )
    db_session.add(job)
    db_session.commit()
    job_id = job.id

    # Delete the job
    del_res = client.delete(f"/api/v1/jobs/{job_id}")
    assert del_res.status_code == 200

    # Query rankings for deleted job
    ranking_res = client.get(f"/api/v1/ranking/job/{job_id}")
    assert ranking_res.status_code == 404
    assert "not found" in ranking_res.json()["detail"].lower()


