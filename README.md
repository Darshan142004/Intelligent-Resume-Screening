# Intelligent Resume Screening and Job Matching System Using NLP

An MCA Minor Project implementing an automated technical pipeline for resume ingestion, structured candidate information extraction, deterministic natural language processing (NLP) candidate-to-selected-job matching, recruiter candidate ranking, and candidate skill-gap analysis.

---

## Technical Overview & Problem Statement

Technical recruitment screening presents significant information extraction and document matching challenges:
1. **The Vocabulary Gap (Lexical Mismatch)**: Qualified candidates and job descriptions often employ differing terminology or abbreviations for equivalent technical skills, frameworks, and responsibilities. Keyword-only queries fail to capture these semantic relationships.
2. **Contextual Omission**: Frequency-based keyword counters cannot distinguish between core qualifications and incidental mentions, nor can they determine the surrounding technical context.
3. **Information Heterogeneity**: Resumes arrive in disparate unstructured formats (PDF, DOCX) with varied visual formatting, table layouts, and section conventions.

This project implements a multi-stage deterministic pipeline combining structured text extraction, lexical matching baseline (TF-IDF), dense semantic vector proximity (Sentence Transformers), and structured qualification coverage (Skill Gap Analysis). The system serves as an algorithmic decision-support tool to assist recruiters in triaging applicants against specific, user-selected job requisitions.

---

## Key Design Principles

- **Deterministic NLP Architecture**: The matching engine relies exclusively on deterministic text processing methods: TF-IDF n-gram vectorization, structured skill cataloging with synonym/alias mapping, and pretrained Sentence Transformer embeddings (`all-MiniLM-L6-v2`).
- **CPU-Based Inference**: Designed and optimized for deterministic CPU inference without requiring dedicated GPU infrastructure or local generative language model runtimes (no Generative LLM integration and no Ollama).
- **Candidate-to-Selected-Job Matching**: Directly evaluates candidate qualifications against a specific job requisition selected by the user, rather than executing unconstrained or unrestricted job recommendations across broad document collections.
- **Fixed Vector Representations**: Pretrained sentence embeddings map resume and job text deterministically into fixed-length 384-dimensional dense vectors. The pipeline performs no freeform text generation, eliminating generative language model text generation artifacts.
- **Offline Inference Operation**: The `all-MiniLM-L6-v2` model weights require an initial download from Hugging Face if not cached in the environment. Once cached locally, inference operates entirely offline without external network communication.
- **Test Isolation**: Development and demonstration database records are protected during automated test execution through dedicated test databases and transactional rollbacks.

---

## System Architecture

```text
               +--------------------------------------------+
               |          React + TypeScript UI             |
               | (Recruiter Management & Candidate Portal)  |
               +---------------------+----------------------+
                                     |
                                     | HTTP REST (/api/v1)
                                     v
               +--------------------------------------------+
               |              FastAPI Backend               |
               +---------------------+----------------------+
                                     |
            +------------------------+------------------------+
            |                                                 |
            v                                                 v
+-----------------------+                         +-----------------------+
|   Resume Ingestion    |                         |  PostgreSQL 15 DB     |
|   & Text Extraction   |                         | (Candidates, Jobs,    |
|   (PyMuPDF, docx)     |                         |  Skills, Results)     |
+-----------+-----------+                         +-----------+-----------+
            |                                                 |
            +------------------------+------------------------+
                                     |
                                     v
                        +-------------------------+
                        | Matching Orchestrator   |
                        +------------+------------+
                                     |
            +------------------------+------------------------+
            |                        |                        |
            v                        v                        v
+-----------------------+  +-------------------+  +-----------------------+
|  TF-IDF Matcher (25%) |  | Semantic Matcher  |  |  Skill Gap Analyzer   |
|  Lexical Overlap      |  | all-MiniLM-L6-v2  |  |  Required & Preferred |
|  Unigrams & Bigrams   |  | Dense Vectors(45%)|  |  Coverage (30%)       |
+-----------+-----------+  +---------+---------+  +-----------+-----------+
            |                        |                        |
            +------------------------+------------------------+
                                     |
                                     v
                        +-------------------------+
                        |  Hybrid Matcher Service |
                        |  Composite Score [0, 1] |
                        +------------+------------+
                                     |
                                     v
                        +-------------------------+
                        | Idempotent Persistence  |
                        | & Ranked Output Results |
                        +-------------------------+
```

