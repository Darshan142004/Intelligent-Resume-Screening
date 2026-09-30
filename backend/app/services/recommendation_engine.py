from typing import List, Dict, Any


class RecommendationEngineService:
    """
    Interface/Stub for job recommendation generation for candidate profiles.
    Implementation will be added in subsequent phases.
    """

    def generate_recommendations(self, candidate_id: int) -> List[Dict[str, Any]]:
        """
        Rank candidate against available jobs in DB and return top recommendations.
        """
        raise NotImplementedError("Job recommendation engine will be implemented in Phase 4.")
