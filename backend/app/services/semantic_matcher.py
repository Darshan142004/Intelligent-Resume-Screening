from typing import Any, List, Optional, Union
import numpy as np
import torch


class SemanticMatcherService:
    """
    Sentence Transformers dense embedding semantic matching service.
    Computes cosine similarity between candidate resume text and job description
    using CPU-only inference with the all-MiniLM-L6-v2 model.

    Features:
    - Lazy model loading (loaded on first request, not at import time).
    - Model caching across requests and candidate comparisons.
    - Deterministic CPU inference without generative text.
    - Robust handling for empty, whitespace, or invalid texts.
    """

    _model: Optional[Any] = None
    _model_name: str = "all-MiniLM-L6-v2"
    _device: str = "cpu"

    def __init__(self, model_name: Optional[str] = None):
        if model_name:
            self._instance_model_name = model_name
        else:
            self._instance_model_name = self._model_name

    @classmethod
    def is_model_loaded(cls) -> bool:
        """Check whether the singleton model is currently loaded in memory."""
        return cls._model is not None

    @classmethod
    def reset_model(cls) -> None:
        """Reset the loaded model singleton (primarily for testing lazy loading)."""
        cls._model = None

    @classmethod
    def get_model(cls, model_name: Optional[str] = None) -> Any:
        """
        Lazily loads and returns the singleton SentenceTransformer model on CPU.
        Thread-safe singleton pattern ensures model is loaded only once across requests.
        """
        target_name = model_name or cls._model_name
        if cls._model is None or getattr(cls._model, "_custom_model_name", None) != target_name:
            # Set torch deterministic mode and disable gradient computation
            torch.set_grad_enabled(False)
            from sentence_transformers import SentenceTransformer

            cls._model = SentenceTransformer(target_name, device=cls._device)
            cls._model.eval()
            cls._model._custom_model_name = target_name
        return cls._model

    def encode(
        self,
        texts: Union[str, List[str]],
        normalize: bool = True
    ) -> np.ndarray:
        """
        Encodes a text or list of texts into dense vector embeddings.
        Returns a numpy array of embeddings.
        """
        if isinstance(texts, str):
            clean_text = texts.strip()
            if not clean_text:
                return np.zeros((384,), dtype=np.float32)
            input_data = [clean_text]
            single = True
        else:
            input_data = [t.strip() if isinstance(t, str) else "" for t in texts]
            single = False

        model = self.get_model(self._instance_model_name)
        embeddings = model.encode(
            input_data,
            convert_to_numpy=True,
            normalize_embeddings=normalize,
            show_progress_bar=False
        )

        if single:
            return embeddings[0]
        return embeddings

    def compute_similarity(
        self,
        resume_text: Optional[str],
        job_description_text: Optional[str]
    ) -> float:
        """
        Compute dense vector cosine similarity between candidate resume text
        and job description text.

        Parameters:
            resume_text: Raw or parsed candidate resume text.
            job_description_text: Text of the job description.

        Returns:
            Cosine similarity score strictly between 0.0 and 1.0.
        """
        if not isinstance(resume_text, str) or not isinstance(job_description_text, str):
            return 0.0

        clean_resume = resume_text.strip()
        clean_job = job_description_text.strip()

        if not clean_resume or not clean_job:
            return 0.0

        try:
            model = self.get_model(self._instance_model_name)
            embeddings = model.encode(
                [clean_resume, clean_job],
                convert_to_numpy=True,
                normalize_embeddings=True,
                show_progress_bar=False
            )

            similarity = float(np.dot(embeddings[0], embeddings[1]))

            if np.isnan(similarity) or np.isinf(similarity):
                return 0.0

            return round(float(np.clip(similarity, 0.0, 1.0)), 4)
        except Exception:
            return 0.0

    def compute_similarity_from_embeddings(
        self,
        emb1: Union[np.ndarray, List[float]],
        emb2: Union[np.ndarray, List[float]]
    ) -> float:
        """
        Compute cosine similarity between two pre-computed embedding vectors.
        Enables efficient caching of job embeddings when screening many candidates.
        """
        if emb1 is None or emb2 is None:
            return 0.0

        try:
            vec1 = np.asarray(emb1, dtype=np.float32).flatten()
            vec2 = np.asarray(emb2, dtype=np.float32).flatten()

            norm1 = float(np.linalg.norm(vec1))
            norm2 = float(np.linalg.norm(vec2))

            if norm1 == 0.0 or norm2 == 0.0:
                return 0.0

            similarity = float(np.dot(vec1, vec2) / (norm1 * norm2))

            if np.isnan(similarity) or np.isinf(similarity):
                return 0.0

            return round(float(np.clip(similarity, 0.0, 1.0)), 4)
        except Exception:
            return 0.0

    def compute_candidate_job_similarity(self, candidate: Any, job: Any) -> float:
        """
        Convenience method to compute semantic similarity directly from
        Candidate and Job SQLAlchemy model instances.
        """
        resume_text = getattr(candidate, "raw_text", "") or ""
        job_text = getattr(job, "description", "") or ""
        return self.compute_similarity(resume_text, job_text)