---

## Methodology & Algorithmic Pipeline

### 1. Resume Ingestion & Structured Information Extraction
- **Document Parsing**: Extracts raw text from `.pdf` documents using PyMuPDF and `.docx` documents using python-docx, with per-file error handling to ensure batch ingestion resilience.
- **Text Normalization**: Strips non-standard whitespace, normalizes Unicode encoding, and segments text into logical sections (Experience, Education, Skills, Certifications).
- **Metadata Extraction**: Regular expressions and pattern heuristics extract candidate identity attributes (Full Name, Email Address, Phone Number).
- **Technical Skill Cataloging**: Scans candidate text against a structured technical skills vocabulary incorporating aliases and synonyms (e.g., mapping `JS` to `JavaScript`, `Postgres` to `PostgreSQL`). Extracted skills are normalized and stored as relational entities.

### 2. Lexical Matching Baseline (TF-IDF)
- **Vectorization**: Transforms preprocessed resume and job texts into term frequency-inverse document frequency vectors using sublinear term-frequency scaling ($1 + \log(\text{tf})$) and an n-gram range of $(1, 2)$ (unigrams and bigrams).
- **Cosine Similarity**: Computes the inner product between normalized L2 document vectors:
  $$\text{Sim}_{\text{TF-IDF}}(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2}$$
- **Score Normalization**: Similarity scores are normalized to the [0.0, 1.0] range.

### 3. Semantic Vector Matching (Pretrained Sentence Transformer)
- **Model**: Employs the pretrained `all-MiniLM-L6-v2` model from the Sentence-Transformers library.
- **Dense Embeddings**: Generates 384-dimensional dense semantic vectors ($\mathbf{e}_{\text{resume}}, \mathbf{e}_{\text{job}} \in \mathbb{R}^{384}$) capturing contextual and semantic sentence-level proximity.
- **Cosine Proximity**:
  $$\text{Sim}_{\text{Semantic}}(\mathbf{e}_{\text{resume}}, \mathbf{e}_{\text{job}}) = \frac{\mathbf{e}_{\text{resume}} \cdot \mathbf{e}_{\text{job}}}{\|\mathbf{e}_{\text{resume}}\|_2 \|\mathbf{e}_{\text{job}}\|_2}$$
- **Lifecycle & Execution**: The embedding model is managed as a thread-safe singleton loaded lazily on the first matching request and reused across subsequent evaluations to minimize memory overhead. Similarity scores are normalized to the [0.0, 1.0] range.

### 4. Structured Skill Gap Analysis
- Evaluates extracted candidate skills against the job requisition's partitioned requirements:
  - Required (mandatory) technical skills: $R$
  - Preferred (optional) technical skills: $P$
- Given candidate skill set $C$, calculates:
  - **Matched Required**: $M_R = C \cap R$
  - **Missing Required**: $G_R = R \setminus C$
  - **Matched Preferred**: $M_P = C \cap P$
  - **Missing Preferred**: $G_P = P \setminus C$
- Computes structured qualification coverage:
  $$\text{Score}_{\text{Skill}} = w_R \cdot \frac{|M_R|}{\max(|R|, 1)} + w_P \cdot \frac{|M_P|}{\max(|P|, 1)}$$
  (with weights configured to prioritize mandatory qualifications over optional preferred skills).

### 5. Hybrid Scoring Formulation
The overall match score $S$ is computed as a weighted linear combination:

$$S = (w_{\text{semantic}} \times \text{Sim}_{\text{Semantic}}) + (w_{\text{skill}} \times \text{Score}_{\text{Skill}}) + (w_{\text{tfidf}} \times \text{Sim}_{\text{TF-IDF}})$$

