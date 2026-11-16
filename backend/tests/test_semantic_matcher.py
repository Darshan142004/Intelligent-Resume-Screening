import pytest
import numpy as np
from app.services.semantic_matcher import SemanticMatcherService
from app.models.candidate import Candidate
from app.models.job import Job


def test_semantic_model_lazy_loading_and_reuse():
    """Verify that model is lazily loaded and reused across requests."""
    # Reset singleton to test lazy loading
    SemanticMatcherService.reset_model()
    assert not SemanticMatcherService.is_model_loaded()

    service1 = SemanticMatcherService()
    # Still not loaded until first inference or explicit call
    assert not SemanticMatcherService.is_model_loaded()

    # Trigger load
    model1 = service1.get_model()
    assert SemanticMatcherService.is_model_loaded()
    assert model1 is not None

    # Verify second service instance reuses the exact same model object
    service2 = SemanticMatcherService()
    model2 = service2.get_model()
    assert model1 is model2, "Model instance should be reused across service instances"


def test_semantic_embedding_shape_and_determinism():
    """Verify actual embedding inference, vector dimensions, and deterministic output."""
    service = SemanticMatcherService()
    text = "Experienced Python software engineer building FastAPI web services."

    emb1 = service.encode(text)
    emb2 = service.encode(text)

    assert isinstance(emb1, np.ndarray)
    assert emb1.shape == (384,), f"Expected 384-dimensional embedding, got {emb1.shape}"
    # Embedding should be unit normalized
    norm = np.linalg.norm(emb1)
    assert np.isclose(norm, 1.0, atol=1e-3), f"Expected unit norm, got {norm}"

    # Determinism check
    assert np.allclose(emb1, emb2, atol=1e-6), "Embeddings for identical text must be deterministic"


def test_semantic_similarity_related_texts():
    """Verify high semantic similarity between conceptually related texts without exact keyword overlap."""
    service = SemanticMatcherService()
    resume_text = (
        "Senior Software Engineer specializing in backend distributed architectures, "
        "REST API microservices, relational databases, and containerized deployments."
    )
    job_description = (
        "Backend Developer needed to build high-scale web services, design database schemas, "
        "and maintain cloud-native systems using Docker."
    )

    similarity = service.compute_similarity(resume_text, job_description)
    assert 0.0 <= similarity <= 1.0
    # Conceptually strongly aligned texts should have significant similarity (typically > 0.60)
    assert similarity > 0.60, f"Expected strong semantic similarity, got {similarity}"


def test_semantic_similarity_unrelated_texts():
    """Verify low semantic similarity between completely unrelated domain texts."""
    service = SemanticMatcherService()
    resume_text = (
        "Experienced Registered Nurse with 7 years in critical care nursing, ICU patient triage, "
        "medication administration, and post-operative recovery management."
    )
    job_description = (
        "Principal Machine Learning Engineer specializing in distributed PyTorch training, "
        "transformer model fine-tuning, and CUDA GPU kernel optimization."
    )

    similarity = service.compute_similarity(resume_text, job_description)
    assert 0.0 <= similarity <= 1.0
    # Unrelated domains should yield low similarity (typically < 0.35)
    assert similarity < 0.35, f"Expected low semantic similarity for unrelated domains, got {similarity}"


def test_semantic_similarity_identical_texts():
    """Verify identical texts produce near-maximum similarity score."""
    service = SemanticMatcherService()
    text = "Full Stack Engineer building web applications using React and Python."
    similarity = service.compute_similarity(text, text)
    assert np.isclose(similarity, 1.0, atol=1e-3)


def test_empty_and_invalid_semantic_inputs():
    """Verify graceful handling of empty, whitespace, None, and non-string inputs."""
    service = SemanticMatcherService()

    valid_text = "Python developer with experience in microservices."

    assert service.compute_similarity("", "") == 0.0
    assert service.compute_similarity("   ", "   ") == 0.0
    assert service.compute_similarity(None, valid_text) == 0.0
    assert service.compute_similarity(valid_text, None) == 0.0
    assert service.compute_similarity(None, None) == 0.0
    assert service.compute_similarity("", valid_text) == 0.0
    assert service.compute_similarity(valid_text, "") == 0.0
    assert service.compute_similarity(12345, valid_text) == 0.0
    assert service.compute_similarity(valid_text, ["invalid", "type"]) == 0.0


def test_semantic_similarity_from_precomputed_embeddings():
    """Verify compute_similarity_from_embeddings helper works accurately."""
    service = SemanticMatcherService()
    emb_a = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    emb_b = np.array([1.0, 0.0, 0.0], dtype=np.float32)
    emb_c = np.array([0.0, 1.0, 0.0], dtype=np.float32)

    assert np.isclose(service.compute_similarity_from_embeddings(emb_a, emb_b), 1.0)
    assert np.isclose(service.compute_similarity_from_embeddings(emb_a, emb_c), 0.0)
    assert service.compute_similarity_from_embeddings(None, emb_a) == 0.0
    assert service.compute_similarity_from_embeddings(np.zeros(3), emb_a) == 0.0


def test_semantic_matcher_with_candidate_and_job_models():
    """Verify direct integration with Candidate and Job SQLAlchemy models."""
    service = SemanticMatcherService()

    candidate = Candidate(
        raw_text="Backend Python developer with experience in PostgreSQL, FastAPI, and Docker."
    )
    job = Job(
        description="Looking for a Python backend engineer to develop APIs with FastAPI and databases."
    )

    similarity = service.compute_candidate_job_similarity(candidate, job)
    assert 0.0 <= similarity <= 1.0
    assert similarity > 0.50, f"Expected high similarity for matching candidate/job, got {similarity}"

    # Model with missing or empty attributes
    empty_cand = Candidate(raw_text="")
    empty_job = Job(description="")
    assert service.compute_candidate_job_similarity(empty_cand, job) == 0.0
    assert service.compute_candidate_job_similarity(candidate, empty_job) == 0.0
    assert service.compute_candidate_job_similarity(empty_cand, empty_job) == 0.0

