import React from 'react';
import { Menu, Plus, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'students';
  onToggleSidebar: () => void;
  onOpenAddModal: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onToggleSidebar,
  onOpenAddModal,
  onRefresh,
  isLoading,
}) => {
  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <button
          type="button"
          className="mobile-menu-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="page-breadcrumb">
          <span>Student Database</span>
          <span>/</span>
          <span className="page-title-badge">
            {activeTab === 'dashboard' ? 'Overview' : 'Students Directory'}
          </span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          type="button"
          className="btn-icon"
          onClick={onRefresh}
          title="Refresh Data"
          aria-label="Refresh data"
          disabled={isLoading}
        >
          <RefreshCw size={15} className={isLoading ? 'spinner' : ''} />
        </button>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={onOpenAddModal}
        >
          <Plus size={15} />
          <span>Add Student</span>
        </button>
      </div>
    </header>
  );
};
