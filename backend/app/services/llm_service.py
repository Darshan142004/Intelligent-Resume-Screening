from typing import Optional, Dict, Any


class LLMExplanationService:
    """
    Interface/Stub for locally hosted Ollama open-source LLM explanations.
    Implementation will be added in subsequent phases.
    """

    def generate_explanation(
        self,
        candidate_summary: str,
        job_title: str,
        matching_scores: Dict[str, float]
    ) -> str:
        """
        Generate human-readable natural language screening and recommendation explanations.
        """
        raise NotImplementedError("LLM explanation service will be implemented in Phase 4.")
