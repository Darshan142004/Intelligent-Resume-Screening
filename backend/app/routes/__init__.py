from app.routes.health import router as health_router
from app.routes.jobs import router as jobs_router
from app.routes.resumes import router as resumes_router
from app.routes.candidates import router as candidates_router
from app.routes.ranking import router as ranking_router
from app.routes.recommendations import router as recommendations_router
from app.routes.analysis import router as analysis_router

__all__ = [
    "health_router",
    "jobs_router",
    "resumes_router",
    "candidates_router",
    "ranking_router",
    "recommendations_router",
    "analysis_router"
]
