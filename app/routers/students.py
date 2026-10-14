from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    StudentCreate,
    StudentUpdate,
    StudentPatch,
    StudentResponse,
    StudentListResponse,
)
from app import crud

router = APIRouter(prefix="/students", tags=["Students"])


@router.post(
    "",
    response_model=StudentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new student",
    description="Add a new student record to the database with validation for required fields and contact details.",
)
def create_student(student_in: StudentCreate, db: Session = Depends(get_db)):
    # Check if custom student_id is already taken
    if student_in.student_id:
        existing = crud.get_student_by_id(db, student_in.student_id)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student ID '{student_in.student_id}' is already registered.",
            )

    # Check if email is already taken
    if student_in.email:
        existing_email = crud.get_student_by_email(db, student_in.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{student_in.email}' is already registered with student ID '{existing_email.student_id}'.",
            )

    try:
        new_student = crud.create_student(db, student_in)
        return new_student
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=StudentListResponse,
    summary="List and filter students",
    description="Retrieve all students with optional filters for course, name/ID search, and birth date range.",
)
def list_students(
    course: Optional[str] = Query(None, description="Filter by course name (case-insensitive substring)"),
    search: Optional[str] = Query(None, description="Search term for name, ID, email, or course"),
    born_after: Optional[date] = Query(None, description="Filter students born after date (YYYY-MM-DD)"),
    born_before: Optional[date] = Query(None, description="Filter students born before date (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0, description="Pagination skip offset"),
    limit: int = Query(50, ge=1, le=200, description="Pagination limit"),
    db: Session = Depends(get_db),
):
    students, total = crud.list_students(
        db,
        course=course,
        search=search,
        born_after=born_after,
        born_before=born_before,
        skip=skip,
        limit=limit,
    )
    return StudentListResponse(
        total=total,
        count=len(students),
        skip=skip,
        limit=limit,
        students=students,
    )


@router.get(
    "/{student_id}",
    response_model=StudentResponse,
    summary="View student details",
    description="Fetch a single student profile by student_id or internal numeric ID.",
)
def get_student(student_id: str, db: Session = Depends(get_db)):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )
    return student


@router.put(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Update student details (Full Replacement)",
    description="Update an existing student's entire profile with new details.",
)
def update_student(
    student_id: str,
    student_in: StudentUpdate,
    db: Session = Depends(get_db),
):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )

    # Check email duplicate if changed
    if student_in.email:
        existing_email = crud.get_student_by_email(db, student_in.email)
        if existing_email and existing_email.student_id != student.student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{student_in.email}' is already registered with another student.",
            )

    try:
        updated = crud.update_student(db, student, student_in)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch(
    "/{student_id}",
    response_model=StudentResponse,
    summary="Partially update student details",
    description="Modify specific fields of an existing student's profile.",
)
def patch_student(
    student_id: str,
    student_in: StudentPatch,
    db: Session = Depends(get_db),
):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )

    # Check email conflict
    if student_in.email:
        existing_email = crud.get_student_by_email(db, student_in.email)
        if existing_email and existing_email.student_id != student.student_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{student_in.email}' is already registered with another student.",
            )

    try:
        updated = crud.patch_student(db, student, student_in)
        return updated
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete(
    "/{student_id}",
    summary="Delete a student",
    description="Remove a student record permanently from the database.",
)
def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = crud.get_student_by_id(db, student_id)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with ID '{student_id}' not found.",
        )
    deleted = crud.delete_student(db, student)
    return {
        "message": f"Student '{deleted.name}' (ID: {deleted.student_id}) deleted successfully.",
        "student_id": deleted.student_id,
        "name": deleted.name,
    }
