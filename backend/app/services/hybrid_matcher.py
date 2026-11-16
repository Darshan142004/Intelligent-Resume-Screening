from typing import Any, Dict, Optional
import numpy as np


class HybridMatcherService:
    """
    Hybrid candidate-job matching service combining lexical, semantic,
    and structured skill overlap analyses.

    Formula:
        Hybrid Score = (w_tfidf * TF-IDF Score) +
                       (w_semantic * Semantic Score) +
                       (w_skill * Skill Overlap Score)

    Initial Experimental Weights:
        TF-IDF: 0.25 (Lexical keyword matching baseline)
        Semantic: 0.45 (Dense sentence-transformers conceptual similarity)
        Skill Overlap: 0.30 (Explicit required and preferred skill coverage)

    IMPORTANT NOTICE:
        These weights (0.25, 0.45, 0.30) are initial experimental baseline values
        derived from the project synopsis. They are designed to be configurable
        and must be empirically evaluated, benchmarked, and calibrated against
        annotated recruiter datasets in production or validation phases.
    """

    DEFAULT_TFIDF_WEIGHT: float = 0.25
    DEFAULT_SEMANTIC_WEIGHT: float = 0.45
    DEFAULT_SKILL_WEIGHT: float = 0.30

    def __init__(
        self,
        tfidf_weight: float = DEFAULT_TFIDF_WEIGHT,
        semantic_weight: float = DEFAULT_SEMANTIC_WEIGHT,
        skill_weight: float = DEFAULT_SKILL_WEIGHT,
        tolerance: float = 1e-4
    ):
        self._tolerance = tolerance
        self.set_weights(tfidf_weight, semantic_weight, skill_weight)

    def set_weights(
        self,
        tfidf_weight: float,
        semantic_weight: float,
        skill_weight: float
    ) -> None:
        """
        Configures and validates matcher weights.
        Ensures all weights are non-negative and sum to 1.0 within floating point tolerance.
        """
        for w, name in [
            (tfidf_weight, "tfidf_weight"),
            (semantic_weight, "semantic_weight"),
            (skill_weight, "skill_weight")
        ]:
            if not isinstance(w, (int, float)) or isinstance(w, bool):
                raise TypeError(f"Weight '{name}' must be numeric, got {type(w).__name__}")
            if w < 0.0:
                raise ValueError(f"Weight '{name}' must be non-negative, got {w}")

        total = tfidf_weight + semantic_weight + skill_weight
        if abs(total - 1.0) > self._tolerance:
            raise ValueError(
                f"Matching weights must sum to 1.0 (got {total:.4f} from "
                f"tfidf={tfidf_weight}, semantic={semantic_weight}, skill={skill_weight})"
            )

        self.tfidf_weight = float(tfidf_weight)
        self.semantic_weight = float(semantic_weight)
        self.skill_weight = float(skill_weight)

    @staticmethod
    def validate_score(score: Any, score_name: str) -> float:
        """
        Validates an input matching component score.
        Must be a finite numeric value between 0.0 and 1.0.
        """
        if score is None:
            raise ValueError(f"Score for '{score_name}' cannot be None.")
        if not isinstance(score, (int, float)) or isinstance(score, bool):
            raise TypeError(f"Score for '{score_name}' must be numeric, got {type(score).__name__}")
        if np.isnan(score) or np.isinf(score):
            raise ValueError(f"Score for '{score_name}' must be a finite number, got {score}")
        if score < 0.0 or score > 1.0:
            raise ValueError(f"Score for '{score_name}' must be between 0.0 and 1.0 inclusive, got {score}")
        return float(score)

    def compute_hybrid_score(
        self,
        tfidf_score: float,
        semantic_score: float,
        skill_score: float
    ) -> float:
        """
        Computes the weighted hybrid match score.

        Parameters:
            tfidf_score: TF-IDF cosine similarity [0.0, 1.0]
            semantic_score: Sentence Transformer embedding cosine similarity [0.0, 1.0]
            skill_score: Normalized skill overlap score [0.0, 1.0]

        Returns:
            Composite hybrid score rounded to 4 decimal places between 0.0 and 1.0.
        """
        v_tfidf = self.validate_score(tfidf_score, "tfidf_score")
        v_semantic = self.validate_score(semantic_score, "semantic_score")
        v_skill = self.validate_score(skill_score, "skill_score")

        hybrid = (
            (self.tfidf_weight * v_tfidf) +
            (self.semantic_weight * v_semantic) +
            (self.skill_weight * v_skill)
        )

        clamped = max(0.0, min(1.0, hybrid))
        return round(float(clamped), 4)

    def match_candidate_job(
        self,
        candidate: Any,
        job: Any,
        tfidf_matcher: Optional[Any] = None,
        semantic_matcher: Optional[Any] = None,
        skill_gap_service: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Full integration pipeline matching an existing Candidate SQLAlchemy model
        instance against a Job SQLAlchemy model instance.

        Uses:
        - candidate.raw_text and job.description for TF-IDF and Semantic matching.
        - candidate.skills, job.required_skills, job.preferred_skills for Skill Gap analysis.

        Returns comprehensive matching breakdown and composite hybrid score.
        """
        from app.services.tfidf_matcher import TFIDFMatcherService
        from app.services.semantic_matcher import SemanticMatcherService
        from app.services.skill_gap import SkillGapAnalysisService

        tfidf = tfidf_matcher or TFIDFMatcherService()
        semantic = semantic_matcher or SemanticMatcherService()
        skill_service = skill_gap_service or SkillGapAnalysisService()

        # Step 1: Lexical TF-IDF match
        tfidf_score = tfidf.compute_candidate_job_similarity(candidate, job)

        # Step 2: Semantic embedding match
        semantic_score = semantic.compute_candidate_job_similarity(candidate, job)

        # Step 3: Structured skill gap analysis
        gap_result = skill_service.analyze_candidate_job_gap(candidate, job)
        skill_score = gap_result["skill_overlap_score"]

        # Step 4: Hybrid score calculation
        hybrid_score = self.compute_hybrid_score(tfidf_score, semantic_score, skill_score)

        return {
            "candidate_id": getattr(candidate, "id", None),
            "job_id": getattr(job, "id", None),
            "tfidf_score": tfidf_score,
            "semantic_score": semantic_score,
            "skill_score": skill_score,
            "hybrid_score": hybrid_score,
            "matched_required_skills": gap_result["matched_required_skills"],
            "missing_required_skills": gap_result["missing_required_skills"],
            "matched_preferred_skills": gap_result["matched_preferred_skills"],
            "missing_preferred_skills": gap_result["missing_preferred_skills"],
            "matched_skills": gap_result["matched_skills"],
            "missing_skills": gap_result["missing_skills"],
            "required_match_ratio": gap_result["required_match_ratio"],
            "preferred_match_ratio": gap_result["preferred_match_ratio"]
        }
