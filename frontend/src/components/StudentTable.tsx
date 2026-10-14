import React from 'react';
import {
  Student,
  StudentFilters,
} from '../types/student';
import {
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface StudentTableProps {
  students: Student[];
  totalStudents: number;
  isLoading: boolean;
  filters: StudentFilters;
  onFilterChange: (newFilters: Partial<StudentFilters>) => void;
  availableCourses: string[];
  onViewStudent: (student: Student) => void;
  onEditStudent: (student: Student) => void;
  onDeleteStudent: (student: Student) => void;
  onOpenAddModal: () => void;
  onResetFilters: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  totalStudents,
  isLoading,
  filters,
  onFilterChange,
  availableCourses,
  onViewStudent,
  onEditStudent,
  onDeleteStudent,
  onOpenAddModal,
  onResetFilters,
}) => {
  // Course badge color helper
  const getCourseBadgeClass = (course?: string | null) => {
    if (!course) return 'course-badge default';
    const c = course.toLowerCase();
    if (c.includes('computer')) return 'course-badge cs';
    if (c.includes('data')) return 'course-badge ds';
    if (c.includes('ai') || c.includes('machine') || c.includes('ml')) return 'course-badge ai';
    if (c.includes('cyber')) return 'course-badge cyber';
    if (c.includes('web')) return 'course-badge web';
    return 'course-badge default';
  };

  // Avatar background palette generator based on student name (warm tones)
  const getAvatarGradient = (name: string) => {
    const colors = [
      '#94572c', // warm terracotta
      '#4d7a5b', // warm sage
      '#7a5230', // warm chestnut
      '#596e79', // warm slate
      '#a86527', // warm amber
      '#845163', // warm mauve
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name.slice(0, 2) || 'ST').toUpperCase();
  };

  const isBornAfter2005 = (dobString: string) => {
    try {
      const year = parseInt(dobString.split('-')[0], 10);
      return year > 2005;
    } catch {
      return false;
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const [year, month, day] = dateStr.split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const isFilterActive =
    Boolean(filters.search.trim()) ||
    Boolean(filters.course && filters.course !== 'ALL') ||
    Boolean(filters.bornAfter);

  return (
    <div className="table-container-card">
      {/* Table Toolbar */}
      <div className="toolbar-card" style={{ border: 'none', borderRadius: 0, borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="toolbar-left">
          {/* Search Input */}
          <div className="search-input-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, ID, email, or course..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value, skip: 0 })}
            />
          </div>

          {/* Course Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} color="var(--text-dim)" />
            <select
              className="filter-select"
              value={filters.course}
              onChange={(e) => onFilterChange({ course: e.target.value, skip: 0 })}
              aria-label="Filter by course"
            >
              <option value="ALL">All Courses ({availableCourses.length})</option>
              {availableCourses.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Born After 2005 Quick Filter Chip */}
          <button
            type="button"
            className={`filter-chip ${filters.bornAfter === '2005-12-31' ? 'active' : ''}`}
            onClick={() => {
              if (filters.bornAfter === '2005-12-31') {
                onFilterChange({ bornAfter: '', skip: 0 });
              } else {
                onFilterChange({ bornAfter: '2005-12-31', skip: 0 });
              }
            }}
          >
            <Calendar size={13} />
            <span>Born After 2005</span>
          </button>

          {/* Reset Filters button */}
          {isFilterActive && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onResetFilters}
            >
              Reset
            </button>
          )}
        </div>

        <div className="toolbar-right">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onOpenAddModal}
          >
            <Plus size={15} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="table-scroll">
        <table className="records-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>Student ID</th>
              <th>Student Name</th>
              <th>Contact Email</th>
              <th>Course / Program</th>
              <th>Date of Birth</th>
              <th style={{ textAlign: 'right', width: '130px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6}>
                  <div className="loading-container">
                    <div className="spinner" />
                    <span>Querying database records...</span>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && students.length === 0 && (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state-box">
                    <div className="empty-icon-circle">
                      <AlertCircle size={28} />
                    </div>
                    <h4>No student records found</h4>
                    <p>
                      {isFilterActive
                        ? 'No students match your active filter criteria. Try clearing search filters or search a different keyword.'
                        : 'Your student database is currently empty. Add your first student to get started.'}
                    </p>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      {isFilterActive ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={onResetFilters}
                        >
                          Clear Filters
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={onOpenAddModal}
                        >
                          <Plus size={14} />
                          <span>Add Student</span>
                        </button>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              students.map((student) => {
                const youngGen = isBornAfter2005(student.date_of_birth);
                return (
                  <tr key={student.id}>
                    <td>
                      <span className="student-id-badge">{student.student_id}</span>
                    </td>
                    <td>
                      <div className="student-name-cell">
                        <div
                          className="avatar"
                          style={{ background: getAvatarGradient(student.name) }}
                        >
                          {getInitials(student.name)}
                        </div>
                        <div className="student-info-text">
                          <span className="student-full-name">{student.name}</span>
                          {student.phone && (
                            <span className="student-phone-sub">{student.phone}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="email-cell">
                      {student.email ? (
                        <a
                          href={`mailto:${student.email}`}
                          style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                          title={`Email ${student.name}`}
                        >
                          {student.email}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          No email provided
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={getCourseBadgeClass(student.course)}>
                        {student.course || 'Undeclared'}
                      </span>
                    </td>
                    <td>
                      <div className="dob-wrapper">
                        <span>{formatDate(student.date_of_birth)}</span>
                        {youngGen && (
                          <span
                            className="dob-pill"
                            title="Born after Dec 31, 2005"
                          >
                            &gt; 2005
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          type="button"
                          className="btn-icon btn-icon-primary"
                          title="View Profile Details"
                          aria-label={`View details for ${student.name}`}
                          onClick={() => onViewStudent(student)}
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit Student Profile"
                          aria-label={`Edit ${student.name}`}
                          onClick={() => onEditStudent(student)}
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon btn-icon-danger"
                          title="Delete Student"
                          aria-label={`Delete ${student.name}`}
                          onClick={() => onDeleteStudent(student)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Table Pagination Footer */}
      <div className="table-footer">
        <div>
          Showing{' '}
          <strong style={{ color: 'var(--text-main)' }}>
            {totalStudents === 0 ? 0 : filters.skip + 1}
          </strong>{' '}
          to{' '}
          <strong style={{ color: 'var(--text-main)' }}>
            {Math.min(filters.skip + students.length, totalStudents)}
          </strong>{' '}
          of <strong style={{ color: 'var(--text-main)' }}>{totalStudents}</strong> student records
        </div>

        <div className="pagination-controls">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={filters.skip === 0 || isLoading}
            onClick={() =>
              onFilterChange({ skip: Math.max(0, filters.skip - filters.limit) })
            }
          >
            <ChevronLeft size={14} />
            <span>Previous</span>
          </button>

          <span style={{ padding: '0 8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Page {Math.floor(filters.skip / filters.limit) + 1} of{' '}
            {Math.max(1, Math.ceil(totalStudents / filters.limit))}
          </span>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={filters.skip + filters.limit >= totalStudents || isLoading}
            onClick={() => onFilterChange({ skip: filters.skip + filters.limit })}
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
