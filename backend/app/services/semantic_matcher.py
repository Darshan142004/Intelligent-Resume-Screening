from typing import Dict, Any


class SemanticMatcherService:
    """
    Interface/Stub for Sentence Transformers embedding-based semantic matching.
    Implementation will be added in subsequent phases.
    """

    def compute_similarity(self, resume_text: str, job_description_text: str) -> float:
        """
        Compute dense vector semantic similarity using Sentence Transformers.
        """
        raise NotImplementedError("Semantic matching will be implemented in Phase 3.")
