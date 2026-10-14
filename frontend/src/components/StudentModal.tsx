import React, { useState, useEffect } from 'react';
import { Student, StudentCreateInput, StudentUpdateInput } from '../types/student';
import { X, UserPlus, Save, AlertCircle } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  student?: Student | null;
  onSubmitCreate: (data: StudentCreateInput) => Promise<void>;
  onSubmitUpdate: (studentId: string, data: StudentUpdateInput) => Promise<void>;
  availableCourses: string[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  mode,
  student,
  onSubmitCreate,
  onSubmitUpdate,
  availableCourses,
}) => {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [course, setCourse] = useState('Computer Science');
  const [customCourse, setCustomCourse] = useState('');
  const [address, setAddress] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when modal opens or target student changes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (mode === 'edit' && student) {
        setStudentId(student.student_id);
        setName(student.name);
        setDateOfBirth(student.date_of_birth || '');
        setEmail(student.email || '');
        setPhone(student.phone || '');
        if (student.course && availableCourses.includes(student.course)) {
          setCourse(student.course);
          setCustomCourse('');
        } else if (student.course) {
          setCourse('OTHER');
          setCustomCourse(student.course);
        } else {
          setCourse('Computer Science');
          setCustomCourse('');
        }
        setAddress(student.address || '');
        setEnrollmentDate(student.enrollment_date || '');
      } else {
        // Reset form for create
        setStudentId('');
        setName('');
        setDateOfBirth('2005-01-01');
        setEmail('');
        setPhone('');
        setCourse('Computer Science');
        setCustomCourse('');
        setAddress('');
        const today = new Date().toISOString().split('T')[0];
        setEnrollmentDate(today);
      }
    }
  }, [isOpen, mode, student, availableCourses]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validations
    if (!name.trim()) {
      setError('Student name is required.');
      return;
    }

    if (!dateOfBirth) {
      setError('Date of birth is required.');
      return;
    }

    // Backend rule: At least one contact method (email or phone) must be provided
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    if (!cleanEmail && !cleanPhone) {
      setError('At least one contact method (Email or Phone number) must be provided.');
      return;
    }

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please provide a valid email address.');
      return;
    }

    const finalCourse = course === 'OTHER' ? customCourse.trim() : course;

    setIsSubmitting(true);
    try {
      if (mode === 'add') {
        const payload: StudentCreateInput = {
          name: name.trim(),
          date_of_birth: dateOfBirth,
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          course: finalCourse || undefined,
          address: address.trim() || undefined,
          enrollment_date: enrollmentDate || undefined,
        };
        if (studentId.trim()) {
          payload.student_id = studentId.trim();
        }
        await onSubmitCreate(payload);
      } else if (mode === 'edit' && student) {
        const payload: StudentUpdateInput = {
          name: name.trim(),
          date_of_birth: dateOfBirth,
          email: cleanEmail || undefined,
          phone: cleanPhone || undefined,
          course: finalCourse || undefined,
          address: address.trim() || undefined,
          enrollment_date: enrollmentDate || undefined,
        };
        await onSubmitUpdate(student.student_id, payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving student.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>{mode === 'add' ? 'Add New Student' : 'Edit Student Profile'}</h3>
            <p>
              {mode === 'add'
                ? 'Fill out the details below to enroll a new student in the database.'
                : `Updating records for student ${student?.student_id}`}
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body">
            {error && (
              <div className="error-banner">
                <div className="error-banner-content">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="form-grid-2">
              {/* Student ID */}
              <div className="form-group">
                <label className="form-label">
                  Student ID
                  {mode === 'add' && <span className="field-hint" style={{ fontWeight: 400 }}> (Optional)</span>}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={mode === 'add' ? 'Auto-generated (e.g. STU1015)' : ''}
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  disabled={mode === 'edit' || isSubmitting}
                />
                {mode === 'add' && (
                  <span className="field-hint">Leave blank to auto-generate unique ID</span>
                )}
              </div>

              {/* Full Name */}
              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Date of Birth */}
              <div className="form-group">
                <label className="form-label">
                  Date of Birth <span className="required">*</span>
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Course */}
              <div className="form-group">
                <label className="form-label">Course / Program</label>
                <select
                  className="form-input"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Science">Data Science</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Web Development">Web Development</option>
                  <option value="OTHER">Other / Custom Course</option>
                </select>
              </div>

              {/* Custom course input if 'OTHER' selected */}
              {course === 'OTHER' && (
                <div className="form-group full-width">
                  <label className="form-label">Specify Custom Course Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Robotics Engineering"
                    value={customCourse}
                    onChange={(e) => setCustomCourse(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  Email Address
                  <span className="field-hint"> (Email or Phone required)</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="+1-555-0199"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Enrollment Date */}
              <div className="form-group">
                <label className="form-label">Enrollment Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={enrollmentDate}
                  onChange={(e) => setEnrollmentDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Address */}
              <div className="form-group full-width">
                <label className="form-label">Residential Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 42 Academic Way, Innovation Campus"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  <span>Saving...</span>
                </>
              ) : mode === 'add' ? (
                <>
                  <UserPlus size={16} />
                  <span>Enroll Student</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
