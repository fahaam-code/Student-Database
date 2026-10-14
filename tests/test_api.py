import pytest
from datetime import date
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import Student

# Use in-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Add fixture students
    s1 = Student(
        student_id="TEST001",
        name="Alice Johnson",
        date_of_birth=date(2004, 3, 15),
        email="alice@example.com",
        phone="1234567890",
        course="Computer Science",
        address="101 Tech Lane",
        enrollment_date=date(2023, 9, 1),
    )
    s2 = Student(
        student_id="TEST002",
        name="Bob Smith",
        date_of_birth=date(2006, 7, 20),
        email="bob@example.com",
        phone="9876543210",
        course="Data Science",
        address="202 Data Drive",
        enrollment_date=date(2024, 9, 1),
    )
    db.add_all([s1, s2])
    db.commit()
    yield
    Base.metadata.drop_all(bind=engine)


def test_create_student_success():
    payload = {
        "student_id": "TEST003",
        "name": "Charlie Brown",
        "date_of_birth": "2005-02-14",
        "email": "charlie@example.com",
        "phone": "+1 555-0199",
        "course": "Mechanical Engineering",
        "address": "303 Maple St",
    }
    response = client.post("/students", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["student_id"] == "TEST003"
    assert data["name"] == "Charlie Brown"
    assert data["course"] == "Mechanical Engineering"


def test_create_student_missing_contact_info():
    payload = {
        "name": "Ghost Student",
        "date_of_birth": "2005-01-01",
        # missing email AND phone
    }
    response = client.post("/students", json=payload)
    assert response.status_code == 422  # Pydantic validation error


def test_create_student_duplicate_id():
    payload = {
        "student_id": "TEST001",  # Already exists
        "name": "Duplicate Student",
        "date_of_birth": "2003-05-10",
        "email": "dup@example.com",
    }
    response = client.post("/students", json=payload)
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_list_students_and_filtering():
    # List all
    res = client.get("/students")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2

    # Filter by course
    res_cs = client.get("/students?course=Computer")
    assert res_cs.status_code == 200
    assert res_cs.json()["total"] == 1
    assert res_cs.json()["students"][0]["student_id"] == "TEST001"

    # Filter born after 2005-01-01
    res_born = client.get("/students?born_after=2005-01-01")
    assert res_born.status_code == 200
    assert res_born.json()["total"] == 1
    assert res_born.json()["students"][0]["student_id"] == "TEST002"


def test_get_student_by_id():
    # Success
    res = client.get("/students/TEST001")
    assert res.status_code == 200
    assert res.json()["name"] == "Alice Johnson"

    # 404
    res_404 = client.get("/students/NONEXISTENT")
    assert res_404.status_code == 404


def test_update_student_put():
    payload = {
        "name": "Alice J. Watson",
        "date_of_birth": "2004-03-15",
        "email": "alice.watson@example.com",
        "phone": "1234567890",
        "course": "Artificial Intelligence",
        "address": "101 Tech Lane",
    }
    res = client.put("/students/TEST001", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Alice J. Watson"
    assert data["course"] == "Artificial Intelligence"


def test_patch_student():
    payload = {"course": "Cybersecurity"}
    res = client.patch("/students/TEST002", json=payload)
    assert res.status_code == 200
    assert res.json()["course"] == "Cybersecurity"
    # Unchanged fields should remain intact
    assert res.json()["name"] == "Bob Smith"


def test_delete_student():
    res = client.delete("/students/TEST001")
    assert res.status_code == 200

    # Ensure student is gone
    res_check = client.get("/students/TEST001")
    assert res_check.status_code == 404


def test_ai_query_endpoint():
    res = client.post("/ai/query", json={"question": "How many students are there?"})
    assert res.status_code == 200
    data = res.json()
    assert "answer" in data
    assert data["records_referenced"] >= 0

    res2 = client.post("/ai/query", json={"question": "List students born after 2005"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert "Bob Smith" in data2["answer"]
