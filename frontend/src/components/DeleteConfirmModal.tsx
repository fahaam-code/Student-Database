import React from 'react';
import { Student } from '../types/student';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  student,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !student) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--accent-rose-light)',
                color: 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div className="modal-title-group">
              <h3>Confirm Deletion</h3>
              <p>Irreversible database action</p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            disabled={isDeleting}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '14px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Are you sure you want to permanently delete the student profile for:
          </p>

          <div
            style={{
              padding: '12px 16px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
              {student.name}
            </span>
            <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              <span>ID: <code style={{ color: 'var(--primary)' }}>{student.student_id}</code></span>
              <span>•</span>
              <span>Course: {student.course || 'Undeclared'}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--accent-rose)' }}>
            This student will be deleted from the database table and cannot be recovered.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 size={16} />
                <span>Yes, Delete Record</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
