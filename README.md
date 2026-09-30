# Intelligent Resume Screening and Job Recommendation System Using NLP

An end-to-end web application built for MCA Minor Project. The system screens resumes, extracts candidate skills and profiles, and ranks candidates or recommends jobs using a hybrid matching pipeline (TF-IDF baseline, Sentence Transformers semantic embeddings, skill overlap scoring, and local Ollama LLM explanations).

---

## 🏗️ System Architecture

```
Intelligent-Resume-Screening/
├── docker-compose.yml          # Docker Compose orchestration for Frontend, Backend & PostgreSQL
├── .env.example                # Template environment configuration
├── .env                        # Local development environment configuration
├── README.md                   # Project documentation & setup instructions
├── backend/                    # FastAPI Backend Application
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & CORS setup
│   │   ├── core/config.py      # Pydantic Settings & environment loader
│   │   ├── database/           # SQLAlchemy DB connection & session provider
│   │   ├── models/             # SQLAlchemy ORM models (Users, Jobs, Skills, Candidates, Matching, etc.)
│   │   ├── schemas/            # Pydantic validation schemas
│   │   ├── routes/             # API routers (health, jobs, resumes, candidates, ranking, etc.)
│   │   ├── services/           # Business logic stubs (Resume parser, Skill extractor, TF-IDF, Semantic, Hybrid, LLM)
│   │   └── utils/
│   └── alembic/                # Database migrations
└── frontend/                   # React + TypeScript + Vite + Tailwind CSS Frontend Application
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.tsx             # React Router navigation setup
        ├── components/         # Navbar, Footer, RecruiterLayout, CandidateLayout
        ├── pages/              # Home, Recruiter views, Candidate views
        └── services/api.ts     # Axios API client
```

---

## 🗄️ Database Entity Schema (PostgreSQL)

- **USERS**: `id`, `name`, `email`, `role`
- **JOBS**: `id`, `title`, `company`, `description`, `experience_required`, `education_required`, `domain`, `created_at`
- **SKILLS**: `id`, `name`, `category`
- **JOB_REQUIRED_SKILLS**: `job_id`, `skill_id`
- **JOB_PREFERRED_SKILLS**: `job_id`, `skill_id`
- **CANDIDATES**: `id`, `name`, `email`, `phone`, `education`, `experience`, `resume_path`, `created_at`
- **CANDIDATE_SKILLS**: `candidate_id`, `skill_id`
- **MATCHING_RESULTS**: `id`, `candidate_id`, `job_id`, `tfidf_score`, `semantic_score`, `skill_score`, `hybrid_score`, `created_at`
- **RECOMMENDATIONS**: `id`, `candidate_id`, `job_id`, `score`, `reason`
- **SKILL_GAPS**: `id`, `candidate_id`, `job_id`, `skill`, `gap_type`

---

## 🚀 How to Run

### Option 1: Docker Compose (Recommended)

1. Ensure Docker Desktop is running.
2. Clone or navigate to the project directory:
   ```bash
   cd Intelligent-Resume-Screening
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Start all services using Docker Compose:
   ```bash
   docker-compose up --build
   ```
5. Access the applications:
   - **Frontend**: `http://localhost:3000`
   - **Backend API Docs**: `http://localhost:8000/api/v1/docs`
   - **Backend Health Check**: `http://localhost:8000/api/v1/health`

---

### Option 2: Local Development (Manual Setup)

#### 1. Start PostgreSQL Container
```bash
docker run -d --name resume_screening_postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres_password \
  -e POSTGRES_DB=resume_screening_db \
  -p 5432:5432 \
  postgres:15-alpine
```

#### 2. Setup & Start Backend (FastAPI)
```bash
cd backend
python -m venv venv
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

#### 3. Setup & Start Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🧪 Verification Steps (Phase 1)

1. Verify PostgreSQL is listening on port `5432`.
2. Run Alembic migrations (`alembic upgrade head`).
3. Call `GET http://localhost:8000/api/v1/health` -> verify status is `"online"` and database is `"connected"`.
4. Open React web application at `http://localhost:3000` -> verify Home page renders with Recruiter & Candidate sections.
5. Click **[Enter Recruiter Section]** -> verify navigation to `/recruiter` and subroutes (`/recruiter/jobs`, `/recruiter/upload`, etc.).
6. Click **[Enter Candidate Section]** -> verify navigation to `/candidate` and subroutes (`/candidate/profile`, `/candidate/upload`, etc.).