Currently configured experimental baseline weights:
- $w_{\text{semantic}} = 0.45$ (45% Semantic Similarity)
- $w_{\text{skill}} = 0.30$ (30% Skill Overlap Score)
- $w_{\text{tfidf}} = 0.25$ (25% TF-IDF Lexical Similarity)

> **Important Research Note on Weights**: The configured weights (0.45, 0.30, 0.25) are initial experimental baseline parameters established during system specification. They are **not** empirically optimized, validated on an annotated benchmark, or proven to be mathematically optimal. Similarity scores are normalized to the [0.0, 1.0] range.

### 6. Matching Orchestration & Relational Persistence
- The `MatchingOrchestrationService` unifies the three analytical components.
- Calculated scores, matched skill lists, and missing skill gap lists are persisted idempotently in PostgreSQL (`matching_results` table) keyed by `(candidate_id, job_id)`.

---

## Implemented Phases

### Phase 1 — Project Foundation
- React 18 + TypeScript frontend built with Vite, Tailwind CSS, and Lucide icons.
- FastAPI backend with modular routing, automated CORS configuration, and interactive OpenAPI / Swagger documentation.
- PostgreSQL 15 relational database with SQLAlchemy ORM and structured data models.
- Alembic database migration management for reproducible schema versioning.
- Multi-container Docker Compose environment managing `postgres`, `backend`, and `frontend` services.
- System health monitoring endpoint (`/api/v1/health`) and Pydantic validation schemas.

### Phase 2 — Resume Ingestion and Structured Extraction
- Multi-format resume parsing: PDF (`.pdf`) via PyMuPDF and Word documents (`.docx`) via python-docx.
- Text normalization, sanitization, and section segmentation pipeline.
- Structured candidate information extraction (Name, Email, Phone, Skills, Education, Experience, and Certifications).
- Independent single-file and bulk resume ingestion with per-file error isolation.
- Candidate database persistence and relational technical skill cataloging.

### Phase 3 — Traditional NLP Baseline (TF-IDF)
- Job description and resume text preprocessing (lowercasing, punctuation stripping, tokenization).
- Sublinear TF-IDF vectorization with n-gram support (unigrams and bigrams).
- Cosine similarity computation between resume text and job description specifications.
- Similarity scores are normalized to the [0.0, 1.0] range.

### Phase 4 — Semantic Matching (Sentence Transformers)
- 384-dimensional dense semantic vector embeddings using `all-MiniLM-L6-v2`.
- Thread-safe lazy singleton model initialization with memory reuse across requests.
- Deterministic CPU inference without generative language model hallucination risks.
- Cosine similarity computation between high-dimensional text embeddings, with similarity scores normalized to the [0.0, 1.0] range.

### Phase 5 — Skill Gap Analysis & Hybrid Matching
- Structured skill taxonomy evaluation categorizing required and preferred job skills.
- Granular overlap analysis identifying matched qualifications, missing required skills, and missing preferred skills.
- Composite hybrid matching model combining configured experimental baseline weights (45% Semantic, 30% Skill Overlap, 25% TF-IDF).
- Idempotent matching result persistence in the `matching_results` database table.

### Phase 6 — Matching APIs, Candidate Workspace & Professional UI Integration
- **Recruiter Candidate Ranking (`GET /api/v1/ranking/job/{job_id}`)**:
  - Dynamic candidate ranking for any selected job requisition.
  - Candidate table ordered by composite hybrid score descending.
  - Multi-tier metric inspection (Hybrid, Semantic, Skill Overlap, TF-IDF).
  - Visual matched vs. missing skill breakdown chips.
- **Candidate-Job Comparison & Skill Gap Analysis (`GET /api/v1/analysis/skill-gap/{candidate_id}/{job_id}`)**:
  - Direct side-by-side match breakdown between candidate profiles and job roles.
  - Four-quadrant skill alignment table (Matched Required, Missing Required, Matched Preferred, Missing Preferred).
