export interface Student {
  id: number;
  student_id: string;
  name: string;
  date_of_birth: string; // YYYY-MM-DD
  email?: string | null;
  phone?: string | null;
  course?: string | null;
  address?: string | null;
  enrollment_date?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface StudentCreateInput {
  student_id?: string;
  name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  course?: string;
  address?: string;
  enrollment_date?: string;
}

export interface StudentUpdateInput {
  name: string;
  date_of_birth: string;
  email?: string;
  phone?: string;
  course?: string;
  address?: string;
  enrollment_date?: string;
}

export interface StudentListResponse {
  total: number;
  count: number;
  skip: number;
  limit: number;
  students: Student[];
}

export interface StatsResponse {
  total_students: number;
  courses_count: number;
  course_breakdown: Record<string, number>;
}

export interface StudentFilters {
  search: string;
  course: string;
  bornAfter: string;
  bornBefore: string;
  skip: number;
  limit: number;
}
