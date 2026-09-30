import re
from typing import Dict, Any, List, Optional
from app.services.skill_vocabulary import extract_skills_from_text

# Regex patterns for contact information
EMAIL_REGEX = re.compile(
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
    re.IGNORECASE
)

PHONE_REGEX = re.compile(
    r'(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}'
)

# Common Section Headings
SECTION_PATTERNS = {
    "education": re.compile(
        r'^(?:education|academic qualifications|academics|academic background|qualification|degrees|educational background)\b',
        re.IGNORECASE
    ),
    "experience": re.compile(
        r'^(?:work experience|experience|employment history|work history|professional experience|internship|internships|career history)\b',
        re.IGNORECASE
    ),
    "skills": re.compile(
        r'^(?:technical skills|skills|key skills|skills & expertise|technical expertise|core competencies|competencies)\b',
        re.IGNORECASE
    ),
    "projects": re.compile(
        r'^(?:projects|academic projects|key projects|personal projects|relevant projects)\b',
        re.IGNORECASE
    ),
    "certifications": re.compile(
        r'^(?:certifications|licenses & certifications|certifications & training|courses|training)\b',
        re.IGNORECASE
    ),
    "languages": re.compile(
        r'^(?:languages|languages known|spoken languages|language proficiency)\b',
        re.IGNORECASE
    )
}


def extract_email(text: str) -> Optional[str]:
    """Extract email address using regex pattern."""
    match = EMAIL_REGEX.search(text)
    return match.group(0).strip() if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number (Indian and International formats)."""
    matches = PHONE_REGEX.findall(text)
    for candidate in matches:
        clean = candidate.strip()
        # Ensure candidate contains at least 10 digits
        digits = re.sub(r'\D', '', clean)
        if 10 <= len(digits) <= 15:
            return clean
    return None


def extract_name(text: str) -> Optional[str]:
    """
    Extract candidate name from the top header lines using heuristics.
    Excludes lines containing emails, phone numbers, URLs, or standard resume titles.
    """
    lines = text.split("\n")[:10]
    for line in lines:
        clean_line = line.strip()
        if not clean_line or len(clean_line) < 3 or len(clean_line) > 50:
            continue
        
        # Skip if line contains email, phone, or website
        if EMAIL_REGEX.search(clean_line) or PHONE_REGEX.search(clean_line) or "http" in clean_line.lower() or "www." in clean_line.lower():
            continue
        
        # Skip common non-name headers
        lower_line = clean_line.lower()
        if any(keyword in lower_line for keyword in [
            "curriculum vitae", "resume", "biodata", "profile", "contact",
            "education", "experience", "skills", "summary", "address"
        ]):
            continue
        
        # Heuristic: Valid names usually contain 2-4 words, alphabetic characters + spaces/dots
        if re.match(r'^[a-zA-Z\s.\'-]{3,50}$', clean_line):
            # Format title case
            words = clean_line.split()
            if 1 <= len(words) <= 4:
                return " ".join(word.capitalize() for word in words)
            
    return None


def extract_sections(text: str) -> Dict[str, str]:
    """
    Parses resume text into sections based on recognized section headings.
    Returns a dictionary mapping section names to their text contents.
    """
    lines = text.split("\n")
    sections: Dict[str, List[str]] = {
        "education": [],
        "experience": [],
        "skills": [],
        "projects": [],
        "certifications": [],
        "languages": []
    }

    current_section: Optional[str] = None

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue

        # Check if line matches a known section heading
        matched_section = None
        for section_name, pattern in SECTION_PATTERNS.items():
            if pattern.search(stripped):
                matched_section = section_name
                break

        if matched_section:
            current_section = matched_section
            continue

        if current_section:
            sections[current_section].append(stripped)

    # Convert list of lines into joined string blocks
    return {sec: "\n".join(content_lines).strip() for sec, content_lines in sections.items()}


def extract_structured_information(raw_text: str) -> Dict[str, Any]:
    """
    Main extraction interface:
    Extracts name, contact info, education, experience, skills, projects, certifications,
    and languages using deterministic regex and pattern matching.
    """
    email = extract_email(raw_text)
    phone = extract_phone(raw_text)
    name = extract_name(raw_text)

    # Extract section blocks
    sections = extract_sections(raw_text)

    # Extract skills: from the dedicated Skills section + overall document text
    skills_list = extract_skills_from_text(raw_text)

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "education": sections["education"] if sections["education"] else None,
        "experience": sections["experience"] if sections["experience"] else None,
        "projects": sections["projects"] if sections["projects"] else None,
        "certifications": sections["certifications"] if sections["certifications"] else None,
        "languages": sections["languages"] if sections["languages"] else None,
        "skills": skills_list,
        "raw_text": raw_text
    }


class ResumeExtractorService:
    """
    Service abstraction for structured information extraction.
    """
    def extract_information(self, raw_text: str) -> Dict[str, Any]:
        return extract_structured_information(raw_text)
