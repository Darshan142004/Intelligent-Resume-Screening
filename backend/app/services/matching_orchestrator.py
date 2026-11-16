from typing import Any, Dict, List, Optional
from datetime import datetime, timezone
import numpy as np
from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload
from app.models.candidate import Candidate
from app.models.job import Job
from app.models.matching import MatchingResult
from app.services.tfidf_matcher import TFIDFMatcherService
from app.services.semantic_matcher import SemanticMatcherService
from app.services.skill_gap import SkillGapAnalysisService
from app.services.hybrid_matcher import HybridMatcherService
from app.services.resume_extractor import normalize_email


class MatchingOrchestrationService:
    """
    Central orchestration service for NLP matching and candidate ranking.

    Coordinates:
    1. Lexical matching via TF-IDF (TFIDFMatcherService)
    2. Dense semantic similarity via Sentence Transformers (SemanticMatcherService)
    3. Structured skill gap analysis (SkillGapAnalysisService)
    4. Composite hybrid ranking (HybridMatcherService)

    Persists and idempotently updates results in the matching_results table.
    """

    def __init__(
        self,
        tfidf_matcher: Optional[TFIDFMatcherService] = None,
        semantic_matcher: Optional[SemanticMatcherService] = None,
        skill_gap_service: Optional[SkillGapAnalysisService] = None,
        hybrid_matcher: Optional[HybridMatcherService] = None,
    ):
        self.tfidf_matcher = tfidf_matcher or TFIDFMatcherService()
        self.semantic_matcher = semantic_matcher or SemanticMatcherService()
        self.skill_gap_service = skill_gap_service or SkillGapAnalysisService()
        self.hybrid_matcher = hybrid_matcher or HybridMatcherService()

    def match_candidate_and_job(
        self,
        db: Session,
        candidate: Candidate,
        job: Job,
        persist: bool = True
    ) -> Dict[str, Any]:
        """
        Executes complete NLP matching pipeline for a single Candidate and Job pair.
        Optionally persists or updates the result idempotently in the matching_results table.
        Ensures in-memory skill aggregation consistency for candidate email groups.
        """
        # Ensure in-memory skill aggregation consistency if sibling profiles exist for this email
        if getattr(candidate, "email", None) and db:
            norm_email = normalize_email(candidate.email)
            if norm_email:
                sibling_candidates = (
                    db.query(Candidate)
                    .options(selectinload(Candidate.skills))
                    .filter(func.lower(Candidate.email) == norm_email, Candidate.id != candidate.id)
                    .all()
                )
                if sibling_candidates:
                    existing_skill_ids = {s.id for s in (candidate.skills or []) if hasattr(s, "id")}
                    aggregated_skills = list(candidate.skills or [])
                    for sibling in sibling_candidates:
                        for s in (sibling.skills or []):
                            s_id = getattr(s, "id", None)
                            if s_id and s_id not in existing_skill_ids:
                                existing_skill_ids.add(s_id)
                                aggregated_skills.append(s)
                    candidate.skills = aggregated_skills

        # 1. TF-IDF lexical score
        tfidf_score = self.tfidf_matcher.compute_candidate_job_similarity(candidate, job)

        # 2. Dense semantic score (Sentence Transformers)
        semantic_score = self.semantic_matcher.compute_candidate_job_similarity(candidate, job)

        # 3. Structured skill gap breakdown
        gap_result = self.skill_gap_service.analyze_candidate_job_gap(candidate, job)
        skill_score = gap_result["skill_overlap_score"]

        # 4. Composite hybrid score
        hybrid_score = self.hybrid_matcher.compute_hybrid_score(
            tfidf_score=tfidf_score,
            semantic_score=semantic_score,
            skill_score=skill_score
        )

        matching_record = None
        if persist:
            # Check for existing matching result to avoid duplicate records
            matching_record = db.query(MatchingResult).filter(
                MatchingResult.candidate_id == candidate.id,
                MatchingResult.job_id == job.id
            ).first()

            if matching_record:
                # Update existing record idempotently
                matching_record.tfidf_score = tfidf_score
                matching_record.semantic_score = semantic_score
                matching_record.skill_score = skill_score
                matching_record.hybrid_score = hybrid_score
                matching_record.created_at = datetime.now(timezone.utc)
            else:
                # Create new record
                matching_record = MatchingResult(
                    candidate_id=candidate.id,
                    job_id=job.id,
                    tfidf_score=tfidf_score,
                    semantic_score=semantic_score,
                    skill_score=skill_score,
                    hybrid_score=hybrid_score
                )
                db.add(matching_record)

            db.commit()
            db.refresh(matching_record)

        return {
            "matching_record_id": matching_record.id if matching_record else None,
            "candidate_id": candidate.id,
            "job_id": job.id,
            "candidate_name": candidate.name,
            "candidate_email": candidate.email,
            "candidate_phone": candidate.phone,
            "tfidf_score": tfidf_score,
            "semantic_score": semantic_score,
            "skill_score": skill_score,
            "skill_overlap_score": skill_score,
            "hybrid_score": hybrid_score,
            "matched_skills": gap_result["matched_skills"],
            "missing_skills": gap_result["missing_skills"],
            "matched_required_skills": gap_result["matched_required_skills"],
            "missing_required_skills": gap_result["missing_required_skills"],
            "matched_preferred_skills": gap_result["matched_preferred_skills"],
            "missing_preferred_skills": gap_result["missing_preferred_skills"],
            "required_match_ratio": gap_result["required_match_ratio"],
            "preferred_match_ratio": gap_result["preferred_match_ratio"]
        }

    @staticmethod
    def _evaluate_candidate_completeness(candidate: Candidate) -> tuple:
        """
        Calculates a deterministic fitness tuple to choose the best representative
        candidate in a duplicate email group.

        Evaluation Criteria:
        1. Section & Contact Completeness Score:
           - Full name (2+ words: +2, 1 word: +1)
           - Phone (+1)
           - Education (+1)
           - Experience (+1)
           - Projects (+1)
           - Certifications (+1)
           - Languages (+1)
           - Substantive resume text (>100 chars: +2, >0: +1)
        2. Extracted Skills Count (len(candidate.skills))
        3. Raw Text Length (len(raw_text.strip()))
        4. Creation/Update Timestamp (most recent upload)
        5. Candidate ID (deterministic tie-breaker)
        """
        raw_text = getattr(candidate, "raw_text", "") or ""
        text_len = len(raw_text.strip())
        skills_count = len(getattr(candidate, "skills", []) or [])

        score = 0
        name = getattr(candidate, "name", "") or ""
        if name.strip():
            words = name.strip().split()
            score += 2 if len(words) >= 2 else 1

        if getattr(candidate, "phone", None):
            score += 1
        if getattr(candidate, "education", None):
            score += 1
        if getattr(candidate, "experience", None):
            score += 1
        if getattr(candidate, "projects", None):
            score += 1
        if getattr(candidate, "certifications", None):
            score += 1
        if getattr(candidate, "languages", None):
            score += 1

        if text_len > 100:
            score += 2
        elif text_len > 0:
            score += 1

        created = getattr(candidate, "created_at", None) or datetime.min
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)

        cand_id = getattr(candidate, "id", 0) or 0
        return (score, skills_count, text_len, created, cand_id)

    def select_unique_representatives(
        self,
        candidates: List[Candidate]
    ) -> List[Candidate]:
        """
        Deduplicates candidate profiles so each unique candidate appears exactly once.

        Policy:
        - Groups candidates by normalized email (strip + lower).
        - Candidates with missing/empty email remain independent (keyed by candidate ID).
        - Candidates with matching names but different emails remain separate.
        - For duplicate email groups: selects the best representative profile based on
          deterministic fitness (completeness score, skills count, text length, recency).
        - In-memory non-destructive skill aggregation: the representative inherits any
          additional skills identified in other profiles within the same email group.
        """
        if not candidates:
            return []

        from collections import defaultdict

        groups: Dict[str, List[Candidate]] = defaultdict(list)

        for c in candidates:
            norm_email = normalize_email(getattr(c, "email", None))
            if norm_email:
                groups[norm_email].append(c)
            else:
                # Candidates with missing email remain independent
                groups[f"__no_email_id_{c.id}__"].append(c)

        representatives: List[Candidate] = []

        for key, group in groups.items():
            if len(group) == 1:
                rep = group[0]
                rep._duplicate_count = 1
                representatives.append(rep)
            else:
                # Select best representative by deterministic fitness
                best_rep = max(group, key=self._evaluate_candidate_completeness)

                # Non-destructive in-memory skill union across all profiles in this group
                existing_skill_ids = {s.id for s in (best_rep.skills or []) if hasattr(s, "id")}
                aggregated_skills = list(best_rep.skills or [])
                for other in group:
                    if other.id != best_rep.id and other.skills:
                        for s in other.skills:
                            s_id = getattr(s, "id", None)
                            if s_id and s_id not in existing_skill_ids:
                                existing_skill_ids.add(s_id)
                                aggregated_skills.append(s)
                best_rep.skills = aggregated_skills
                best_rep._duplicate_count = len(group)
                representatives.append(best_rep)

        return representatives

    def rank_candidates_for_job(
        self,
        db: Session,
        job: Job,
        candidates: List[Candidate],
        persist: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Screens and ranks unique candidates against a job description.
        Ensures each unique candidate appears exactly ONCE per job.
        """
        if not candidates:
            return []

        # Deduplicate candidates to unique representatives
        unique_candidates = self.select_unique_representatives(candidates)

        job_desc = (job.description or "").strip()

        # Step A: Compute semantic similarities efficiently
        # 1. Encode job description once
        job_embedding = None
        if job_desc:
            job_embedding = self.semantic_matcher.encode(job_desc, normalize=True)

        # 2. Extract valid non-empty resume texts and batch encode
        candidate_semantic_scores: Dict[int, float] = {}
        valid_candidate_entries = [
            (c.id, c.raw_text.strip())
            for c in unique_candidates
            if c.raw_text and isinstance(c.raw_text, str) and c.raw_text.strip()
        ]

        if job_embedding is not None and valid_candidate_entries:
            cand_ids = [entry[0] for entry in valid_candidate_entries]
            cand_texts = [entry[1] for entry in valid_candidate_entries]

            # Single batch inference pass for all candidate resumes
            cand_embeddings = np.atleast_2d(self.semantic_matcher.encode(cand_texts, normalize=True))

            for cid, c_emb in zip(cand_ids, cand_embeddings):
                sim = float(np.squeeze(np.dot(c_emb, job_embedding)))
                if np.isnan(sim) or np.isinf(sim):
                    sim = 0.0
                candidate_semantic_scores[cid] = round(float(np.clip(sim, 0.0, 1.0)), 4)

        # Step B: Compute matching components for each unique candidate
        evaluation_results: List[Dict[str, Any]] = []

        for candidate in unique_candidates:
            cand_text = candidate.raw_text or ""

            # 1. TF-IDF score
            tfidf_score = self.tfidf_matcher.compute_similarity(cand_text, job_desc)

            # 2. Semantic score (from batch cache or 0.0 if empty)
            semantic_score = candidate_semantic_scores.get(candidate.id, 0.0)

            # 3. Skill gap analysis
            gap_result = self.skill_gap_service.analyze_candidate_job_gap(candidate, job)
            skill_score = gap_result["skill_overlap_score"]

            # 4. Hybrid score
            hybrid_score = self.hybrid_matcher.compute_hybrid_score(
                tfidf_score=tfidf_score,
                semantic_score=semantic_score,
                skill_score=skill_score
            )

            evaluation_results.append({
                "candidate_id": candidate.id,
                "candidate_name": candidate.name,
                "candidate_email": candidate.email,
                "candidate_phone": candidate.phone,
                "job_id": job.id,
                "tfidf_score": tfidf_score,
                "semantic_score": semantic_score,
                "skill_score": skill_score,
                "hybrid_score": hybrid_score,
                "matched_skills": gap_result["matched_skills"],
                "missing_skills": gap_result["missing_skills"],
                "matched_required_skills": gap_result["matched_required_skills"],
                "missing_required_skills": gap_result["missing_required_skills"],
                "matched_preferred_skills": gap_result["matched_preferred_skills"],
                "missing_preferred_skills": gap_result["missing_preferred_skills"],
                "duplicate_count": getattr(candidate, "_duplicate_count", 1),
            })

        # Step C: Idempotent database persistence in a single transaction
        if persist:
            existing_records = {
                mr.candidate_id: mr
                for mr in db.query(MatchingResult).filter(MatchingResult.job_id == job.id).all()
            }

            for item in evaluation_results:
                cid = item["candidate_id"]
                if cid in existing_records:
                    rec = existing_records[cid]
                    rec.tfidf_score = item["tfidf_score"]
                    rec.semantic_score = item["semantic_score"]
                    rec.skill_score = item["skill_score"]
                    rec.hybrid_score = item["hybrid_score"]
                    rec.created_at = datetime.now(timezone.utc)
                else:
                    rec = MatchingResult(
                        candidate_id=cid,
                        job_id=job.id,
                        tfidf_score=item["tfidf_score"],
                        semantic_score=item["semantic_score"],
                        skill_score=item["skill_score"],
                        hybrid_score=item["hybrid_score"]
                    )
                    db.add(rec)

            db.commit()

        # Step D: Sort descending by hybrid score (tie-breaker: semantic, skill, candidate_id)
        evaluation_results.sort(
            key=lambda x: (x["hybrid_score"], x["semantic_score"], x["skill_score"], -x["candidate_id"]),
            reverse=True
        )

        # Step E: Assign 1-based ranks
        for rank_idx, item in enumerate(evaluation_results, start=1):
            item["rank"] = rank_idx

        return evaluation_results