- **Matching Orchestration (`MatchingOrchestrationService`)**:
  - Unified pipeline coordinating TF-IDF, Semantic, and Skill Gap services.
  - Idempotent database persistence in the `matching_results` table.
- **Candidate & Job Management**:
  - Requisition creation, skill requirement specification, and permanent job deletion.
  - Candidate listing with duplicate detection indicators and representative profile filtering.
- **Candidate Workspace Integration**:
  - Candidate dashboard, profile inspection, resume re-upload with duplicate handling, and self-service skill gap evaluation.
- **Professional Recruitment Interface**:
  - Clean, human-developed recruitment management aesthetic replacing generic AI-style landing templates.
  - Standardized design system: warm canvas (`#F7F7F5`), card surfaces (`#FFFFFF`), dark charcoal headings (`#252A31`), muted slate body text (`#68717D`), executive steel blue accent (`#315B83`), and subtle borders (`#E3E5E8`).
  - Standardized 6px and 8px border radiuses, eliminating excessive bubble pills, neon gradients, and decorative glassmorphism.

---

## Automated Software Testing vs. Empirical Model Evaluation

### Software Verification
- **90 backend automated tests passed in the latest verified run, with 6 deprecation/future warnings.**
- Tests execute with complete isolation from development and demo database records via transaction rollbacks and isolated test environments.
- Warnings reported during test runs stem from upstream library API deprecation notices (Pydantic v2 `Config` class declarations, PyMuPDF `fitz` namespace alias, and Starlette HTTP status constant deprecation).
- The automated test suite validates:
  - Ingestion pipeline stability and corrupt-file handling.
  - Regular expression patterns and skill vocabulary lookups.
  - Vectorizer initialization, embedding dimensions (384-d), and similarity bounds $[0.0, 1.0]$.
  - Route status codes, request validation, and database CRUD operations.

### Distinction from Empirical Model Evaluation
- **Software testing confirms pipeline reliability, schema validity, and numerical boundedness; it does not establish model accuracy, ranking effectiveness, or hiring validity.**
- High test suite pass rates indicate that code executes without runtime exceptions, but do not imply that candidate rankings match real-world recruiter preferences or that bias has been eliminated.

---

## Limitations & Future Research Directions

### Current Limitations
1. **Evaluation / Demonstration Mode**: The candidate workspace operates in an open demonstration mode without user authentication, allowing reviewers to select and inspect sample candidate profiles directly.
2. **Algorithmic Decision-Support Role**: Matching scores and skill gap analyses are algorithmic decision-support indicators intended to aid human recruiters during preliminary applicant screening; they do not constitute autonomous or final hiring determinations.
3. **Absence of Annotated Benchmark Validation**: The system has not yet been benchmarked against a publicly available or proprietary human-annotated resume-job dataset.

### Future Research Directions
Formal empirical validation against labelled candidate-job relevance data remains designated for future work:
- **Corpus Curation**: Assembly and ethical anonymization of technical candidate resumes paired with annotated recruiter relevance judgements.
- **Weight Optimization**: Tuning hybrid weights ($w_{\text{semantic}}, w_{\text{skill}}, w_{\text{tfidf}}$) through systematic grid search, Bayesian optimization, or supervised Learning-to-Rank (LTR) algorithms (e.g., LambdaMART).
- **Empirical Evaluation Metrics**:
  - **Precision, Recall, and F1-Score**: Binary classification of applicant relevance against a minimum score threshold.
  - **Precision@K (P@K)**: Proportion of relevant candidates appearing in the top $K$ ranked results.
  - **Recall@K (R@K)**: Proportion of all relevant candidates retrieved within the top $K$ ranked results.
  - **Mean Reciprocal Rank (MRR)**: Evaluates the reciprocal rank of the first relevant candidate.
  - **Normalized Discounted Cumulative Gain (NDCG@K)**: Evaluates ranking quality factoring in graded candidate relevance.
- **Fairness & Bias Audits**: Evaluating disparate impact across demographic proxies and auditing text embeddings for latent occupational biases.

