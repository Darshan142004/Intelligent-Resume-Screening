# Intelligent Resume Screening and Job Recommendation System Using NLP

An MCA Minor Project focused on building an intelligent system for resume ingestion, structured candidate information extraction, and, in later phases, NLP-based resume-job matching and job recommendation.

## Project Status

### Currently Implemented

#### Phase 1 — Project Foundation
- React + TypeScript frontend
- FastAPI backend
- PostgreSQL database
- SQLAlchemy ORM
- Alembic database migrations
- Docker Compose environment
- Recruiter and Candidate UI structure
- Initial database schema
- Health check and Swagger API documentation

#### Phase 2 — Resume Ingestion and Structured Extraction
- PDF resume parsing
- DOCX resume parsing
- Resume text extraction
- Basic text preprocessing
- Candidate information extraction
- Name extraction
- Email extraction
- Phone extraction
- Education extraction
- Experience extraction
- Project extraction
- Certification extraction
- Language extraction
- Initial technical skill extraction and normalization
- PostgreSQL candidate storage
- Single resume upload
- Bulk resume upload
- Independent processing of files in a batch
- Handling of invalid/corrupted files without stopping the complete batch
- Candidate profile display
- Automated tests for parser, extractor, and resume APIs

Current supported resume formats:

- PDF (`.pdf`)
- Microsoft Word DOCX (`.docx`)

Legacy `.doc` files are intentionally not supported.

## Upcoming Development

The following functionality is planned for subsequent development phases and is NOT yet implemented:

### Phase 3 — Traditional NLP Baseline
- Job description processing
- TF-IDF vectorization
- Cosine similarity
- Resume-job matching score
- Initial candidate ranking

### Phase 4 — Semantic Matching
- Sentence Transformer embeddings
- Semantic similarity between resumes and job descriptions
- Comparison against the TF-IDF baseline

### Phase 5 — Hybrid Matching
- Combination of traditional and semantic matching
- Skill-overlap scoring
- Experimental comparison of matching approaches

### Later Phases
- Bulk candidate ranking
- Job recommendations
- Candidate skill-gap analysis
- Explainable matching results
- Local LLM integration using Ollama
- Evaluation and research experiments
- Final UI refinement
- Documentation and research paper preparation

The planned components above should not be considered implemented until their corresponding development phase is completed and verified.

## System Architecture

### Current Architecture

```text
                    React + TypeScript
                           |
                           v
                     FastAPI Backend
                           |
             +-------------+-------------+
             |                           |
             v                           v
      Resume Processing             PostgreSQL
             |
       +-----+-----+
       |           |
       v           v
      PDF        DOCX
       |           |
       +-----+-----+
             |
             v
      Text Extraction
             |
             v
   Structured Information
        Extraction
             |
             v
       Candidate Data
```
