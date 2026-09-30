from typing import List, Dict, Any


class SkillExtractorService:
    """
    Interface/Stub for technical and soft skill extraction and normalization.
    Implementation will be added in subsequent phases.
    """

    def extract_skills(self, text: str) -> Dict[str, List[str]]:
        """
        Extract technical, soft, and domain skills from raw text.
        """
        raise NotImplementedError("Skill extraction will be implemented in Phase 2.")
