from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy import text
from app.database import engine, Base, get_db
from app.models import Student
from app.routers import students, ai

BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Student Information System",
    description=(
        "Student Database CRUD Application with SQLite "
        "and optional Ollama local AI extension for natural-language student queries."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)
@app.get("/api/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {
            "database_engine": engine.dialect.name,
            "connection_ok": True
        }
    except Exception:
        return {
            "database_engine": engine.dialect.name,
            "connection_ok": False
        }

# Enable CORS for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(students.router)
app.include_router(ai.router)


@app.get("/api/stats", tags=["System"])
def get_stats(db: Session = Depends(get_db)):
    """Summary statistics for the dashboard UI."""
    total_students = db.query(Student).count()
    courses = (
        db.query(Student.course, func.count(Student.id))
        .group_by(Student.course)
        .all()
    )
    course_breakdown = {c or "Undeclared": count for c, count in courses}
    return {
        "total_students": total_students,
        "courses_count": len([c for c in course_breakdown if c != "Undeclared"]),
        "course_breakdown": course_breakdown,
    }


# Static files mount
static_dir = BASE_DIR / "static"
if static_dir.exists():
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/", include_in_schema=False)
def serve_dashboard():
    """Serve the interactive modern dashboard UI."""
    index_file = BASE_DIR / "static" / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"message": "Students Database CRUD API. Visit /docs for Swagger documentation."}
