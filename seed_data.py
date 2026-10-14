"""
Sample database seeder for Student CRUD Application.
Populates realistic mock students to demonstrate CRUD and AI queries (e.g., born after 2005).
"""
from datetime import date
from app.database import SessionLocal, Base, engine
from app.models import Student

SAMPLE_STUDENTS = [
    {
        "student_id": "STU1001",
        "name": "Aarav Sharma",
        "date_of_birth": date(2004, 5, 14),
        "email": "aarav.sharma@example.edu",
        "phone": "+91 98765 43210",
        "course": "Computer Science",
        "address": "42 MG Road, Bengaluru, Karnataka",
        "enrollment_date": date(2023, 8, 1),
    },
    {
        "student_id": "STU1002",
        "name": "Diya Patel",
        "date_of_birth": date(2006, 11, 22),  # Born after 2005
        "email": "diya.patel@example.edu",
        "phone": "+91 98123 45678",
        "course": "Data Science",
        "address": "15 Park Street, Ahmedabad, Gujarat",
        "enrollment_date": date(2024, 7, 15),
    },
    {
        "student_id": "STU1003",
        "name": "Rohan Verma",
        "date_of_birth": date(2003, 3, 10),
        "email": "rohan.verma@example.edu",
        "phone": "+91 97234 56789",
        "course": "Mechanical Engineering",
        "address": "88 Civil Lines, Delhi",
        "enrollment_date": date(2022, 8, 10),
    },
    {
        "student_id": "STU1004",
        "name": "Ananya Iyer",
        "date_of_birth": date(2007, 1, 18),  # Born after 2005
        "email": "ananya.iyer@example.edu",
        "phone": "+91 96345 67890",
        "course": "Computer Science",
        "address": "12 Anna Salai, Chennai, Tamil Nadu",
        "enrollment_date": date(2025, 1, 12),
    },
    {
        "student_id": "STU1005",
        "name": "Kabir Khan",
        "date_of_birth": date(2005, 8, 30),
        "email": "kabir.khan@example.edu",
        "phone": "+91 95456 78901",
        "course": "Business Administration",
        "address": "77 Marine Drive, Mumbai, Maharashtra",
        "enrollment_date": date(2023, 9, 5),
    },
    {
        "student_id": "STU1006",
        "name": "Sneha Kulkarni",
        "date_of_birth": date(2006, 4, 15),  # Born after 2005
        "email": "sneha.k@example.edu",
        "phone": "+91 94567 89012",
        "course": "Data Science",
        "address": "29 FC Road, Pune, Maharashtra",
        "enrollment_date": date(2024, 8, 20),
    },
    {
        "student_id": "STU1007",
        "name": "Vikram Malhotra",
        "date_of_birth": date(2002, 12, 5),
        "email": "vikram.m@example.edu",
        "phone": "+91 93678 90123",
        "course": "Electrical Engineering",
        "address": "104 Sector 17, Chandigarh",
        "enrollment_date": date(2021, 8, 15),
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = 0
        for student_dict in SAMPLE_STUDENTS:
            existing = db.query(Student).filter(Student.student_id == student_dict["student_id"]).first()
            if not existing:
                student = Student(**student_dict)
                db.add(student)
                count += 1
        db.commit()
        print(f"Successfully seeded {count} sample student records into database.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
