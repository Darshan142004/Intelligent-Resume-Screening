from typing import Dict, Any


class TFIDFMatcherService:
    """
    Interface/Stub for baseline TF-IDF cosine similarity matching.
    Implementation will be added in subsequent phases.
    """

    def compute_similarity(self, resume_text: str, job_description_text: str) -> float:
        """
        Compute baseline TF-IDF cosine similarity between resume and job description.
        """
        raise NotImplementedError("TF-IDF baseline matching will be implemented in Phase 3.")
