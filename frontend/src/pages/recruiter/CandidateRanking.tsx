import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Award,
  Briefcase,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Mail,
  Phone,
  ChevronRight,
  X,
  Sliders,
  Check,
  Minus
} from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
  domain?: string;
  required_skills?: { id: number; name: string }[];
  preferred_skills?: { id: number; name: string }[];
}

interface CandidateRankingItem {
  candidate_id: number;
  candidate_name?: string | null;
  candidate_email?: string | null;
  candidate_phone?: string | null;
  job_id: number;
  tfidf_score: number;
  semantic_score: number;
  skill_score: number;
  hybrid_score: number;
  rank: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
  duplicate_count?: number;
}

export const CandidateRanking: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);
  const [rankings, setRankings] = useState<CandidateRankingItem[]>([]);

  const [loadingJobs, setLoadingJobs] = useState<boolean>(true);
  const [loadingRankings, setLoadingRankings] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [activeCandidateDetail, setActiveCandidateDetail] = useState<CandidateRankingItem | null>(null);

  // 1. Fetch available jobs
  useEffect(() => {
    setLoadingJobs(true);
    api.get('/jobs')
      .then((res) => {
        const fetchedJobs: Job[] = res.data || [];
        setJobs(fetchedJobs);

        if (fetchedJobs.length > 0) {
          const matched = fetchedJobs.find((j) => j.id.toString() === initialJobId);
          if (matched) {
            setSelectedJobId(matched.id.toString());
          } else {
            setSelectedJobId(fetchedJobs[0].id.toString());
            setSearchParams({ jobId: fetchedJobs[0].id.toString() }, { replace: true });
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch jobs:', err);
        setErrorMsg('Failed to load job listings from server.');
      })
      .finally(() => setLoadingJobs(false));
  }, []);

  // 2. Fetch rankings whenever selectedJobId changes
  const fetchRankings = (jobId: string) => {
    if (!jobId) {
      setRankings([]);
      return;
    }

    setLoadingRankings(true);
    setErrorMsg('');

    api.get(`/ranking/job/${jobId}`)
      .then((res) => {
        setRankings(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to fetch candidate rankings:', err);
        const detail = err.response?.data?.detail || 'Failed to retrieve candidate rankings.';
        setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
        setRankings([]);
      })
      .finally(() => setLoadingRankings(false));
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchRankings(selectedJobId);
    }
  }, [selectedJobId]);

  const handleJobChange = (newId: string) => {
    setSelectedJobId(newId);
    setSearchParams({ jobId: newId }, { replace: true });
    setActiveCandidateDetail(null);
  };

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id.toString() === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-accent text-white font-bold border-accent';
    if (rank === 2) return 'bg-accent-light text-accent font-semibold border-accent-border';
    if (rank === 3) return 'bg-accent-light text-accent font-medium border-accent-border';
    return 'bg-app text-text-muted border-line';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 0.70) return 'text-status-success bg-status-success-bg border-status-success-border font-bold';
    if (score >= 0.40) return 'text-accent bg-accent-light border-accent-border font-semibold';
    return 'text-text-muted bg-app border-line';
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Job Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-base font-bold text-text-main">Candidate Rankings</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Rankings computed via hybrid TF-IDF lexical matching, Sentence Transformers dense embeddings, and structured skill overlaps
          </p>
        </div>

        {/* Job Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="ranking-job-select" className="text-xs font-semibold text-text-muted whitespace-nowrap">
            Job Requisition:
          </label>
          <select
            id="ranking-job-select"
            value={selectedJobId}
            onChange={(e) => handleJobChange(e.target.value)}
            disabled={loadingJobs}
            className="px-3 py-1.5 border border-line rounded-md text-xs text-text-main bg-white focus:border-accent focus:ring-1 focus:ring-accent outline-none font-medium min-w-[220px]"
          >
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                #{job.id} — {job.title} ({job.company})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fetchRankings(selectedJobId)}
            disabled={loadingRankings || !selectedJobId}
            className="p-1.5 border border-line rounded-md text-text-muted hover:text-text-main hover:bg-app transition disabled:opacity-50"
            title="Refresh candidate rankings"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRankings ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selected Job Overview Strip */}
      {selectedJob && (
        <div className="bg-app border border-line rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-main">{selectedJob.title}</span>
              <span className="text-text-muted">·</span>
              <span className="text-text-muted font-medium">{selectedJob.company}</span>
              {selectedJob.domain && (
                <span className="px-1.5 py-0.2 bg-white text-text-muted rounded border border-line text-[10px]">
                  {selectedJob.domain}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
              <span>Required: {selectedJob.required_skills?.map((s) => s.name).join(', ') || 'None'}</span>
              {selectedJob.preferred_skills && selectedJob.preferred_skills.length > 0 && (
                <span>Preferred: {selectedJob.preferred_skills.map((s) => s.name).join(', ')}</span>
              )}
            </div>
          </div>

          <div className="text-[11px] text-text-muted flex items-center gap-2">
            <span className="font-semibold text-text-main">{rankings.length} Candidates Evaluated</span>
            <span className="text-line-strong">|</span>
            <span>Weights: 25% Lexical · 45% Dense · 30% Skill</span>
          </div>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMsg && (
        <div className="p-3 bg-status-danger-bg text-status-danger border border-status-danger-border rounded-md text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchRankings(selectedJobId)}
            className="text-xs underline hover:no-underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Rankings Content */}
      {loadingRankings ? (
        <div className="text-center py-16 space-y-2">
          <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto opacity-70" />
          <p className="text-xs font-semibold text-text-main">Computing NLP match scores...</p>
          <p className="text-[11px] text-text-muted max-w-sm mx-auto">
            Evaluating TF-IDF lexical frequency, Sentence Transformers dense vectors, and structured skill overlaps.
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg space-y-2">
          <Briefcase className="w-8 h-8 text-text-muted mx-auto opacity-60" />
          <h3 className="text-xs font-bold text-text-main">No Job Postings Found</h3>
          <p className="text-[11px] text-text-muted max-w-sm mx-auto">
            Create a job description first so candidates can be screened and ranked against requirements.
          </p>
          <Link
            to="/recruiter/jobs/create"
            className="inline-block px-3.5 py-1.5 bg-accent text-white text-xs font-semibold rounded-md hover:bg-accent-hover transition shadow-xs mt-2"
          >
            Create Job Requisition
          </Link>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg space-y-2">
          <User className="w-8 h-8 text-text-muted mx-auto opacity-60" />
          <h3 className="text-xs font-bold text-text-main">No Candidates Evaluated</h3>
          <p className="text-[11px] text-text-muted max-w-sm mx-auto">
            Upload candidate resumes to calculate match scores and rank candidates against this job requisition.
          </p>
          <Link
            to="/recruiter/upload"
            className="inline-block px-3.5 py-1.5 bg-accent text-white text-xs font-semibold rounded-md hover:bg-accent-hover transition shadow-xs mt-2"
          >
            Upload Resumes
          </Link>
        </div>
      ) : (
        <div className="border border-line rounded-lg overflow-x-auto bg-surface">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-app text-text-muted border-b border-line font-semibold text-[11px] uppercase tracking-wider">
                <th className="p-3 w-14 text-center">Rank</th>
                <th className="p-3">Candidate</th>
                <th className="p-3 text-center">TF-IDF (25%)</th>
                <th className="p-3 text-center">Semantic (45%)</th>
                <th className="p-3 text-center">Skill Overlap (30%)</th>
                <th className="p-3 text-center bg-accent-light/50 text-accent font-bold">Hybrid Score</th>
                <th className="p-3">Skill Alignment</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rankings.map((item) => {
                const hybridPct = (item.hybrid_score * 100).toFixed(1);
                const tfidfPct = (item.tfidf_score * 100).toFixed(1);
                const semanticPct = (item.semantic_score * 100).toFixed(1);
                const skillPct = (item.skill_score * 100).toFixed(1);

                const isSelected = activeCandidateDetail?.candidate_id === item.candidate_id;

                return (
                  <tr
                    key={item.candidate_id}
                    onClick={() => setActiveCandidateDetail(item)}
                    className={`cursor-pointer transition hover:bg-app/60 ${
                      isSelected ? 'bg-accent-light/30' : ''
                    }`}
                  >
                    {/* Rank */}
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] border font-mono ${getRankBadge(item.rank)}`}>
                        #{item.rank}
                      </span>
                    </td>

                    {/* Candidate Identity & Contact */}
                    <td className="p-3">
                      <div className="font-bold text-text-main text-xs flex items-center gap-1.5 flex-wrap">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <span>{item.candidate_name || `Candidate #${item.candidate_id}`}</span>
                        <span className="font-mono text-[10px] text-text-muted font-normal">#{item.candidate_id}</span>
                        {item.duplicate_count && item.duplicate_count > 1 && (
                          <span
                            title={`${item.duplicate_count} uploads consolidated`}
                            className="text-[10px] px-1.5 py-0.2 bg-accent-light text-accent rounded font-medium border border-accent-border"
                          >
                            {item.duplicate_count} uploads
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted space-y-0.5 mt-0.5">
                        {item.candidate_email && (
                          <div className="flex items-center gap-1 truncate max-w-xs">
                            <Mail className="w-3 h-3 text-text-muted shrink-0" />
                            <span>{item.candidate_email}</span>
                          </div>
                        )}
                        {item.candidate_phone && (
                          <div className="flex items-center gap-1 truncate max-w-xs">
                            <Phone className="w-3 h-3 text-text-muted shrink-0" />
                            <span>{item.candidate_phone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* TF-IDF */}
                    <td className="p-3 text-center">
                      <span className="font-mono font-semibold text-text-main">{tfidfPct}%</span>
                      <div className="w-14 h-1 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-slate-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, item.tfidf_score * 100))}%` }}
                        />
                      </div>
                    </td>

                    {/* Semantic */}
                    <td className="p-3 text-center">
                      <span className="font-mono font-semibold text-text-main">{semanticPct}%</span>
                      <div className="w-14 h-1 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, item.semantic_score * 100))}%` }}
                        />
                      </div>
                    </td>

                    {/* Skill Overlap */}
                    <td className="p-3 text-center">
                      <span className="font-mono font-semibold text-text-main">{skillPct}%</span>
                      <div className="w-14 h-1 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, item.skill_score * 100))}%` }}
                        />
                      </div>
                    </td>

                    {/* Hybrid Score */}
                    <td className="p-3 text-center bg-accent-light/30">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs border font-mono ${getScoreBadge(item.hybrid_score)}`}>
                        {hybridPct}%
                      </span>
                      <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, item.hybrid_score * 100))}%` }}
                        />
                      </div>
                    </td>

                    {/* Skill Overview Badges */}
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-status-success-bg text-status-success border border-status-success-border font-medium">
                          {item.matched_required_skills.length} req met
                        </span>
                        {item.missing_required_skills.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-status-danger-bg text-status-danger border border-status-danger-border font-medium">
                            {item.missing_required_skills.length} req missing
                          </span>
                        )}
                        {item.matched_preferred_skills.length > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-accent-light text-accent border border-accent-border font-medium">
                            +{item.matched_preferred_skills.length} pref
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveCandidateDetail(item);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-accent hover:text-accent-hover bg-accent-light hover:bg-accent-border/40 border border-accent-border rounded transition"
                      >
                        <span>Inspect Gap</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Skill Gap Modal / Detail Drawer */}
      {activeCandidateDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-lg shadow-lg border border-line w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${getRankBadge(activeCandidateDetail.rank)}`}>
                    Rank #{activeCandidateDetail.rank}
                  </span>
                  <h3 className="font-bold text-text-main text-sm sm:text-base">
                    {activeCandidateDetail.candidate_name || `Candidate #${activeCandidateDetail.candidate_id}`}
                  </h3>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  Match analysis for <strong>{selectedJob?.title}</strong> ({selectedJob?.company})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCandidateDetail(null)}
                className="p-1 text-text-muted hover:text-text-main rounded transition"
                aria-label="Close details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-app p-3 rounded border border-line">
              <div>
                <span className="text-text-muted font-semibold block text-[11px]">Candidate ID</span>
                <span className="font-mono text-text-main">#{activeCandidateDetail.candidate_id}</span>
              </div>
              <div>
                <span className="text-text-muted font-semibold block text-[11px]">Email</span>
                <span className="text-text-main truncate block">{activeCandidateDetail.candidate_email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-text-muted font-semibold block text-[11px]">Phone</span>
                <span className="text-text-main">{activeCandidateDetail.candidate_phone || 'N/A'}</span>
              </div>
            </div>

            {/* Score Grid Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <div className="border border-line bg-app p-2.5 rounded">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">TF-IDF Lexical</span>
                <span className="text-sm font-bold text-text-main font-mono">
                  {(activeCandidateDetail.tfidf_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-text-muted block mt-0.5">Weight: 25%</span>
              </div>

              <div className="border border-accent-border bg-accent-light p-2.5 rounded">
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block">Semantic Similarity</span>
                <span className="text-sm font-bold text-accent font-mono">
                  {(activeCandidateDetail.semantic_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-accent block mt-0.5">Weight: 45%</span>
              </div>

              <div className="border border-status-success-border bg-status-success-bg p-2.5 rounded">
                <span className="text-[10px] font-semibold text-status-success uppercase tracking-wider block">Skill Overlap</span>
                <span className="text-sm font-bold text-status-success font-mono">
                  {(activeCandidateDetail.skill_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-status-success block mt-0.5">Weight: 30%</span>
              </div>

              <div className="border border-accent-border bg-accent-light p-2.5 rounded">
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block">Hybrid Composite</span>
                <span className="text-sm font-bold text-accent font-mono">
                  {(activeCandidateDetail.hybrid_score * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] text-accent block mt-0.5">Overall</span>
              </div>
            </div>

            {/* Mathematical Formula Note */}
            <div className="text-[11px] font-mono bg-app text-text-main p-2.5 rounded border border-line leading-relaxed">
              Score = (0.25 × {activeCandidateDetail.tfidf_score.toFixed(4)}) +
              (0.45 × {activeCandidateDetail.semantic_score.toFixed(4)}) +
              (0.30 × {activeCandidateDetail.skill_score.toFixed(4)}) ={' '}
              <strong className="text-text-main">{activeCandidateDetail.hybrid_score.toFixed(4)}</strong>
            </div>

            {/* Four-Quadrant Skill Analysis */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-text-main flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-accent" />
                <span>Skill Alignment &amp; Gap Breakdown</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* 1. Matched Required Skills */}
                <div className="border border-status-success-border bg-status-success-bg/40 rounded p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-status-success text-xs">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Matched Required Skills ({activeCandidateDetail.matched_required_skills.length})</span>
                  </div>
                  {activeCandidateDetail.matched_required_skills.length === 0 ? (
                    <p className="text-text-muted italic text-[11px]">No required skills matched.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {activeCandidateDetail.matched_required_skills.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-status-success-bg text-status-success border border-status-success-border rounded font-medium text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Missing Required Skills */}
                <div className="border border-status-danger-border bg-status-danger-bg/40 rounded p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-status-danger text-xs">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Missing Required Skills ({activeCandidateDetail.missing_required_skills.length})</span>
                  </div>
                  {activeCandidateDetail.missing_required_skills.length === 0 ? (
                    <p className="text-status-success font-medium text-[11px] flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      All required skills matched!
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {activeCandidateDetail.missing_required_skills.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-status-danger-bg text-status-danger border border-status-danger-border rounded font-medium text-[10px]">
                          <Minus className="w-2.5 h-2.5" />
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Matched Preferred Skills */}
                <div className="border border-accent-border bg-accent-light/40 rounded p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-accent text-xs">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>Matched Preferred Skills ({activeCandidateDetail.matched_preferred_skills.length})</span>
                  </div>
                  {activeCandidateDetail.matched_preferred_skills.length === 0 ? (
                    <p className="text-text-muted italic text-[11px]">No preferred skills matched.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {activeCandidateDetail.matched_preferred_skills.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-accent-light text-accent border border-accent-border rounded font-medium text-[10px]">
                          <Check className="w-2.5 h-2.5" />
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Missing Preferred Skills */}
                <div className="border border-line bg-app rounded p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-text-muted text-xs">
                    <Minus className="w-3.5 h-3.5 shrink-0" />
                    <span>Missing Preferred Skills ({activeCandidateDetail.missing_preferred_skills.length})</span>
                  </div>
                  {activeCandidateDetail.missing_preferred_skills.length === 0 ? (
                    <p className="text-text-muted text-[11px]">No preferred skills left missing.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {activeCandidateDetail.missing_preferred_skills.map((s, idx) => (
                        <span key={idx} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white text-text-muted border border-line rounded font-medium text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setActiveCandidateDetail(null)}
                className="px-3.5 py-1.5 bg-app hover:bg-slate-200 text-text-main text-xs font-semibold rounded-md border border-line transition"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
