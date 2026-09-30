from typing import Dict, Any


class ResumeParserService:
    """
    Interface/Stub for parsing PDF and DOCX resumes.
    Implementation will be added in subsequent phases.
    """

    def parse_resume(self, file_path: str) -> Dict[str, Any]:
        """
        Extract raw text, candidate contact info, education, and experience.
        """
        raise NotImplementedError("Resume parsing will be implemented in Phase 2.")
