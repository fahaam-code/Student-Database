"""
Database seeder for Student Information System.
Populates the 10 demo student records.
"""
from datetime import date
from app.database import SessionLocal, Base, engine
from app.models import Student

SAMPLE_STUDENTS = [
    {
        "student_id": "STU1001",
        "name": "Aarav Sharma",
        "date_of_birth": date(2004, 5, 12),
        "email": "aarav.demo@example.com",
        "course": "Computer Science",
        "enrollment_date": date(2023, 8, 1),
    },
    {
        "student_id": "STU1002",
        "name": "Priya Verma",
        "date_of_birth": date(2006, 8, 20),
        "email": "priya.demo@example.com",
        "course": "Data Science",
        "enrollment_date": date(2024, 7, 15),
    },
    {
        "student_id": "STU1003",
        "name": "Rahul Khan",
        "date_of_birth": date(2003, 11, 15),
        "email": "rahul.demo@example.com",
        "course": "AI/ML",
        "enrollment_date": date(2022, 8, 10),
    },
    {
        "student_id": "STU1004",
        "name": "Sneha Gupta",
        "date_of_birth": date(2005, 2, 10),
        "email": "sneha.demo@example.com",
        "course": "Computer Science",
        "enrollment_date": date(2023, 9, 1),
    },
    {
        "student_id": "STU1005",
        "name": "Arjun Singh",
        "date_of_birth": date(2007, 6, 25),
        "email": "arjun.demo@example.com",
        "course": "Cybersecurity",
        "enrollment_date": date(2025, 1, 15),
    },
    {
        "student_id": "STU1006",
        "name": "Neha Patel",
        "date_of_birth": date(2002, 9, 18),
        "email": "neha.demo@example.com",
        "course": "Web Development",
        "enrollment_date": date(2021, 8, 15),
    },
    {
        "student_id": "STU1007",
        "name": "Zoya Ahmed",
        "date_of_birth": date(2006, 12, 3),
        "email": "zoya.demo@example.com",
        "course": "AI/ML",
        "enrollment_date": date(2024, 8, 20),
    },
    {
        "student_id": "STU1008",
        "name": "Rohan Mehta",
        "date_of_birth": date(2004, 3, 22),
        "email": "rohan.demo@example.com",
        "course": "Data Science",
        "enrollment_date": date(2023, 9, 5),
    },
    {
        "student_id": "STU1009",
        "name": "Ananya Das",
        "date_of_birth": date(2005, 7, 14),
        "email": "ananya.demo@example.com",
        "course": "Cybersecurity",
        "enrollment_date": date(2023, 8, 15),
    },
    {
        "student_id": "STU1010",
        "name": "Kabir Ali",
        "date_of_birth": date(2003, 1, 9),
        "email": "kabir.demo@example.com",
        "course": "Web Development",
        "enrollment_date": date(2022, 9, 1),
    },
]


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = 0
        for student_dict in SAMPLE_STUDENTS:
            existing = (
                db.query(Student)
                .filter(
                    (Student.student_id == student_dict["student_id"])
                    | (Student.email == student_dict["email"])
                )
                .first()
            )
            if not existing:
                student = Student(**student_dict)
                db.add(student)
                count += 1
            else:
                existing.name = student_dict["name"]
                existing.date_of_birth = student_dict["date_of_birth"]
                existing.course = student_dict["course"]
        db.commit()
        print(f"Database contains {len(SAMPLE_STUDENTS)} records ({count} newly inserted).")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
