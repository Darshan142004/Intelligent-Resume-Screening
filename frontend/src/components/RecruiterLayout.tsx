import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Briefcase, PlusCircle, Upload, Users, Award, FileSpreadsheet, LayoutDashboard } from 'lucide-react';

export const RecruiterLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/recruiter/jobs', label: 'Job Descriptions', icon: Briefcase },
    { path: '/recruiter/jobs/create', label: 'Create Job', icon: PlusCircle },
    { path: '/recruiter/upload', label: 'Upload Resumes', icon: Upload },
    { path: '/recruiter/candidates', label: 'Candidates', icon: Users },
    { path: '/recruiter/ranking', label: 'Candidate Rankings', icon: Award },
    { path: '/recruiter/reports', label: 'Reports', icon: FileSpreadsheet },
  ];

  const isCurrent = (path: string, exact: boolean = false) => {
    if (exact) return location.pathname === path;
    return location.pathname === path;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-6 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Recruiter Module
            </h1>
            <p className="text-xs text-slate-500">
              Resume Screening, Information Extraction & Hybrid Candidate Ranking
            </p>
          </div>
          <span className="mt-2 md:mt-0 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded-full border border-blue-200">
            Recruiter Mode Active
          </span>
        </div>

        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isCurrent(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-xs font-semibold transition ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <Outlet />
      </div>
    </div>
  );
};
