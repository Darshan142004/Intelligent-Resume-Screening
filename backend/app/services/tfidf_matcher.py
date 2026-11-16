from typing import Optional, Any
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class TFIDFMatcherService:
    """
    TF-IDF baseline matching service.
    Computes normalized cosine similarity between candidate resume text
    and job description text using TF-IDF vectorization.
    """

    def __init__(
        self,
        token_pattern: str = r"(?u)\b[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*(?:[+#]+)?(?=\s|[,;.:!?]|\Z)",
        stop_words: str = "english",
        ngram_range: tuple = (1, 1),
        sublinear_tf: bool = True
    ):
        self.token_pattern = token_pattern
        self.stop_words = stop_words
        self.ngram_range = ngram_range
        self.sublinear_tf = sublinear_tf

    def compute_similarity(self, resume_text: str, job_description_text: str) -> float:
        """
        Compute baseline TF-IDF cosine similarity between resume and job description.

        Parameters:
            resume_text: Raw or extracted plain text from candidate resume.
            job_description_text: Text content of job description.

        Returns:
            Normalized similarity score between 0.0 and 1.0.
        """
        if not isinstance(resume_text, str) or not isinstance(job_description_text, str):
            return 0.0

        clean_resume = resume_text.strip()
        clean_job = job_description_text.strip()

        if not clean_resume or not clean_job:
            return 0.0

        try:
            vectorizer = TfidfVectorizer(
                token_pattern=self.token_pattern,
                stop_words=self.stop_words,
                ngram_range=self.ngram_range,
                sublinear_tf=self.sublinear_tf
            )
            tfidf_matrix = vectorizer.fit_transform([clean_resume, clean_job])
            similarity = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])

            if np.isnan(similarity) or np.isinf(similarity):
                return 0.0

            return round(float(np.clip(similarity, 0.0, 1.0)), 4)
        except ValueError:
            # Handles empty vocabulary error when documents contain only stop words
            return 0.0
        except Exception:
            return 0.0

    def compute_candidate_job_similarity(self, candidate: Any, job: Any) -> float:
        """
        Convenience method to compute TF-IDF similarity directly from Candidate and Job model instances.
        """
        resume_text = getattr(candidate, "raw_text", "") or ""
        job_text = getattr(job, "description", "") or ""
        return self.compute_similarity(resume_text, job_text)

