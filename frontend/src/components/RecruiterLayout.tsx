import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, PlusCircle, Upload, Users, Award, FileSpreadsheet, LayoutDashboard } from 'lucide-react';

export const RecruiterLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/recruiter/jobs', label: 'Job Postings', icon: Briefcase },
    { path: '/recruiter/jobs/create', label: 'Create Job', icon: PlusCircle },
    { path: '/recruiter/upload', label: 'Upload Resumes', icon: Upload },
    { path: '/recruiter/candidates', label: 'Candidate Pool', icon: Users },
    { path: '/recruiter/ranking', label: 'Candidate Rankings', icon: Award },
    { path: '/recruiter/reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const isCurrent = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
      {/* Recruiter Workspace Header & Sub-navigation */}
      <div className="bg-surface rounded-lg border border-line mb-5 overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-accent-light text-accent flex items-center justify-center">
                <Briefcase className="w-3.5 h-3.5" />
              </span>
              <h1 className="text-base font-bold text-text-main">Recruiter Workspace</h1>
            </div>
            <p className="text-xs text-text-muted mt-0.5 ml-8">
              Resume screening, information extraction &amp; hybrid candidate ranking
            </p>
          </div>
          <span className="self-start sm:self-auto text-[11px] px-2.5 py-1 bg-accent-light text-accent font-medium rounded border border-accent-border">
            Recruiter Mode Active
          </span>
        </div>

        {/* Tab navigation */}
        <nav className="flex flex-wrap items-center gap-1 px-4 py-2 bg-slate-50/50">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium transition ${
                  active
                    ? 'bg-accent text-white shadow-xs font-semibold'
                    : 'text-text-muted hover:text-text-main hover:bg-white border border-transparent hover:border-line'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Recruiter Content Container */}
      <div className="bg-surface rounded-lg border border-line p-5 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
};
