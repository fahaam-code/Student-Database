import {
  Student,
  StudentCreateInput,
  StudentUpdateInput,
  StudentListResponse,
  StatsResponse,
  StudentFilters,
} from '../types/student';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorDetail: unknown = null;
    try {
      const data = await response.json();
      errorDetail = data;
      if (typeof data.detail === 'string') {
        errorMessage = data.detail;
      } else if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((d: { msg?: string; loc?: string[] }) => d.msg || JSON.stringify(d)).join(', ');
      } else if (data.message) {
        errorMessage = data.message;
      }
    } catch {
      // response wasn't JSON
    }
    throw new ApiError(errorMessage, response.status, errorDetail);
  }
  return response.json();
}

export const api = {
  /**
   * Fetch paginated list of students with optional search & filter params
   */
  async getStudents(filters?: Partial<StudentFilters>): Promise<StudentListResponse> {
    const params = new URLSearchParams();
    if (filters?.course && filters.course !== 'ALL') {
      params.append('course', filters.course);
    }
    if (filters?.search && filters.search.trim()) {
      params.append('search', filters.search.trim());
    }
    if (filters?.bornAfter) {
      params.append('born_after', filters.bornAfter);
    }
    if (filters?.bornBefore) {
      params.append('born_before', filters.bornBefore);
    }
    if (typeof filters?.skip === 'number') {
      params.append('skip', filters.skip.toString());
    }
    if (typeof filters?.limit === 'number') {
      params.append('limit', filters.limit.toString());
    }

    const query = params.toString();
    const url = `${API_BASE}/students${query ? `?${query}` : ''}`;
    const res = await fetch(url);
    return handleResponse<StudentListResponse>(res);
  },

  /**
   * Get single student by ID
   */
  async getStudent(studentId: string): Promise<Student> {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`);
    return handleResponse<Student>(res);
  },

  /**
   * Create a new student record
   */
  async createStudent(data: StudentCreateInput): Promise<Student> {
    const payload = { ...data };
    // Clean up empty optional fields
    if (!payload.student_id?.trim()) delete payload.student_id;
    if (!payload.email?.trim()) delete payload.email;
    if (!payload.phone?.trim()) delete payload.phone;
    if (!payload.course?.trim()) delete payload.course;
    if (!payload.address?.trim()) delete payload.address;
    if (!payload.enrollment_date?.trim()) delete payload.enrollment_date;

    const res = await fetch(`${API_BASE}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Student>(res);
  },

  /**
   * Full update of student (PUT)
   */
  async updateStudent(studentId: string, data: StudentUpdateInput): Promise<Student> {
    const payload = { ...data };
    if (!payload.email?.trim()) delete payload.email;
    if (!payload.phone?.trim()) delete payload.phone;
    if (!payload.course?.trim()) delete payload.course;
    if (!payload.address?.trim()) delete payload.address;

    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<Student>(res);
  },

  /**
   * Delete student record
   */
  async deleteStudent(studentId: string): Promise<{ message: string; student_id: string; name: string }> {
    const res = await fetch(`${API_BASE}/students/${encodeURIComponent(studentId)}`, {
      method: 'DELETE',
    });
    return handleResponse<{ message: string; student_id: string; name: string }>(res);
  },

  /**
   * Fetch aggregate statistics from backend
   */
  async getStats(): Promise<StatsResponse> {
    const res = await fetch(`${API_BASE}/api/stats`);
    return handleResponse<StatsResponse>(res);
  },
};