---

## Model Attribution & Academic Citations

The semantic matching pipeline utilizes third-party pretrained models developed by external researchers:
- **`all-MiniLM-L6-v2`**: A 6-layer, 384-dimensional pretrained sentence embedding model fine-tuned on over 1 billion sentence pairs using self-attention distillation. The model is distributed via the open-source [Sentence-Transformers](https://sbert.net/) library.
- **Attribution**: The authors of this project did not train, modify, or invent the underlying transformer architecture or pretrained weights; they integrated the pretrained model into the multi-stage matching pipeline.

### Relevant Academic Citations

```bibtex
@inproceedings{reimers-2019-sentence-bert,
  title     = {Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks},
  author    = {Reimers, Nils and Gurevych, Iryna},
  booktitle = {Proceedings of the 2019 Conference on Empirical Methods in Natural Language Processing (EMNLP)},
  month     = nov,
  year      = {2019},
  publisher = {Association for Computational Linguistics},
  url       = {https://arxiv.org/abs/1908.10084}
}

@inproceedings{wang-2020-minilm,
  title     = {MiniLM: Deep Self-Attention Distillation for Task-Agnostic Compression of Pre-Trained Transformers},
  author    = {Wang, Wenhui and Wei, Furu and Dong, Li and Bao, Hangbo and Yang, Nan and Zhou, Ming},
  booktitle = {Advances in Neural Information Processing Systems (NeurIPS 2020)},
  volume    = {33},
  pages     = {5776--5788},
  year      = {2020},
  url       = {https://proceedings.neurips.cc/paper/2020/file/3f5ee243547dee91fbd053c1c4a845aa-Paper.pdf}
}
```

---

## Development Setup

### Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/)
- (Optional for non-containerized local development: Python 3.11+ and Node.js 18+)

### 1. Environment Configuration

Copy the example environment configuration file to create your local `.env`:

```bash
cp .env.example .env
```

The configuration includes standard development defaults:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `POSTGRES_USER` | PostgreSQL superuser username | `postgres` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `postgres_password` |
| `POSTGRES_DB` | Primary application database name | `resume_screening_db` |
| `POSTGRES_PORT` | PostgreSQL exposed host port | `5432` |
| `BACKEND_PORT` | FastAPI backend exposed host port | `8000` |
| `ENVIRONMENT` | Runtime environment mode | `development` |
| `VITE_API_BASE_URL` | Frontend API base URL | `http://localhost:8000/api/v1` |

*(Do not commit or expose production passwords or secret credentials in `.env` files).*

### 2. Building and Starting Services

Build container images and launch the services in detached mode:

```bash
docker compose up --build -d
```

### 3. Verifying Container Status

Check the health and running state of all containers:

```bash
docker compose ps
```

Expected containers:
- `resume_screening_postgres`: PostgreSQL 15 database (healthy)
- `resume_screening_backend`: FastAPI backend on port `8000`
- `resume_screening_frontend`: Nginx serving React build on port `3000`

### 4. Service Access Points

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:3000` | Web UI for recruiter and candidate workflows |
| **Backend API Documentation** | `http://localhost:8000/api/v1/docs` | Interactive Swagger / OpenAPI documentation |
| **API Health Check** | `http://localhost:8000/api/v1/health` | Service and database connectivity status |

### 5. Running Automated Backend Tests

Execute the full pytest test suite inside the running backend container:

```bash
docker compose exec backend pytest
```

Alternatively:

```bash
docker exec -it resume_screening_backend pytest
```

### 6. Viewing Service Logs

Monitor live container logs for debugging:

```bash
# View backend logs
docker compose logs -f backend

# View frontend logs
docker compose logs -f frontend

# View database logs
docker compose logs -f postgres
```

### 7. Stopping Services

To stop the running application without deleting persisted database data:

```bash
docker compose down
```

> **Important**: Do not pass the `-v` or `--volumes` flag when stopping containers if you want to preserve the `postgres_data` volume and stored candidate/job records.
