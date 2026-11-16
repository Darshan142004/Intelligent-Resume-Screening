import io
import pytest
import fitz
import docx
from fastapi.testclient import TestClient
from app.main import app
from tests.test_resume_parser import create_sample_pdf_bytes, create_sample_docx_bytes

client = TestClient(app)


def create_custom_docx(name: str, email: str, skills: str = "Java, MySQL") -> bytes:
    doc = docx.Document()
    doc.add_heading(name, level=1)
    doc.add_paragraph(f"{email} | +1 555-0199")
    doc.add_heading("Education", level=2)
    doc.add_paragraph("Bachelor of Technology")
    doc.add_heading("Technical Skills", level=2)
    doc.add_paragraph(skills)
    doc.add_heading("Experience", level=2)
    doc.add_paragraph("Backend Developer for 3 years.")
    file_stream = io.BytesIO()
    doc.save(file_stream)
    return file_stream.getvalue()


def create_custom_pdf(name: str, email: str, skills: str = "Python, Docker") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    text = (
        f"{name}\n"
        f"{email} | +91 9876543210\n\n"
        "Education\n"
        "Bachelor of Science in Information Technology\n\n"
        "Skills\n"
        f"{skills}\n\n"
        "Experience\n"
        "Software Engineer with 4 years of experience.\n"
    )
    page.insert_text((50, 50), text)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def create_pdf_without_email(name: str = "Anonymous Candidate", skills: str = "Python") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    text = (
        f"{name}\n"
        "+91 9876543210\n\n"
        "Education\n"
        "Bachelor of Computer Science\n\n"
        "Skills\n"
        f"{skills}\n\n"
        "Experience\n"
        "Junior Developer\n"
    )
    page.insert_text((50, 50), text)
    pdf_bytes = doc.write()
    doc.close()
    return pdf_bytes


def test_single_resume_upload_pdf():
    pdf_bytes = create_sample_pdf_bytes()
    response = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("test_resume.pdf", pdf_bytes, "application/pdf")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "John Doe"
    assert data["email"] == "john.doe@example.com"
    assert "Python" in data["skills"]
    assert data["extraction_status"] == "success"


def test_single_resume_upload_docx():
    docx_bytes = create_sample_docx_bytes()
    response = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("test_resume.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Smith"
    assert data["email"] == "jane.smith@example.com"
    assert "Java" in data["skills"]


def test_invalid_file_extension():
    response = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("document.txt", b"Hello world", "text/plain")}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


def test_doc_file_upload_rejected():
    response = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("legacy_resume.doc", b"Legacy MS Word binary format content", "application/msword")}
    )
    assert response.status_code == 400
    assert "Unsupported file format '.doc'" in response.json()["detail"]
    assert "Only PDF (.pdf) and Word (.docx) files are supported." in response.json()["detail"]


def test_empty_file_upload():
    response = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("empty.pdf", b"", "application/pdf")}
    )
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()


def test_bulk_resume_upload_with_corrupted_file():
    pdf_bytes = create_custom_pdf("Bulk Alpha", "bulk.alpha@example.com", "Python, Docker")
    docx_bytes = create_custom_docx("Bulk Beta", "bulk.beta@example.com", "FastAPI, PostgreSQL")
    corrupted_bytes = b"This is not a valid PDF or DOCX file content."

    files = [
        ("files", ("candidate1.pdf", pdf_bytes, "application/pdf")),
        ("files", ("candidate2.docx", docx_bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
        ("files", ("corrupted_file.pdf", corrupted_bytes, "application/pdf"))
    ]

    response = client.post("/api/v1/resumes/upload/bulk", files=files)
    assert response.status_code == 200
    data = response.json()

    assert data["total_files"] == 3
    assert data["successful_files"] == 2
    assert data["failed_files"] == 1
    assert len(data["candidates_created"]) == 2
    assert len(data["errors"]) == 1
    assert data["errors"][0]["filename"] == "corrupted_file.pdf"


def test_repeated_upload_same_email_rejected_with_409():
    """
    Verify repeated upload with the same email:
    - First upload succeeds (201 Created).
    - Second upload with same email and update_existing=False fails with 409 Conflict.
    - 409 detail identifies existing candidate and email.
    """
    pdf_bytes = create_custom_pdf("Duplicate Candidate", "duplicate.check@example.com", "Python")
    
    # 1. First upload
    res1 = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("first_upload.pdf", pdf_bytes, "application/pdf")}
    )
    assert res1.status_code == 201
    cand_id = res1.json()["id"]

    # 2. Second upload with same email
    res2 = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("second_upload.pdf", pdf_bytes, "application/pdf")}
    )
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]
    assert "duplicate.check@example.com" in res2.json()["detail"]
    assert str(cand_id) in res2.json()["detail"]


