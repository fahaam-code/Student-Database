import re
from datetime import date
from typing import Optional, Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from app.models import Student
from app.schemas import StudentCreate, StudentUpdate, StudentPatch


def generate_next_student_id(db: Session) -> str:
    """Generate a clean sequential student ID like STU1001, STU1002, etc."""
    last_student = db.query(Student).order_by(desc(Student.id)).first()
    if not last_student or not last_student.student_id:
        return "STU1001"
    
    # Try finding numerical part
    match = re.search(r"(\d+)$", last_student.student_id)
    if match:
        next_num = int(match.group(1)) + 1
        prefix = last_student.student_id[:match.start()]
        if not prefix:
            prefix = "STU"
        return f"{prefix}{next_num:04d}"
    return f"STU{1000 + (last_student.id or 0) + 1}"


def get_student_by_id(db: Session, student_id: str) -> Optional[Student]:
    """Retrieve student by student_id or internal numeric id."""
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student and student_id.isdigit():
        student = db.query(Student).filter(Student.id == int(student_id)).first()
    return student


def get_student_by_email(db: Session, email: str) -> Optional[Student]:
    """Retrieve student by exact email address."""
    if not email:
        return None
    return db.query(Student).filter(Student.email == email).first()


def list_students(
    db: Session,
    course: Optional[str] = None,
    search: Optional[str] = None,
    born_after: Optional[date] = None,
    born_before: Optional[date] = None,
    skip: int = 0,
    limit: int = 100,
) -> Tuple[List[Student], int]:
    """List students with optional course, search and date-of-birth filtering."""
    query = db.query(Student)

    if course:
        query = query.filter(Student.course.ilike(f"%{course.strip()}%"))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_term),
                Student.student_id.ilike(search_term),
                Student.email.ilike(search_term),
                Student.course.ilike(search_term),
            )
        )

    if born_after:
        query = query.filter(Student.date_of_birth > born_after)

    if born_before:
        query = query.filter(Student.date_of_birth < born_before)

    total = query.count()
    students = query.order_by(Student.id.asc()).offset(skip).limit(limit).all()
    return students, total


def create_student(db: Session, student_in: StudentCreate) -> Student:
    """Create a new student record."""
    student_id = student_in.student_id
    if not student_id or not student_id.strip():
        student_id = generate_next_student_id(db)
    else:
        student_id = student_id.strip()

    db_student = Student(
        student_id=student_id,
        name=student_in.name.strip(),
        date_of_birth=student_in.date_of_birth,
        email=student_in.email.strip() if student_in.email else None,
        phone=student_in.phone.strip() if student_in.phone else None,
        course=student_in.course.strip() if student_in.course else None,
        address=student_in.address.strip() if student_in.address else None,
        enrollment_date=student_in.enrollment_date or date.today(),
    )
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student


def update_student(db: Session, db_student: Student, student_in: StudentUpdate) -> Student:
    """Replace all editable fields (PUT)."""
    db_student.name = student_in.name.strip()
    db_student.date_of_birth = student_in.date_of_birth
    db_student.email = student_in.email.strip() if student_in.email else None
    db_student.phone = student_in.phone.strip() if student_in.phone else None
    db_student.course = student_in.course.strip() if student_in.course else None
    db_student.address = student_in.address.strip() if student_in.address else None
    if student_in.enrollment_date:
        db_student.enrollment_date = student_in.enrollment_date

    db.commit()
    db.refresh(db_student)
    return db_student


def patch_student(db: Session, db_student: Student, student_in: StudentPatch) -> Student:
    """Partially update student record (PATCH)."""
    update_data = student_in.model_dump(exclude_unset=True)

    # String cleanup
    for key, value in update_data.items():
        if isinstance(value, str):
            setattr(db_student, key, value.strip() if value.strip() else None)
        else:
            setattr(db_student, key, value)

    # Validate that student still has at least email or phone
    if not db_student.email and not (db_student.phone and db_student.phone.strip()):
        db.rollback()
        raise ValueError("Cannot remove contact info: student must retain either an email or a phone number.")

    db.commit()
    db.refresh(db_student)
    return db_student


def delete_student(db: Session, db_student: Student) -> Student:
    """Delete student record."""
    db.delete(db_student)
    db.commit()
    return db_student
