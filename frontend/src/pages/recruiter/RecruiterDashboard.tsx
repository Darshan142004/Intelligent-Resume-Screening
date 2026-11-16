import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Briefcase, Upload, Users, Award, PlusCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RecruiterDashboard: React.FC = () => {
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [candidateCount, setCandidateCount] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.get('/jobs').catch(() => ({ data: [] })),
      api.get('/candidates').catch(() => ({ data: [] })),
    ])
      .then(([jobsRes, candsRes]) => {
        setJobCount(jobsRes.data?.length || 0);
        setCandidateCount(candsRes.data?.length || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-text-main">Recruiter Dashboard</h2>
        <p className="text-xs text-text-muted">
          Overview of job descriptions, parsed candidate profiles, and screening pipeline status
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Active Jobs</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-text-main mt-2">
            {loading ? '—' : jobCount ?? 0}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Job postings in database</p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Candidate Profiles</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-2xl font-bold text-text-main mt-2">
            {loading ? '—' : candidateCount ?? 0}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Extracted candidate profiles</p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Scoring Model</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <Award className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-sm font-bold text-text-main mt-2">Hybrid 3-Way</p>
          <p className="text-[11px] text-text-muted mt-0.5">25% TF-IDF · 45% Dense · 30% Skill</p>
        </div>

        <div className="bg-surface border border-line rounded-lg p-4">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Embeddings</span>
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          </div>
          <p className="text-sm font-bold text-text-main mt-2 truncate" title="all-MiniLM-L6-v2">
            all-MiniLM-L6-v2
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Sentence Transformers (CPU)</p>
        </div>
      </div>

      {/* Recruiter Quick Actions */}
      <div className="border border-line rounded-lg p-5 bg-surface">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
          Recruitment Operations
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/recruiter/jobs/create"
            className="flex items-center justify-between p-3.5 bg-app border border-line rounded-md hover:border-line-strong hover:bg-white transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
                <PlusCircle className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-main">Create Job Requisition</p>
                <p className="text-[11px] text-text-muted">Post a new position with skill specs</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition" />
          </Link>

          <Link
            to="/recruiter/upload"
            className="flex items-center justify-between p-3.5 bg-app border border-line rounded-md hover:border-line-strong hover:bg-white transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-main">Upload Resumes</p>
                <p className="text-[11px] text-text-muted">Single or batch PDF / DOCX files</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition" />
          </Link>

          <Link
            to="/recruiter/ranking"
            className="flex items-center justify-between p-3.5 bg-app border border-line rounded-md hover:border-line-strong hover:bg-white transition group"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center">
                <Award className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-bold text-text-main">Candidate Rankings</p>
                <p className="text-[11px] text-text-muted">Hybrid NLP matches &amp; gap analysis</p>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent transition" />
          </Link>
        </div>
      </div>
    </div>
  );
};