def test_repeated_upload_same_email_with_update_existing():
    """
    Verify candidate resume update workflow:
    - Initial upload creates candidate with initial skills.
    - Subsequent upload with update_existing=True updates candidate fields and skills.
    - Preserves existing candidate ID (no duplicate candidate row created).
    - Returns extraction_status='updated' and is_updated=True.
    """
    initial_pdf = create_custom_pdf("Robert Miller", "robert.miller@example.com", "Python")
    
    # Initial upload
    res1 = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("initial.pdf", initial_pdf, "application/pdf")}
    )
    assert res1.status_code == 201
    cand1_id = res1.json()["id"]
    assert "Python" in res1.json()["skills"]

    # Revised resume with new skills
    updated_pdf = create_custom_pdf("Robert Miller", "robert.miller@example.com", "Python, FastAPI, Docker, Kubernetes")
    res2 = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("revised.pdf", updated_pdf, "application/pdf")},
        data={"update_existing": "true"}
    )
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["id"] == cand1_id  # ID preserved, no new candidate created
    assert data2["extraction_status"] == "updated"
    assert data2["is_updated"] is True
    assert "FastAPI" in data2["skills"]
    assert "Docker" in data2["skills"]


def test_different_people_with_different_emails():
    """
    Verify distinct candidates with different emails are created independently.
    """
    pdf1 = create_custom_pdf("Candidate Alpha", "alpha@example.com", "Python")
    pdf2 = create_custom_pdf("Candidate Beta", "beta@example.com", "Java")

    res1 = client.post("/api/v1/resumes/upload/single", files={"file": ("alpha.pdf", pdf1, "application/pdf")})
    res2 = client.post("/api/v1/resumes/upload/single", files={"file": ("beta.pdf", pdf2, "application/pdf")})

    assert res1.status_code == 201
    assert res2.status_code == 201
    assert res1.json()["id"] != res2.json()["id"]
    assert res1.json()["email"] == "alpha@example.com"
    assert res2.json()["email"] == "beta@example.com"


def test_same_name_different_emails_not_merged():
    """
    Verify candidates with matching names but different emails are NEVER merged.
    """
    pdf1 = create_custom_pdf("Same Name", "person.one@example.com", "Python")
    pdf2 = create_custom_pdf("Same Name", "person.two@example.com", "React")

    res1 = client.post("/api/v1/resumes/upload/single", files={"file": ("person1.pdf", pdf1, "application/pdf")})
    res2 = client.post("/api/v1/resumes/upload/single", files={"file": ("person2.pdf", pdf2, "application/pdf")})

    assert res1.status_code == 201
    assert res2.status_code == 201
    assert res1.json()["id"] != res2.json()["id"]


def test_missing_email_handled_safely():
    """
    Verify resumes missing email addresses are handled safely:
    - Created successfully with email=None.
    - Two resumes lacking emails are NOT merged together.
    """
    pdf1 = create_pdf_without_email("No Email User One", "Python")
    pdf2 = create_pdf_without_email("No Email User Two", "Docker")

    res1 = client.post("/api/v1/resumes/upload/single", files={"file": ("noemail1.pdf", pdf1, "application/pdf")})
    res2 = client.post("/api/v1/resumes/upload/single", files={"file": ("noemail2.pdf", pdf2, "application/pdf")})

    assert res1.status_code == 201
    assert res2.status_code == 201
    assert res1.json()["email"] is None
    assert res2.json()["email"] is None
    assert res1.json()["id"] != res2.json()["id"]


def test_email_case_normalization_duplicate_detection():
    """
    Verify email case normalization:
    - Upload with uppercase email is stored normalized (lowercase).
    - Second upload with lowercase email detects duplicate and returns 409 Conflict.
    """
    pdf_upper = create_custom_pdf("Case Test", "UPPER.CASE@DOMAIN.COM", "Python")
    res1 = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("upper.pdf", pdf_upper, "application/pdf")}
    )
    assert res1.status_code == 201
    assert res1.json()["email"] == "upper.case@domain.com"

    # Attempt second upload with lowercase
    pdf_lower = create_custom_pdf("Case Test", "upper.case@domain.com", "Python")
    res2 = client.post(
        "/api/v1/resumes/upload/single",
        files={"file": ("lower.pdf", pdf_lower, "application/pdf")}
    )
    assert res2.status_code == 409
    assert "upper.case@domain.com" in res2.json()["detail"]
