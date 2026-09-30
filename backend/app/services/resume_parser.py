import io
import re
from typing import Union
import pymupdf as fitz
import docx


class ResumeParsingError(Exception):
    """Custom exception raised when resume text extraction fails."""
    pass


def parse_pdf(file_input: Union[bytes, str]) -> str:
    """
    Extract raw plain text from a PDF file (path or bytes) using PyMuPDF.
    """
    text_chunks = []
    try:
        if isinstance(file_input, bytes):
            doc = fitz.open(stream=file_input, filetype="pdf")
        else:
            doc = fitz.open(file_input)

        if doc.is_encrypted:
            raise ResumeParsingError("PDF file is encrypted or password protected.")

        for page in doc:
            page_text = page.get_text("text")
            if page_text:
                text_chunks.append(page_text)
        
        doc.close()
    except Exception as e:
        if isinstance(e, ResumeParsingError):
            raise
        raise ResumeParsingError(f"Failed to parse PDF document: {str(e)}")

    extracted = "\n".join(text_chunks).strip()
    if not extracted:
        raise ResumeParsingError("PDF file contains no extractable text (it may be a scanned image or empty).")

    return extracted


def parse_docx(file_input: Union[bytes, str]) -> str:
    """
    Extract plain text from a DOCX file (path or bytes) using python-docx.
    """
    text_chunks = []
    try:
        if isinstance(file_input, bytes):
            doc_file = io.BytesIO(file_input)
            doc = docx.Document(doc_file)
        else:
            doc = docx.Document(file_input)

        # Extract text from paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_chunks.append(paragraph.text.strip())

        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    text_chunks.append(" | ".join(row_text))

    except Exception as e:
        raise ResumeParsingError(f"Failed to parse DOCX document: {str(e)}")

    extracted = "\n".join(text_chunks).strip()
    if not extracted:
        raise ResumeParsingError("DOCX file contains no extractable text.")

    return extracted


def preprocess_extracted_text(raw_text: str) -> str:
    """
    Lightweight text preprocessing:
    - Normalizes carriage returns and multiple consecutive spaces.
    - Preserves line breaks and paragraph structure for section heading detection.
    - Strips empty lines while preserving section boundaries.
    """
    if not raw_text:
        return ""

    # Replace windows line endings
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")

    # Replace multiple spaces/tabs within lines with single space
    lines = []
    for line in text.split("\n"):
        cleaned_line = re.sub(r'[ \t]+', ' ', line).strip()
        if cleaned_line:
            lines.append(cleaned_line)

    return "\n".join(lines)


def parse_resume(file_content: bytes, filename: str) -> str:
    """
    Main parser service interface:
    Detects file format (.pdf / .docx), extracts text, applies lightweight preprocessing,
    and returns normalized plain text.
    """
    if not file_content or len(file_content) == 0:
        raise ResumeParsingError("File is empty (0 bytes).")

    ext = filename.lower().rsplit('.', 1)[-1] if '.' in filename else ''

    if ext == 'pdf':
        raw_text = parse_pdf(file_content)
    elif ext == 'docx':
        raw_text = parse_docx(file_content)
    else:
        raise ResumeParsingError(f"Unsupported file format: '.{ext}'. Supported formats are .pdf and .docx")

    processed_text = preprocess_extracted_text(raw_text)
    if not processed_text:
        raise ResumeParsingError("Extracted text is empty after preprocessing.")

    return processed_text


class ResumeParserService:
    """
    Service abstraction for resume text extraction.
    """
    def extract_text(self, file_content: bytes, filename: str) -> str:
        return parse_resume(file_content, filename)
