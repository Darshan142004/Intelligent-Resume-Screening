import os
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.database.database import Base, get_db
import app.database.database as app_db
from app.main import app


def get_test_db_url() -> str:
    """
    Get the isolated test database URL.
    Ensures tests never connect to the live development database.
    """
    test_url = os.getenv("TEST_DATABASE_URL")
    if test_url:
        return test_url

    base_url = os.getenv("DATABASE_URL", settings.DATABASE_URL)
    if "resume_screening_db" in base_url:
        return base_url.replace("resume_screening_db", "resume_screening_test_db")

    parts = base_url.rsplit("/", 1)
    return f"{parts[0]}/resume_screening_test_db"


TEST_DB_URL = get_test_db_url()

# Connect to maintenance database and ensure resume_screening_test_db exists if using PostgreSQL
try:
    if "postgresql" in TEST_DB_URL:
        maintenance_url = TEST_DB_URL.rsplit("/", 1)[0] + "/postgres"
        maintenance_engine = create_engine(maintenance_url, isolation_level="AUTOCOMMIT")
        with maintenance_engine.connect() as conn:
            check_db = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = 'resume_screening_test_db'")
            ).scalar()
            if not check_db:
                conn.execute(text("CREATE DATABASE resume_screening_test_db"))
        maintenance_engine.dispose()
except Exception as e:
    # If connecting to postgres failed, fall back to SQLite for isolated unit testing
    print(f"Warning: Could not connect to PostgreSQL test database ({e}). Falling back to SQLite.")
    TEST_DB_URL = "sqlite:///./test_isolated.db"

test_engine = create_engine(
    TEST_DB_URL,
    pool_pre_ping=True,
    echo=False
)

TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch global database references to use the test engine/session
app_db.engine = test_engine
app_db.SessionLocal = TestSessionLocal


def override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Override FastAPI dependency globally for all tests
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Session-scoped fixture to create a clean test database schema
    in the isolated test database before any tests run.
    """
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    # Optionally drop or leave test database for post-run inspection


@pytest.fixture
def db_session():
    """
    Provides a direct SQLAlchemy session connected to the isolated test database.
    """
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_or_create_skill(db, name: str, category: str = "technical"):
    """
    Helper function to query an existing Skill or create a new one,
    preventing unique constraint collisions during test execution.
    """
    from app.models.skill import Skill
    skill = db.query(Skill).filter(Skill.name == name).first()
    if not skill:
        skill = Skill(name=name, category=category)
        db.add(skill)
        db.flush()
    return skill


