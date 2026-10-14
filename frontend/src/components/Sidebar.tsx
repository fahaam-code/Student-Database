import React from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  Database,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'students';
  onSelectTab: (tab: 'dashboard' | 'students') => void;
  isOpen: boolean;
  onClose: () => void;
  totalStudents: number;
  isBackendConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
  totalStudents,
  isBackendConnected,
}) => {
  return (
    <>
      {isOpen && (
        <div
          className="modal-backdrop"
          style={{ zIndex: 35 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <a
            href="#home"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('dashboard');
            }}
          >
            <div className="brand-icon">
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="brand-title">StudentDB</div>
            </div>
          </a>
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>

          <button
            type="button"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('dashboard');
              onClose();
            }}
          >
            <div className="nav-icon">
              <LayoutDashboard size={18} />
            </div>
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('students');
              onClose();
            }}
          >
            <div className="nav-icon">
              <Users size={18} />
            </div>
            <span>Students</span>
            <span className="nav-badge">{totalStudents}</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <Database size={15} color="var(--text-dim)" />
          <div className="backend-status-pill">
            <span
              className={`status-indicator ${
                isBackendConnected ? 'online' : 'offline'
              }`}
            />
            <span>{isBackendConnected ? 'API Connected' : 'API Disconnected'}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
