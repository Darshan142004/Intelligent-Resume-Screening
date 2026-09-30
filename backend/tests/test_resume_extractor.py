from app.services.resume_extractor import (
    extract_email, extract_phone, extract_name, extract_sections, extract_structured_information
)
from app.services.skill_vocabulary import normalize_skill, extract_skills_from_text


def test_email_extraction():
    text = "Contact me at alice.dev@company.org or support@domain.com"
    email = extract_email(text)
    assert email == "alice.dev@company.org"


def test_phone_extraction():
    text1 = "Phone: +91 9876543210 (Mobile)"
    text2 = "Call me at +1 555-123-4567"
    assert extract_phone(text1) == "+91 9876543210"
    assert extract_phone(text2) == "+1 555-123-4567"


def test_name_extraction():
    text = "Robert Martin\nrobert@clean-code.org\nSoftware Developer"
    name = extract_name(text)
    assert name == "Robert Martin"


def test_section_extraction():
    text = (
        "Alex Mercer\nalex@example.com\n\n"
        "Education\n"
        "B.S. Computer Science, Stanford University\n\n"
        "Experience\n"
        "Senior Software Engineer at Google for 4 years.\n\n"
        "Skills\n"
        "Python, React, Docker, Kubernetes\n"
    )
    sections = extract_sections(text)
    assert "Stanford" in sections["education"]
    assert "Google" in sections["experience"]


def test_skill_normalization():
    assert normalize_skill("js") == "JavaScript"
    assert normalize_skill("ts") == "TypeScript"
    assert normalize_skill("postgres") == "PostgreSQL"
    assert normalize_skill("nodejs") == "Node.js"


def test_extract_skills_from_text():
    text = "Proficient in Python, JS, React, Docker, and PostgreSQL. Familiar with C++ and ML."
    skills = extract_skills_from_text(text)
    assert "Python" in skills
    assert "JavaScript" in skills
    assert "React" in skills
    assert "Docker" in skills
    assert "PostgreSQL" in skills
    assert "C++" in skills
    assert "Machine Learning" in skills
