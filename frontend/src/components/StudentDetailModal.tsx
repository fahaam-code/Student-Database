import React from 'react';
import { Student } from '../types/student';
import {
  X,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  MapPin,
  Clock,
  Edit2,
  Trash2,
} from 'lucide-react';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  isOpen,
  onClose,
  student,
  onEdit,
  onDelete,
}) => {
  if (!isOpen || !student) return null;

  const calculateAge = (dobString: string) => {
    try {
      const birth = new Date(dobString);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return `${age} years old`;
    } catch {
      return 'N/A';
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Not recorded';
    try {
      const [year, month, day] = dateStr.split('T')[0].split('-');
      const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <h3>Student Profile</h3>
            <p>Complete academic record and personal information</p>
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

        <div className="modal-body">
          {/* Profile Header Card */}
          <div className="detail-profile-hero">
            <div
              className="detail-avatar-lg"
              style={{
                background: 'var(--primary)',
              }}
            >
              {student.name.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h4 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{student.name}</h4>
                <span className="student-id-badge">{student.student_id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <BookOpen size={14} color="var(--primary)" />
                <span>{student.course || 'Undeclared'}</span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Email Address</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} color="var(--text-dim)" />
                <span className="detail-val">
                  {student.email ? (
                    <a
                      href={`mailto:${student.email}`}
                      style={{ color: 'var(--primary)', textDecoration: 'none' }}
                    >
                      {student.email}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Phone Number</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="var(--text-dim)" />
                <span className="detail-val">{student.phone || 'Not provided'}</span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Date of Birth & Age</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} color="var(--text-dim)" />
                <span className="detail-val">
                  {formatDate(student.date_of_birth)} ({calculateAge(student.date_of_birth)})
                </span>
              </div>
            </div>

            <div className="detail-item">
              <span className="detail-label">Enrollment Date</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} color="var(--text-dim)" />
                <span className="detail-val">{formatDate(student.enrollment_date)}</span>
              </div>
            </div>

            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
              <span className="detail-label">Residential Address</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--text-dim)" />
                <span className="detail-val">{student.address || 'No residential address on file'}</span>
              </div>
            </div>

            {student.created_at && (
              <div className="detail-item" style={{ gridColumn: '1 / -1', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <span className="detail-label" style={{ fontSize: '0.7rem' }}>Audit Trail</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Created on {new Date(student.created_at).toLocaleString()}
                  {student.updated_at && ` • Last updated ${new Date(student.updated_at).toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => {
              onClose();
              onDelete(student);
            }}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              onEdit(student);
            }}
          >
            <Edit2 size={14} />
            <span>Edit Profile</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
