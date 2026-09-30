import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { checkHealth } from '../services/api';
import { FileText, UserCheck, Briefcase, Activity } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [healthStatus, setHealthStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    checkHealth().then((res) => {
      if (res && res.status === 'online') {
        setHealthStatus('online');
      } else {
        setHealthStatus('offline');
      }
    });
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <Link to="/" className="text-lg font-bold tracking-tight text-white hover:text-blue-300 transition">
                ResumeScreening.AI
              </Link>
              <p className="text-xs text-slate-400">MCA Minor Project - NLP & LLM</p>
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-md text-sm font-semibold transition ${
                isActive('/') && !isActive('/recruiter') && !isActive('/candidate')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              HOME
            </Link>
            <Link
              to="/recruiter"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-sm font-semibold transition ${
                isActive('/recruiter')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              <span>RECRUITER</span>
            </Link>
            <Link
              to="/candidate"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-md text-sm font-semibold transition ${
                isActive('/candidate')
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>CANDIDATE</span>
            </Link>
          </nav>

          <div className="flex items-center space-x-2 text-xs border-l border-slate-700 pl-4">
            <Activity className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Backend API:</span>
            {healthStatus === 'online' ? (
              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700 font-medium">
                Online
              </span>
            ) : healthStatus === 'offline' ? (
              <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-700 font-medium">
                Offline
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-700 font-medium">
                Checking...
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
