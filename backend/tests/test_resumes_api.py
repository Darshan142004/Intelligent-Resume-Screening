import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.test_resume_parser import create_sample_pdf_bytes, create_sample_docx_bytes

client = TestClient(app)


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
    pdf_bytes = create_sample_pdf_bytes()
    docx_bytes = create_sample_docx_bytes()
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
