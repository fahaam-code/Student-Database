import json
import re
from datetime import datetime, date
from typing import Dict, Any, List
import httpx
from sqlalchemy.orm import Session
from app.config import OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_TIMEOUT
from app.models import Student


class OllamaService:
    @staticmethod
    def get_grounded_context(db: Session) -> Dict[str, Any]:
        """Fetch sanitized student database records to serve as context for the model."""
        students: List[Student] = db.query(Student).order_by(Student.id.asc()).all()
        student_data = [
            {
                "student_id": s.student_id,
                "name": s.name,
                "date_of_birth": s.date_of_birth.isoformat() if s.date_of_birth else None,
                "course": s.course or "Undeclared",
                "email": s.email or "N/A",
                "phone": s.phone or "N/A",
                "enrollment_date": s.enrollment_date.isoformat() if s.enrollment_date else None,
            }
            for s in students
        ]
        return {
            "total_students": len(students),
            "students": student_data,
        }

    @staticmethod
    async def query_ollama(prompt: str) -> str:
        """Call local Ollama instance via HTTP API."""
        url = f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate"
        payload = {
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,
            },
        }

        timeout_config = httpx.Timeout(OLLAMA_TIMEOUT, connect=2.0)
        async with httpx.AsyncClient(timeout=timeout_config) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "").strip()

    @classmethod
    def fallback_grounded_response(cls, question: str, context: Dict[str, Any]) -> str:
        """
        Grounded rule-based answer generator when Ollama is offline or unavailable.
        Provides accurate answers directly grounded in the database records.
        """
        q_lower = question.lower().strip()
        students = context["students"]
        total = context["total_students"]

        # 1. Total count questions: "how many students", "student count", etc.
        if "how many" in q_lower or "count" in q_lower or "total" in q_lower:
            course_match = None
            for s in students:
                c = s["course"].lower()
                if c != "undeclared" and c in q_lower:
                    course_match = s["course"]
                    break
            if course_match:
                matches = [s for s in students if s["course"].lower() == course_match.lower()]
                return f"There are {len(matches)} student(s) enrolled in {course_match}."
            return f"There are currently {total} student(s) registered in the database."

        # 2. Year questions: "born after 2005", "born before 2000"
        after_match = re.search(r"born (after|later than|from) (\d{4})", q_lower)
        if after_match:
            year = int(after_match.group(2))
            filtered = []
            for s in students:
                dob = s["date_of_birth"]
                if dob:
                    dob_year = int(dob.split("-")[0])
                    if dob_year > year:
                        filtered.append(f"{s['name']} (ID: {s['student_id']}, DOB: {dob}, Course: {s['course']})")
            if filtered:
                return f"Students born after {year} ({len(filtered)} found):\n- " + "\n- ".join(filtered)
            return f"No students found born after {year}."

        before_match = re.search(r"born (before|prior to) (\d{4})", q_lower)
        if before_match:
            year = int(before_match.group(2))
            filtered = []
            for s in students:
                dob = s["date_of_birth"]
                if dob:
                    dob_year = int(dob.split("-")[0])
                    if dob_year < year:
                        filtered.append(f"{s['name']} (ID: {s['student_id']}, DOB: {dob}, Course: {s['course']})")
            if filtered:
                return f"Students born before {year} ({len(filtered)} found):\n- " + "\n- ".join(filtered)
            return f"No students found born before {year}."

        # 3. Course query: "students in Computer Science", "who is taking Data Science"
        for s in students:
            c = s["course"].lower()
            if c != "undeclared" and (c in q_lower or any(word in q_lower for word in c.split() if len(word) > 3)):
                course_students = [st for st in students if st["course"].lower() == s["course"].lower()]
                names = [f"{st['name']} ({st['student_id']})" for st in course_students]
                return f"Students enrolled in {s['course']} ({len(names)}):\n- " + "\n- ".join(names)

        # 4. List all students
        if "list" in q_lower or "show all" in q_lower or "all students" in q_lower:
            if not students:
                return "The student database is currently empty."
            lines = [f"{s['name']} - ID: {s['student_id']} | Course: {s['course']} | DOB: {s['date_of_birth']}" for s in students]
            return f"Total {total} students in database:\n- " + "\n- ".join(lines)

        # 5. Search for specific student name
        for s in students:
            if s["name"].lower() in q_lower:
                return (
                    f"Student Profile for {s['name']}:\n"
                    f"- ID: {s['student_id']}\n"
                    f"- Date of Birth: {s['date_of_birth']}\n"
                    f"- Course: {s['course']}\n"
                    f"- Email: {s['email']}\n"
                    f"- Phone: {s['phone']}\n"
                    f"- Enrollment Date: {s['enrollment_date']}"
                )

        # Generic summary
        return (
            f"Database summary: {total} total students recorded across courses like "
            + ", ".join(set(s['course'] for s in students if s['course'])) + ".\n"
            "Try asking questions such as:\n"
            "- 'How many students are there?'\n"
            "- 'List students born after 2005'\n"
            "- 'Which students are enrolled in Computer Science?'"
        )

    @classmethod
    async def ask_question(cls, question: str, db: Session) -> Dict[str, Any]:
        """Answer question with local Ollama or fallback to grounded heuristic."""
        context = cls.get_grounded_context(db)
        prompt = (
            "You are a helpful student database assistant for an educational institution.\n"
            "Answer the user's question accurately and concisely, strictly based on the following student database records.\n"
            "Do NOT speculate or fabricate any data not present in the records.\n\n"
            f"Database Records Context (JSON):\n{json.dumps(context, indent=2)}\n\n"
            f"User Question: {question}\n\n"
            "Your Answer:"
        )

        try:
            answer = await cls.query_ollama(prompt)
            if answer:
                return {
                    "question": question,
                    "answer": answer,
                    "model_used": OLLAMA_MODEL,
                    "records_referenced": context["total_students"],
                    "source": "ollama",
                }
        except Exception:
            # Ollama not reachable or offline; gracefully fall back to grounded engine
            pass

        fallback_answer = cls.fallback_grounded_response(question, context)
        return {
            "question": question,
            "answer": fallback_answer,
            "model_used": f"{OLLAMA_MODEL} (grounded fallback)",
            "records_referenced": context["total_students"],
            "source": "grounded_rule_engine",
        }
