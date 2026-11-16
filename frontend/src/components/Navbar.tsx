import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { checkHealth } from '../services/api';
import { FileText, Briefcase, UserCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    checkHealth()
      .then((res) => {
        if (res && res.status === 'online') {
          setHealthStatus('online');
        } else {
          setHealthStatus('offline');
        }
      })
      .catch(() => setHealthStatus('offline'));
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-surface border-b border-line sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo & Project Title */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-md bg-accent text-white flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-tight text-text-main group-hover:text-accent transition">
                  ResumeScreening<span className="text-accent font-medium">NLP</span>
                </span>
                <span className="text-[10px] text-text-muted font-normal -mt-0.5 hidden sm:inline">
                  MCA Minor Project · NLP Matching &amp; Screening
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-1.5">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                isActive('/') && !isActive('/recruiter') && !isActive('/candidate')
                  ? 'bg-accent-light text-accent font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-100/60'
              }`}
            >
              Overview
            </Link>
            <Link
              to="/recruiter"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                isActive('/recruiter')
                  ? 'bg-accent-light text-accent font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-100/60'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Recruiter Workspace</span>
            </Link>
            <Link
              to="/candidate"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                isActive('/candidate')
                  ? 'bg-accent-light text-accent font-semibold'
                  : 'text-text-muted hover:text-text-main hover:bg-slate-100/60'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Candidate Workspace</span>
            </Link>
          </nav>

          {/* System API Status Indicator */}
          <div className="flex items-center space-x-2 text-xs border-l border-line pl-3 sm:pl-4">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                healthStatus === 'online'
                  ? 'bg-emerald-500'
                  : healthStatus === 'offline'
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-pulse'
              }`}
              aria-hidden="true"
            />
            <span className="text-[11px] text-text-muted hidden md:inline">
              {healthStatus === 'online'
                ? 'API Online'
                : healthStatus === 'offline'
                ? 'API Disconnected'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
