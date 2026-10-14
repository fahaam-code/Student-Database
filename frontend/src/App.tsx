import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Student,
  StudentCreateInput,
  StudentUpdateInput,
  StudentFilters,
  StatsResponse,
} from './types/student';
import { api, ApiError } from './services/api';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { StatCards } from './components/StatCards';
import { StudentTable } from './components/StudentTable';
import { StudentModal } from './components/StudentModal';
import { StudentDetailModal } from './components/StudentDetailModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  Plus,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation & UI state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data state
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [bornAfter2005Count, setBornAfter2005Count] = useState(0);

  // Status & loading
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<StudentFilters>({
    search: '',
    course: 'ALL',
    bornAfter: '',
    bornBefore: '',
    skip: 0,
    limit: 15,
  });

  // Modal management
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentModalMode, setStudentModalMode] = useState<'add' | 'edit'>('add');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Derive available courses
  const availableCourses = useMemo(() => {
    const list = new Set<string>();
    if (stats?.course_breakdown) {
      Object.keys(stats.course_breakdown).forEach((c) => {
        if (c && c !== 'Undeclared') list.add(c);
      });
    }
    students.forEach((s) => {
      if (s.course) list.add(s.course);
    });
    ['Computer Science', 'Data Science', 'AI/ML', 'Cybersecurity', 'Web Development'].forEach(
      (c) => list.add(c)
    );
    return Array.from(list).sort();
  }, [stats, students]);

  // Fetch overview statistics
  const fetchOverviewStats = useCallback(async () => {
    try {
      const [statsData, youngGenData] = await Promise.all([
        api.getStats(),
        api.getStudents({ bornAfter: '2005-12-31', limit: 1 }),
      ]);
      setStats(statsData);
      setBornAfter2005Count(youngGenData.total);
      setIsBackendConnected(true);
      setBackendError(null);
    } catch (err) {
      setIsBackendConnected(false);
      setBackendError('Unable to connect to FastAPI backend at http://127.0.0.1:8000');
    }
  }, []);

  // Fetch students list
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudents(filters);
      setStudents(data.students);
      setTotalStudents(data.total);
      setIsBackendConnected(true);
      setBackendError(null);
    } catch (err) {
      setIsBackendConnected(false);
      setBackendError(
        err instanceof ApiError ? err.message : 'Failed to retrieve students from database.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOverviewStats();
  }, [fetchOverviewStats]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // CRUD actions
  const handleCreateStudent = async (data: StudentCreateInput) => {
    const newStudent = await api.createStudent(data);
    addToast('success', `Student '${newStudent.name}' enrolled successfully!`);
    await fetchStudents();
    await fetchOverviewStats();
  };

  const handleUpdateStudent = async (studentId: string, data: StudentUpdateInput) => {
    const updated = await api.updateStudent(studentId, data);
    addToast('success', `Profile for '${updated.name}' updated!`);
    await fetchStudents();
    await fetchOverviewStats();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteStudent(selectedStudent.student_id);
      addToast('success', res.message || `Student record deleted.`);
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
      await fetchStudents();
      await fetchOverviewStats();
    } catch (err) {
      addToast(
        'error',
        err instanceof Error ? err.message : 'Failed to delete student.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFilterChange = (newFilters: Partial<StudentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      course: 'ALL',
      bornAfter: '',
      bornBefore: '',
      skip: 0,
      limit: 15,
    });
  };

  const handleFilterBornAfter2005 = () => {
    setFilters((prev) => ({
      ...prev,
      bornAfter: prev.bornAfter === '2005-12-31' ? '' : '2005-12-31',
      skip: 0,
    }));
  };

  return (
    <div className="app-container">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        totalStudents={totalStudents}
        isBackendConnected={isBackendConnected}
      />

      <div className="main-wrapper">
        <Navbar
          activeTab={activeTab}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenAddModal={() => {
            setSelectedStudent(null);
            setStudentModalMode('add');
            setIsStudentModalOpen(true);
          }}
          onRefresh={() => {
            fetchStudents();
            fetchOverviewStats();
          }}
          isLoading={isLoading}
        />

        <main className="content-container">
          {!isBackendConnected && (
            <div className="error-banner">
              <div className="error-banner-content">
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>Backend Offline: </strong>
                  <span>{backendError}</span>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  fetchOverviewStats();
                  fetchStudents();
                }}
              >
                <RefreshCw size={13} />
                <span>Retry</span>
              </button>
            </div>
          )}

          {/* Clean Hero Header */}
          <div className="hero-banner">
            <div className="hero-info">
              <h1>Student Database</h1>
              <p>
                Manage student records, track course enrollments, and execute CRUD operations seamlessly.
              </p>
            </div>

            <div className="hero-actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentModalMode('add');
                  setIsStudentModalOpen(true);
                }}
              >
                <Plus size={15} />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Required Statistics Cards */}
          <StatCards
            totalStudents={stats?.total_students ?? totalStudents}
            activeCourses={stats?.courses_count ?? availableCourses.length}
            bornAfter2005Count={bornAfter2005Count}
            onFilterBornAfter2005={handleFilterBornAfter2005}
          />

          {/* Student Records Table */}
          <StudentTable
            students={students}
            totalStudents={totalStudents}
            isLoading={isLoading}
            filters={filters}
            onFilterChange={handleFilterChange}
            availableCourses={availableCourses}
            onViewStudent={(student) => {
              setSelectedStudent(student);
              setIsDetailModalOpen(true);
            }}
            onEditStudent={(student) => {
              setSelectedStudent(student);
              setStudentModalMode('edit');
              setIsStudentModalOpen(true);
            }}
            onDeleteStudent={(student) => {
              setSelectedStudent(student);
              setIsDeleteModalOpen(true);
            }}
            onOpenAddModal={() => {
              setSelectedStudent(null);
              setStudentModalMode('add');
              setIsStudentModalOpen(true);
            }}
            onResetFilters={handleResetFilters}
          />
        </main>
      </div>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        mode={studentModalMode}
        student={selectedStudent}
        onSubmitCreate={handleCreateStudent}
        onSubmitUpdate={handleUpdateStudent}
        availableCourses={availableCourses}
      />

      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        student={selectedStudent}
        onEdit={(student) => {
          setSelectedStudent(student);
          setStudentModalMode('edit');
          setIsStudentModalOpen(true);
        }}
        onDelete={(student) => {
          setSelectedStudent(student);
          setIsDeleteModalOpen(true);
        }}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        student={selectedStudent}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};
