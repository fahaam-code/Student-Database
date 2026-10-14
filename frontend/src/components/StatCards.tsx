import React from 'react';
import { Users, BookOpen, Calendar } from 'lucide-react';

interface StatCardsProps {
  totalStudents: number;
  activeCourses: number;
  bornAfter2005Count: number;
  onFilterBornAfter2005?: () => void;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalStudents,
  activeCourses,
  bornAfter2005Count,
  onFilterBornAfter2005,
}) => {
  return (
    <div className="stats-grid">
      {/* 1. Total Enrolled */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-icon-wrapper stat-icon-indigo">
            <Users size={20} />
          </div>
          <span className="stat-tag positive">Enrolled</span>
        </div>
        <div className="stat-body">
          <span className="stat-label">Total Enrolled</span>
          <span className="stat-value">{totalStudents}</span>
          <span className="stat-subtext">Active student records</span>
        </div>
      </div>

      {/* 2. Active Courses */}
      <div className="stat-card">
        <div className="stat-card-header">
          <div className="stat-icon-wrapper stat-icon-cyan">
            <BookOpen size={20} />
          </div>
          <span className="stat-tag info">Programs</span>
        </div>
        <div className="stat-body">
          <span className="stat-label">Active Courses</span>
          <span className="stat-value">{activeCourses}</span>
          <span className="stat-subtext">Academic disciplines</span>
        </div>
      </div>

      {/* 3. Born After 2005 */}
      <div
        className="stat-card"
        style={{ cursor: onFilterBornAfter2005 ? 'pointer' : 'default' }}
        onClick={onFilterBornAfter2005}
        title="Click to filter students born after 2005"
      >
        <div className="stat-card-header">
          <div className="stat-icon-wrapper stat-icon-emerald">
            <Calendar size={20} />
          </div>
          <span className="stat-tag positive">Cohort</span>
        </div>
        <div className="stat-body">
          <span className="stat-label">Born After 2005</span>
          <span className="stat-value">{bornAfter2005Count}</span>
          <span className="stat-subtext">
            {totalStudents > 0
              ? `${Math.round((bornAfter2005Count / totalStudents) * 100)}% of students`
              : 'Born >= 2006'}
          </span>
        </div>
      </div>
    </div>
  );
};
