from typing import Dict, List, Any


class SkillGapAnalysisService:
    """
    Interface/Stub for computing missing and recommended skills between candidate and job.
    Implementation will be added in subsequent phases.
    """

    def analyze_skill_gap(self, candidate_skills: List[str], job_skills: List[str]) -> Dict[str, List[str]]:
        """
        Identify matched skills, missing required skills, and missing preferred skills.
        """
        raise NotImplementedError("Skill gap analysis will be implemented in Phase 4.")
