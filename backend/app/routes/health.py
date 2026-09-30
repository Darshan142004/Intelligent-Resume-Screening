from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.database import get_db

router = APIRouter(prefix="/health", tags=["Health Check"])


@router.get("")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify backend service status and PostgreSQL connectivity.
    """
    try:
        # Test database connection with a simple query
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return {
        "status": "online",
        "service": "Intelligent Resume Screening API",
        "database": db_status
    }
