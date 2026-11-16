import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, User, Briefcase, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const CandidateDashboard: React.FC = () => {
  const [candidateCount, setCandidateCount] = useState<number>(0);
  const [jobCount, setJobCount] = useState<number>(0);
  const [latestCandidate, setLatestCandidate] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.get('/candidates').catch(() => ({ data: [] })),
      api.get('/jobs').catch(() => ({ data: [] }))
    ])
      .then(([candsRes, jobsRes]) => {
        const list = candsRes.data || [];
        setCandidateCount(list.length);
        if (list.length > 0) {
          setLatestCandidate(list[list.length - 1]);
        }
        setJobCount((jobsRes.data || []).length);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-bold text-text-main">Candidate Dashboard</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Ingest your resume to inspect extracted credentials and diagnose skill alignment against open job requisitions
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Profile Status */}
        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Candidate Profile</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <User className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-base font-bold text-text-main mt-2">
            {loading ? (
              <span className="text-text-muted text-xs">Loading...</span>
            ) : candidateCount > 0 ? (
              <span className="text-status-success flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Active ({candidateCount} Ingested)
              </span>
            ) : (
              <span className="text-text-muted text-sm font-medium">No Resume Ingested</span>
            )}
          </div>
          <p className="text-[11px] text-text-muted mt-1 truncate">
            {latestCandidate
              ? `Active: ${latestCandidate.name || 'Candidate #' + latestCandidate.id}`
              : 'Upload a resume to initialize profile'}
          </p>
        </div>

        {/* Available Roles */}
        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Available Roles</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-text-main mt-2">
            {loading ? '—' : jobCount}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Active requisitions available for comparison</p>
        </div>

        {/* Diagnostic Status */}
        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Diagnostic Analysis</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <Sliders className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-sm font-bold text-text-main mt-2">
            {candidateCount > 0 && jobCount > 0 ? (
              <span className="text-accent">Ready to Compare</span>
            ) : (
              <span className="text-text-muted font-normal">Pending Ingestion</span>
            )}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {candidateCount > 0 && jobCount > 0
              ? 'Evaluate fit & missing requirements'
              : 'Upload resume to evaluate job fit'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border border-line rounded-lg p-5 bg-surface">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
          Candidate Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/candidate/upload"
            className="flex items-center justify-between p-3.5 bg-app border border-line rounded-md hover:border-line-strong hover:bg-white transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-main">Upload Resume</p>
                <p className="text-[11px] text-text-muted">Parse PDF or Word document</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition" />
          </Link>

          <Link
            to="/candidate/profile"
            className="flex items-center justify-between p-3.5 bg-app border border-line rounded-md hover:border-line-strong hover:bg-white transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
                <User className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-main">My Profile</p>
                <p className="text-[11px] text-text-muted">Review extracted skills &amp; experience</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition" />
          </Link>

          <Link
            to="/candidate/skill-gap"
            className="flex items-center justify-between p-3.5 bg-app border border-line rounded-md hover:border-line-strong hover:bg-white transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
                <Sliders className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-main">Skill Gap Analysis</p>
                <p className="text-[11px] text-text-muted">Compare against job requirements</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};
