from typing import Any, Dict, Iterable, List, Optional, Set
from app.services.skill_vocabulary import normalize_skill


class SkillGapAnalysisService:
    """
    Skill gap analysis service.
    Compares candidate skills against job required and preferred skills using
    canonical normalized skill representations.

    Features:
    - Independent calculation of required vs preferred skill matching.
    - Identification of matched and missing skills across both tiers.
    - Configurable weighted skill overlap score (default: 70% required, 30% preferred).
    - Robust handling for empty skill lists and candidate/job models.
    """

    def __init__(self, required_weight: float = 0.70, preferred_weight: float = 0.30):
        total = required_weight + preferred_weight
        if abs(total - 1.0) > 1e-4:
            raise ValueError(f"Skill weights must sum to 1.0 (got {total:.4f})")
        if required_weight < 0 or preferred_weight < 0:
            raise ValueError("Skill weights must be non-negative.")

        self.required_weight = required_weight
        self.preferred_weight = preferred_weight

    @staticmethod
    def _extract_skill_names(skills_input: Optional[Iterable[Any]]) -> Set[str]:
        """
        Extracts and normalizes skill names from a list/set of Skill models or strings.
        """
        if not skills_input:
            return set()

        normalized_set = set()
        for item in skills_input:
            if item is None:
                continue
            if hasattr(item, "name"):
                name = getattr(item, "name", "")
            elif isinstance(item, str):
                name = item
            else:
                name = str(item)

            clean_name = name.strip()
            if clean_name:
                normalized_set.add(normalize_skill(clean_name))

        return normalized_set

    def compute_skill_overlap_score(
        self,
        candidate_skills: Optional[Iterable[Any]],
        required_skills: Optional[Iterable[Any]],
        preferred_skills: Optional[Iterable[Any]] = None
    ) -> float:
        """
        Compute normalized skill overlap score between candidate and job skills.
        Returns a float between 0.0 and 1.0.
        """
        cand_set = self._extract_skill_names(candidate_skills)
        req_set = self._extract_skill_names(required_skills)
        pref_set = self._extract_skill_names(preferred_skills)

        # Handle empty job skills
        if not req_set and not pref_set:
            return 0.0

        matched_req = cand_set & req_set
        matched_pref = cand_set & pref_set

        req_ratio = len(matched_req) / len(req_set) if req_set else 0.0
        pref_ratio = len(matched_pref) / len(pref_set) if pref_set else 0.0

        if req_set and pref_set:
            score = (self.required_weight * req_ratio) + (self.preferred_weight * pref_ratio)
        elif req_set:
            score = req_ratio
        else:
            score = pref_ratio

        return round(float(max(0.0, min(1.0, score))), 4)

    def analyze_skill_gap(
        self,
        candidate_skills: Optional[Iterable[Any]],
        required_skills: Optional[Iterable[Any]],
        preferred_skills: Optional[Iterable[Any]] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive skill gap breakdown between candidate skills and job requirements.

        Returns:
            Dictionary containing:
            - matched_required_skills: List of required skills the candidate possesses.
            - missing_required_skills: List of required skills the candidate lacks.
            - matched_preferred_skills: List of preferred skills the candidate possesses.
            - missing_preferred_skills: List of preferred skills the candidate lacks.
            - matched_skills: Union of matched required and preferred skills.
            - missing_skills: Union of missing required and preferred skills.
            - skill_overlap_score: Weighted composite score (0.0 to 1.0).
            - required_match_ratio: Proportion of required skills matched (0.0 to 1.0).
            - preferred_match_ratio: Proportion of preferred skills matched (0.0 to 1.0).
        """
        cand_set = self._extract_skill_names(candidate_skills)
        req_set = self._extract_skill_names(required_skills)
        pref_set = self._extract_skill_names(preferred_skills)

        matched_req = sorted(list(cand_set & req_set))
        missing_req = sorted(list(req_set - cand_set))

        matched_pref = sorted(list(cand_set & pref_set))
        missing_pref = sorted(list(pref_set - cand_set))

        matched_all = sorted(list(set(matched_req) | set(matched_pref)))
        missing_all = sorted(list(set(missing_req) | set(missing_pref)))

        req_ratio = round(len(matched_req) / len(req_set), 4) if req_set else 0.0
        pref_ratio = round(len(matched_pref) / len(pref_set), 4) if pref_set else 0.0

        if req_set and pref_set:
            score = (self.required_weight * req_ratio) + (self.preferred_weight * pref_ratio)
        elif req_set:
            score = req_ratio
        elif pref_set:
            score = pref_ratio
        else:
            score = 0.0

        final_score = round(float(max(0.0, min(1.0, score))), 4)

        return {
            "matched_required_skills": matched_req,
            "missing_required_skills": missing_req,
            "matched_preferred_skills": matched_pref,
            "missing_preferred_skills": missing_pref,
            "matched_skills": matched_all,
            "missing_skills": missing_all,
            "skill_overlap_score": final_score,
            "required_match_ratio": req_ratio,
            "preferred_match_ratio": pref_ratio,
        }

    def analyze_candidate_job_gap(self, candidate: Any, job: Any) -> Dict[str, Any]:
        """
        Analyzes skill gaps directly from Candidate and Job SQLAlchemy model instances.
        """
        cand_skills = getattr(candidate, "skills", []) or []
        req_skills = getattr(job, "required_skills", []) or []
        pref_skills = getattr(job, "preferred_skills", []) or []
        return self.analyze_skill_gap(cand_skills, req_skills, pref_skills)

    def compute_candidate_job_skill_score(self, candidate: Any, job: Any) -> float:
        """
        Computes skill overlap score directly from Candidate and Job SQLAlchemy model instances.
        """
        cand_skills = getattr(candidate, "skills", []) or []
        req_skills = getattr(job, "required_skills", []) or []
        pref_skills = getattr(job, "preferred_skills", []) or []
        return self.compute_skill_overlap_score(cand_skills, req_skills, pref_skills)
