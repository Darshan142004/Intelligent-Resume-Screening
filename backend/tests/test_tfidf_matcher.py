import pytest
from app.services.tfidf_matcher import TFIDFMatcherService


@pytest.fixture
def matcher():
    return TFIDFMatcherService()


def test_identical_resume_and_job_description(matcher):
    """Test that identical text yields maximum similarity score (1.0)."""
    text = (
        "Senior Software Engineer with 5 years experience in Python, FastAPI, Docker, "
        "and PostgreSQL. Proven track record in building REST APIs and microservices."
    )
    score = matcher.compute_similarity(text, text)
    assert score == 1.0


def test_highly_similar_technical_content(matcher):
    """Test that resume and job sharing core technical requirements yield a high score."""
    resume = (
        "Full Stack Developer proficient in Python, FastAPI, PostgreSQL, and React. "
        "Experienced in Docker containerization, Git workflows, and building scalable REST APIs."
    )
    job_description = (
        "We are seeking a Full Stack Developer skilled in Python, FastAPI, PostgreSQL, and React. "
        "Candidates should have practical experience with Docker, Git, and REST APIs."
    )
    unrelated_job = (
        "Experienced Pastry Chef wanted for an upscale French bakery. Must know artisan bread, "
        "croissant lamination, culinary baking techniques, and inventory control."
    )

    high_score = matcher.compute_similarity(resume, job_description)
    low_score = matcher.compute_similarity(resume, unrelated_job)

    assert high_score > 0.40
    assert high_score > low_score
    assert low_score < 0.10
    assert 0.0 <= high_score <= 1.0


def test_unrelated_resume_and_job_description(matcher):
    """Test that completely unrelated texts yield near-zero or zero similarity."""
    resume = "Mechanical Engineer specializing in automotive chassis, suspension design, and CAD drafting."
    job = "Marketing Specialist for digital social media campaigns, SEO copywriting, and brand awareness."

    score = matcher.compute_similarity(resume, job)
    assert score < 0.05
    assert 0.0 <= score <= 1.0


def test_empty_resume(matcher):
    """Test that an empty resume string safely returns 0.0 without errors."""
    job = "Software Engineer with Python and Docker experience."
    assert matcher.compute_similarity("", job) == 0.0


def test_empty_job_description(matcher):
    """Test that an empty job description safely returns 0.0 without errors."""
    resume = "Candidate with 3 years of React and JavaScript experience."
    assert matcher.compute_similarity(resume, "") == 0.0


def test_whitespace_only_input(matcher):
    """Test that whitespace-only strings safely return 0.0."""
    assert matcher.compute_similarity("   \t\n  ", "   ") == 0.0
    assert matcher.compute_similarity("Python Developer", "    \n   ") == 0.0
    assert matcher.compute_similarity("   \t  ", "Python Developer") == 0.0


def test_none_and_non_string_input(matcher):
    """Test that non-string inputs safely return 0.0 without throwing exceptions."""
    assert matcher.compute_similarity(None, "Python Developer") == 0.0
    assert matcher.compute_similarity("Python Developer", None) == 0.0
    assert matcher.compute_similarity(12345, "Python Developer") == 0.0
    assert matcher.compute_similarity("Python Developer", {}) == 0.0


def test_stop_words_only_input(matcher):
    """Test that documents containing only stop words safely return 0.0 without raising empty vocabulary error."""
    text1 = "the and or in on at with for"
    text2 = "is was are were been be"
    score = matcher.compute_similarity(text1, text2)
    assert score == 0.0


def test_score_range_boundary(matcher):
    """Test that scores across a variety of test inputs always remain in [0.0, 1.0]."""
    test_pairs = [
        ("Java Spring Boot MySQL", "Python Django PostgreSQL"),
        ("Python ML AI", "Python Machine Learning"),
        ("Docker Kubernetes Cloud", "Docker Kubernetes Cloud"),
        ("Minimal text", "Other different text"),
        ("", ""),
    ]
    for r, j in test_pairs:
        score = matcher.compute_similarity(r, j)
        assert 0.0 <= score <= 1.0
        assert isinstance(score, float)


def test_deterministic_output(matcher):
    """Test that running the matcher multiple times on the same input yields identical scores."""
    resume = "Backend Developer with FastAPI, PostgreSQL, Docker, and Redis."
    job = "Looking for a Backend Engineer with FastAPI, PostgreSQL, and Docker."

    score1 = matcher.compute_similarity(resume, job)
    score2 = matcher.compute_similarity(resume, job)
    score3 = matcher.compute_similarity(resume, job)

    assert score1 == score2 == score3


def test_technical_terms_preservation(matcher):
    """Test that technical terms like C++, C#, .NET, Node.js, Python, JavaScript, Docker, and PostgreSQL are recognized."""
    resume = "Experienced in C++, C#, .NET, Node.js, Python, JavaScript, PostgreSQL, and Docker."
    job = "Required skills: C++, C#, Node.js, Python, JavaScript, PostgreSQL, and Docker."

    score = matcher.compute_similarity(resume, job)
    assert score > 0.60
    assert 0.0 <= score <= 1.0


def test_model_instance_compatibility(matcher):
    """Test compatibility with Candidate and Job objects having raw_text and description attributes."""
    class MockCandidate:
        raw_text = "Software Engineer skilled in Python, FastAPI, and Docker."

    class MockJob:
        description = "Software Engineer skilled in Python, FastAPI, and Docker."

    score = matcher.compute_candidate_job_similarity(MockCandidate(), MockJob())
    assert score == 1.0

    class MockPartialJob:
        description = "Frontend Designer specializing in Figma and UI styling."

    partial_score = matcher.compute_candidate_job_similarity(MockCandidate(), MockPartialJob())
    assert 0.0 <= partial_score < 0.20
