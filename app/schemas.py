from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator


class StudentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Full name of the student")
    date_of_birth: date = Field(..., description="Student date of birth (YYYY-MM-DD)")
    email: Optional[EmailStr] = Field(None, description="Contact email address")
    phone: Optional[str] = Field(None, max_length=30, description="Contact phone number")
    course: Optional[str] = Field(None, max_length=100, description="Enrolled program or course")
    address: Optional[str] = Field(None, max_length=255, description="Residential address")
    enrollment_date: Optional[date] = Field(default_factory=date.today, description="Date of enrollment")

    @model_validator(mode="after")
    def validate_contact_info(self):
        """Validate that at least one form of contact information (email or phone) is provided."""
        if not self.email and not (self.phone and self.phone.strip()):
            raise ValueError("At least one contact method (email or phone) must be provided.")
        return self


class StudentCreate(StudentBase):
    student_id: Optional[str] = Field(
        None,
        max_length=50,
        description="Unique student identifier (e.g. STU1001). If omitted, one will be auto-generated."
    )


class StudentUpdate(StudentBase):
    """Full update schema for PUT /students/{student_id}"""
    pass


class StudentPatch(BaseModel):
    """Partial update schema for PATCH /students/{student_id}"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=30)
    course: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    enrollment_date: Optional[date] = None


class StudentResponse(BaseModel):
    id: int
    student_id: str
    name: str
    date_of_birth: date
    email: Optional[str] = None
    phone: Optional[str] = None
    course: Optional[str] = None
    address: Optional[str] = None
    enrollment_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class StudentListResponse(BaseModel):
    total: int
    count: int
    skip: int
    limit: int
    students: List[StudentResponse]


class AIQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=500, description="Natural language question about student records")


class AIQueryResponse(BaseModel):
    question: str
    answer: str
    model_used: str
    records_referenced: int
    source: str  # "ollama" or "grounded_rule_engine"
