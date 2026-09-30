from typing import Dict, Any


class HybridMatcherService:
    """
    Interface/Stub for combining TF-IDF, Semantic embeddings, and Skill overlap.
    Implementation will be added in subsequent phases.
    """

    def compute_hybrid_score(
        self,
        tfidf_score: float,
        semantic_score: float,
        skill_score: float
    ) -> float:
        """
        Combine baseline, semantic, and feature-based scores into a final hybrid matching score.
        """
        raise NotImplementedError("Hybrid matching will be implemented in Phase 3.")
