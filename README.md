# Intelligent Resume Screening and Job Matching System Using NLP

An MCA Minor Project implementing an automated pipeline for resume ingestion, structured candidate information extraction, deterministic NLP-based candidate-to-selected-job matching, recruiter candidate ranking, and candidate skill-gap analysis.

---

## Key Design Principles

- **Deterministic NLP Matching Engine**: Powered by deterministic natural language processing techniques combining TF-IDF lexical matching, structured skill extraction, and Sentence Transformers (`all-MiniLM-L6-v2`) dense semantic vector embeddings.
- **CPU-Only Inference**: Optimized for lightweight, deterministic CPU inference without requiring dedicated GPU infrastructure or local generative language model runtimes (no Generative LLM integration and no Ollama).
- **Candidate-to-Selected-Job Matching**: Directly assesses and scores candidate suitability against specific, user-selected job requisitions rather than unconstrained or unrestricted job recommendations.
- **Offline Inference Readiness**: The `all-MiniLM-L6-v2` Sentence Transformer model requires an initial download if it is not cached locally. Once cached in the environment, inference runs locally without requiring external network connectivity.
- **Isolated Test Architecture**: Automated testing executes against dedicated test databases and transactional rollbacks to protect development and demonstration records.

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
- Deterministic CPU inference without generative hallucination risks.
- Cosine similarity computation between high-dimensional text embeddings, with similarity scores normalized to the [0.0, 1.0] range.

### Phase 5 — Skill Gap Analysis & Hybrid Matching
- Structured skill taxonomy evaluation categorizing required and preferred job skills.
- Granular overlap analysis identifying matched qualifications, missing required skills, and missing preferred skills.
- Composite hybrid matching model combining three scoring dimensions:
  - **Semantic Similarity: 45%** (`all-MiniLM-L6-v2` dense conceptual embeddings)
  - **Skill Overlap: 30%** (Weighted required and preferred technical skill coverage)
  - **TF-IDF Similarity: 25%** (Lexical n-gram keyword extraction baseline)
- Configured experimental baseline weights (0.45, 0.30, 0.25) derived from project design specifications, serving as initial configurable parameters rather than empirically optimized weights.
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

## Hybrid Scoring Methodology

The system computes an overall match score using a linear combination of three complementary NLP dimensions:

$$\text{Composite Score} = (0.45 \times \text{Semantic}) + (0.30 \times \text{Skill Overlap}) + (0.25 \times \text{TF-IDF})$$

- **Semantic Similarity (45%)**: Measures contextual and conceptual proximity between resume text and job description using 384-dimensional dense vectors generated by `all-MiniLM-L6-v2`.
- **Skill Overlap Score (30%)**: Evaluates explicit technical qualification alignment, heavily weighting mandatory required skills while factoring in preferred skills.
- **TF-IDF Lexical Similarity (25%)**: Serves as a deterministic keyword baseline, capturing exact and n-gram domain terminology frequency.

> **Note on Weights**: The weights (45% Semantic, 30% Skill Overlap, 25% TF-IDF) represent configured experimental baseline values. They are not empirically optimized weights and can be adjusted as empirical recruitment benchmarks become available. Similarity scores are normalized to the [0.0, 1.0] range.

---

## Automated Testing & Quality Assurance

The backend test suite verifies API contracts, extraction accuracy, database transactions, and deterministic NLP calculations:

- **90 automated backend tests passed in the latest verified run.**
- Tests execute with complete isolation from development and demo database records via transaction rollbacks and isolated test environments.
- Six non-blocking warnings were reported during test runs, primarily concerning upstream library API deprecation notices (Pydantic v2 `Config` class declarations, PyMuPDF `fitz` namespace alias, and Starlette HTTP status constant deprecation).
- Automated test passes confirm software stability, deterministic pipeline behavior, and schema conformance; they do not imply 100% real-world recruitment matching accuracy.

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

---

## Project Limitations & Evaluation Considerations

- **Evaluation / Demonstration Mode**: The candidate workspace operates as an evaluation and demonstration environment without an authentication layer. Users can select and inspect sample candidate profiles directly for verification and system evaluation.
- **Decision-Support Indicator**: Hybrid matching scores and skill gap analyses are algorithmic decision-support metrics designed to assist human recruiters in triaging applicant pools; they do not constitute final or autonomous hiring determinations.
- **Empirical Validation Needs**: Real-world recruitment accuracy requires formal validation against representative, human-annotated candidate-job datasets using standard information retrieval and ranking metrics (e.g., Precision, Recall, F1-Score, Precision@K, Recall@K, and NDCG@K).
