# Intelligent Resume Screening and Job Matching System Using NLP

An MCA Minor Project focused on building an intelligent system for resume ingestion, structured candidate information extraction, deterministic NLP-based resume-job matching, recruiter candidate ranking, and candidate skill-gap analysis.

## Key Design Principles
- **NLP-Based Matching Engine**: Powered by deterministic NLP models (TF-IDF keyword extraction and Sentence Transformers `all-MiniLM-L6-v2` dense embeddings).
- **CPU-Only Inference**: Optimized for lightweight, deterministic CPU inference without requiring heavy GPU clusters or local LLM runtimes (no Generative LLMs, no Ollama).
- **Job Matching & Candidate Ranking**: Directly scores candidate suitability against specific job requisitions rather than unconstrained job recommendations.
- **Isolated Test Architecture**: Automated testing runs against isolated test databases or transaction rollbacks to protect development and demonstration data.


---

## Project Status

### Implemented Phases

#### Phase 1 — Project Foundation
- React + TypeScript frontend with Tailwind CSS and Lucide icons
- FastAPI backend with modular routing and OpenAPI / Swagger documentation
- PostgreSQL relational database with SQLAlchemy ORM
- Alembic database migration management
- Multi-container Docker Compose environment (frontend, backend, postgres)
- Health check endpoints and comprehensive system schemas

#### Phase 2 — Resume Ingestion and Structured Extraction
- Multi-format resume parsing: PDF (`.pdf`) via PyMuPDF and Word (`.docx`) via python-docx
- Robust text extraction and normalization pipeline
- Structured candidate information extraction (Name, Email, Phone, Skills, Education, Experience, Certifications)
- Single and bulk resume ingestion with independent per-file failure handling
- Candidate database persistence and skill cataloging

#### Phase 3 — Traditional NLP Baseline (TF-IDF)
- Job description and resume text preprocessing
- Sublinear TF-IDF vectorization with n-gram support (unigrams & bigrams)
- Cosine similarity calculation between resume text and job specifications
- Score normalization bound strictly between `0.0` and `1.0`

#### Phase 4 — Semantic Matching (Sentence Transformers)
- Dense semantic vector embeddings using `sentence-transformers/all-MiniLM-L6-v2`
- Lazy singleton model initialization with memory reuse across requests
- Deterministic CPU inference without external network calls
- Cosine similarity computation between high-dimensional text embeddings

#### Phase 5 — Skill Gap Analysis & Hybrid Matching
- Structured skill taxonomy evaluation separating required and preferred job skills
- Detailed overlap scoring: matched required/preferred skills and missing skill gaps
- Composite hybrid matching model combining:
  - **45% Semantic Similarity** (`all-MiniLM-L6-v2` dense embeddings)
  - **30% Skill Overlap Score** (Required & Preferred skill alignment)
  - **25% TF-IDF Baseline Similarity** (Lexical keyword extraction)
- Idempotent matching result persistence in `matching_results` table

#### Phase 6 — Matching APIs & Frontend Integration
- **Recruiter Candidate Ranking (`GET /api/v1/ranking/job/{job_id}`)**:
  - Live ranking of candidates for any selected job
  - Sortable candidate list by hybrid score descending
  - Multi-tier metric inspection (Hybrid, Semantic, Skill Overlap, TF-IDF)
  - Matched vs. missing required and preferred skill badges
- **Candidate-Job Comparison & Skill Gap Analysis (`GET /api/v1/analysis/...`)**:
  - Direct side-by-side match breakdown between candidate profiles and job roles
  - Granular breakdown of technical gaps and qualification readiness
- **Automated Test Suite**:
  - 74 comprehensive backend tests passing (100% pass rate)
  - Full isolation of development demo records from test execution

---

## System Architecture

```text
               +------------------------------------+
               |      React + TypeScript UI         |
               | (Recruiter Ranking & Candidate UI) |
               +-----------------+------------------+
                                 | HTTP / REST
                                 v
               +------------------------------------+
               |          FastAPI Backend           |
               +-----------------+------------------+
                                 |
         +-----------------------+-----------------------+
         |                                               |
         v                                               v
+------------------+                           +-------------------+
| Resume Parsing & |                           | PostgreSQL 15 DB  |
| Text Extraction  |                           | (Candidates, Jobs,|
| (PyMuPDF, docx)  |                           |  Skills, Matches) |
+--------+---------+                           +---------+---------+
         |                                               |
         +-----------------------+-----------------------+
                                 |
                                 v
             +---------------------------------------+
             |       Deterministic NLP Engine        |
             +-------------------+-------------------+
                                 |
         +-----------------------+-----------------------+
         |                       |                       |
         v                       v                       v
  +--------------+      +------------------+    +-----------------+
  |    TF-IDF    |      | Sentence Transf. |    |    Skill Gap    |
  |  Vectorizer  |      | all-MiniLM-L6-v2 |    |    Analyzer     |
  +-------+------+      +--------+---------+    +--------+--------+
          |                      |                       |
          +----------------------+-----------------------+
                                 |
                                 v
                      +---------------------+
                      |   Hybrid Matcher    |
                      |  Composite Scoring  |
                      +----------+----------+
                                 |
                                 v
                      +---------------------+
                      |  Ranked Candidates  |
                      | & Skill Gap Report  |
                      +---------------------+
```

---

## Development Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Running with Docker Compose
```bash
# Build and launch all services
docker compose up -d

# Verify containers are healthy
docker ps
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/api/v1/docs`
- Health check: `http://localhost:8000/api/v1/health`
