import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Briefcase,
  User,
  Sliders,
  Check,
  Minus,
  RefreshCw,
  Info,
  ArrowRight
} from 'lucide-react';

interface CandidateOption {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  created_at: string;
}

interface JobOption {
  id: number;
  title: string;
  company: string;
  domain?: string;
  experience_required?: string;
  education_required?: string;
  required_skills?: { id: number; name: string }[];
  preferred_skills?: { id: number; name: string }[];
}

interface ComparisonData {
  candidate_id: number;
  job_id: number;
  candidate: {
    id: number;
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    education?: string | null;
    experience?: string | null;
    skills: string[];
  };
  job: {
    id: number;
    title: string;
    company: string;
    description?: string | null;
    experience_required?: string | null;
    education_required?: string | null;
    domain?: string | null;
    required_skills: string[];
    preferred_skills: string[];
  };
  tfidf_score: number;
  semantic_score: number;
  skill_score: number;
  skill_overlap_score: number;
  hybrid_score: number;
  matched_skills: string[];
  missing_skills: string[];
  matched_required_skills: string[];
  missing_required_skills: string[];
  matched_preferred_skills: string[];
  missing_preferred_skills: string[];
}

export const SkillGapAnalysis: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCandId = searchParams.get('candidateId') || '';
  const initialJobId = searchParams.get('jobId') || '';

  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);

  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(initialCandId);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId);

  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingComparison, setLoadingComparison] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // 1. Fetch available candidates and jobs
  useEffect(() => {
    setLoadingInitial(true);
    Promise.all([
      api.get('/candidates'),
      api.get('/jobs')
    ])
      .then(([candRes, jobRes]) => {
        const fetchedCands: CandidateOption[] = candRes.data || [];
        const fetchedJobs: JobOption[] = jobRes.data || [];

        setCandidates(fetchedCands);
        setJobs(fetchedJobs);

        // Pick initial candidate
        let activeCandId = initialCandId;
        if (!activeCandId && fetchedCands.length > 0) {
          activeCandId = fetchedCands[fetchedCands.length - 1].id.toString();
        }
        setSelectedCandidateId(activeCandId);

        // Pick initial job
        let activeJobId = initialJobId;
        if (!activeJobId && fetchedJobs.length > 0) {
          activeJobId = fetchedJobs[0].id.toString();
        }
        setSelectedJobId(activeJobId);

        if (activeCandId || activeJobId) {
          setSearchParams(
            { candidateId: activeCandId, jobId: activeJobId },
            { replace: true }
          );
        }
      })
      .catch((err) => {
        console.error('Error fetching initial options:', err);
        setErrorMsg('Failed to load candidate profiles or job listings.');
      })
      .finally(() => setLoadingInitial(false));
  }, []);

  // 2. Fetch Comparison whenever candidate or job changes
  const fetchComparison = (candId: string, jobId: string) => {
    if (!candId || !jobId) {
      setComparison(null);
      return;
    }

    setLoadingComparison(true);
    setErrorMsg('');

    api.get(`/analysis/compare/${candId}/${jobId}`)
      .then((res) => {
        setComparison(res.data);
      })
      .catch((err) => {
        console.error('Comparison error:', err);
        const detail = err.response?.data?.detail || 'Failed to compare candidate with job.';
        setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
        setComparison(null);
      })
      .finally(() => setLoadingComparison(false));
  };

  useEffect(() => {
    if (selectedCandidateId && selectedJobId) {
      fetchComparison(selectedCandidateId, selectedJobId);
    }
  }, [selectedCandidateId, selectedJobId]);

  const handleCandidateChange = (candId: string) => {
    setSelectedCandidateId(candId);
    setSearchParams({ candidateId: candId, jobId: selectedJobId }, { replace: true });
  };

  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    setSearchParams({ candidateId: selectedCandidateId, jobId: jobId }, { replace: true });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-bold text-text-main flex items-center gap-2">
          <Sliders className="w-4 h-4 text-accent" />
          <span>Job Match &amp; Skill Gap Analysis</span>
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Side-by-side evaluation of candidate competencies against job descriptions with granular skill gap diagnostic reporting
        </p>
      </div>

      {/* Demo Transparency Banner */}
      <div className="bg-app border border-line rounded-md p-3 text-xs text-text-muted flex items-center justify-between">
        <span>
          <strong className="text-text-main">Evaluation Mode:</strong> Sessionless operation. Switch candidates and jobs below to inspect deterministic NLP matching in real time.
        </span>
      </div>

      {/* Profile & Job Selectors Bar */}
      <div className="bg-surface border border-line rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Candidate Profile Selector */}
          <div>
            <label htmlFor="candidate-select" className="text-xs font-semibold text-text-main flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-accent" />
              <span>Candidate Profile:</span>
            </label>
            <select
              id="candidate-select"
              value={selectedCandidateId}
              onChange={(e) => handleCandidateChange(e.target.value)}
              disabled={loadingInitial || candidates.length === 0}
              className="w-full px-3 py-1.5 border border-line rounded-md text-xs bg-white text-text-main focus:border-accent focus:ring-1 focus:ring-accent outline-none disabled:bg-app"
            >
              {loadingInitial ? (
                <option value="">Loading profiles...</option>
              ) : candidates.length === 0 ? (
                <option value="">No candidate profiles found</option>
              ) : (
                candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} · {c.name || 'Unnamed Candidate'} {c.email ? `(${c.email})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Target Job Selector */}
          <div>
            <label htmlFor="job-select-candidate" className="text-xs font-semibold text-text-main flex items-center gap-1.5 mb-1.5">
              <Briefcase className="w-3.5 h-3.5 text-accent" />
              <span>Target Job Requisition:</span>
            </label>
            <select
              id="job-select-candidate"
              value={selectedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              disabled={loadingInitial || jobs.length === 0}
              className="w-full px-3 py-1.5 border border-line rounded-md text-xs bg-white text-text-main focus:border-accent focus:ring-1 focus:ring-accent outline-none disabled:bg-app"
            >
              {loadingInitial ? (
                <option value="">Loading job requisitions...</option>
              ) : jobs.length === 0 ? (
                <option value="">No jobs available</option>
              ) : (
                jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    #{j.id} · {j.title} · {j.company} {j.domain ? `[${j.domain}]` : ''}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Info Line */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-line text-[11px] text-text-muted">
          <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
          <span>Scores update deterministically based on lexical frequency, Sentence Transformers vectors, and skill vocabulary intersection.</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-3 bg-status-danger-bg border border-status-danger-border rounded-md text-xs text-status-danger flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchComparison(selectedCandidateId, selectedJobId)}
            className="px-2.5 py-1 bg-status-danger text-white rounded text-[11px] font-semibold transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content Rendering */}
      {loadingComparison ? (
        <div className="text-center py-16 space-y-2">
          <RefreshCw className="w-6 h-6 text-accent animate-spin mx-auto opacity-70" />
          <p className="text-xs font-semibold text-text-main">Evaluating candidate-job alignment...</p>
          <p className="text-[11px] text-text-muted max-w-sm mx-auto">
            Computing dense semantic representations and cross-referencing extracted skills against requirements.
          </p>
        </div>
      ) : candidates.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 bg-app text-center space-y-2">
          <User className="w-8 h-8 text-text-muted mx-auto opacity-60" />
          <h3 className="text-xs font-bold text-text-main">No Candidate Profiles Found</h3>
          <p className="text-[11px] text-text-muted max-w-md mx-auto">
            Please upload a resume first to extract skills and evaluate job alignment.
          </p>
          <div className="pt-2">
            <Link
              to="/candidate/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md shadow-xs transition"
            >
              <span>Upload Resume</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-10 bg-app text-center space-y-2">
          <Briefcase className="w-8 h-8 text-text-muted mx-auto opacity-60" />
          <h3 className="text-xs font-bold text-text-main">No Job Requisitions Available</h3>
          <p className="text-[11px] text-text-muted max-w-md mx-auto">
            No job requisitions are currently active in the system database.
          </p>
        </div>
      ) : !comparison ? (
        <div className="border border-line rounded-lg p-8 bg-app text-center text-xs text-text-muted">
          Select a candidate profile and target job to view matching and skill gap analysis.
        </div>
      ) : (
        <div className="space-y-5">
          {/* Side-by-side Context Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Target Job Card */}
            <div className="border border-line rounded-lg p-4 bg-surface space-y-3">
              <div className="flex items-start justify-between border-b border-line pb-2.5">
                <div>
                  <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block">Target Job Requisition</span>
                  <h3 className="font-bold text-text-main text-sm">{comparison.job.title}</h3>
                  <p className="text-xs text-text-muted">{comparison.job.company}</p>
                </div>
                {comparison.job.domain && (
                  <span className="px-2 py-0.5 bg-app text-text-muted border border-line rounded text-[11px]">
                    {comparison.job.domain}
                  </span>
                )}
              </div>

              {comparison.job.description && (
                <p className="text-xs text-text-muted line-clamp-3 bg-app p-2.5 rounded border border-line leading-relaxed">
                  {comparison.job.description}
                </p>
              )}

              <div className="space-y-2 text-xs">
                {comparison.job.required_skills.length > 0 && (
                  <div>
                    <span className="font-semibold text-text-muted block text-[11px] mb-1">
                      Required Skills ({comparison.job.required_skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {comparison.job.required_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-[11px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {comparison.job.preferred_skills.length > 0 && (
                  <div>
                    <span className="font-semibold text-text-muted block text-[11px] mb-1">
                      Preferred Skills ({comparison.job.preferred_skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {comparison.job.preferred_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[11px] font-medium">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Candidate Evaluated Card */}
            <div className="border border-line rounded-lg p-4 bg-surface space-y-3">
              <div className="flex items-start justify-between border-b border-line pb-2.5">
                <div>
                  <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Candidate Evaluated</span>
                  <h3 className="font-bold text-text-main text-sm">
                    {comparison.candidate.name || `Candidate #${comparison.candidate.id}`}
                  </h3>
                  <p className="text-xs text-text-muted">{comparison.candidate.email || 'No email registered'}</p>
                </div>
                <span className="px-2 py-0.5 bg-app text-text-muted border border-line rounded text-[11px] font-mono">
                  Profile #{comparison.candidate.id}
                </span>
              </div>

              {comparison.candidate.skills && comparison.candidate.skills.length > 0 && (
                <div>
                  <span className="font-semibold text-text-muted block text-[11px] mb-1">
                    Extracted Candidate Skills ({comparison.candidate.skills.length}):
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    {comparison.candidate.skills.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-app text-text-main border border-line rounded text-[11px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {comparison.candidate.experience && (
                <div className="text-xs bg-app p-2.5 rounded border border-line">
                  <span className="font-semibold text-text-muted block text-[11px]">Experience Summary:</span>
                  <p className="text-text-muted line-clamp-2 mt-0.5 leading-relaxed">{comparison.candidate.experience}</p>
                </div>
              )}
            </div>
          </div>

          {/* 4 Score Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Hybrid Match Score */}
            <div className="border border-accent-border bg-accent-light/50 rounded-lg p-3.5 text-center">
              <span className="text-[11px] font-bold text-accent uppercase tracking-wider block">Composite Hybrid Score</span>
              <div className="text-2xl font-bold text-accent font-mono my-1">
                {(comparison.hybrid_score * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, comparison.hybrid_score * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-accent block mt-1.5 font-medium">
                Overall Candidate-Job Fit
              </span>
            </div>

            {/* Semantic Score */}
            <div className="border border-line bg-surface rounded-lg p-3.5 text-center">
              <span className="text-[11px] font-semibold text-text-main uppercase tracking-wider block">Semantic Alignment</span>
              <div className="text-2xl font-bold text-text-main font-mono my-1">
                {(comparison.semantic_score * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, comparison.semantic_score * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block mt-1.5">Dense Embeddings (45% wt)</span>
            </div>

            {/* Skill Overlap Score */}
            <div className="border border-line bg-surface rounded-lg p-3.5 text-center">
              <span className="text-[11px] font-semibold text-text-main uppercase tracking-wider block">Skill Overlap Ratio</span>
              <div className="text-2xl font-bold text-text-main font-mono my-1">
                {(comparison.skill_score * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, comparison.skill_score * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block mt-1.5">Taxonomy Coverage (30% wt)</span>
            </div>

            {/* TF-IDF Score */}
            <div className="border border-line bg-surface rounded-lg p-3.5 text-center">
              <span className="text-[11px] font-semibold text-text-main uppercase tracking-wider block">TF-IDF Frequency</span>
              <div className="text-2xl font-bold text-text-main font-mono my-1">
                {(comparison.tfidf_score * 100).toFixed(1)}%
              </div>
              <div className="w-full h-1.5 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-slate-500 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, comparison.tfidf_score * 100))}%` }}
                />
              </div>
              <span className="text-[10px] text-text-muted block mt-1.5">Keyword Cosine (25% wt)</span>
            </div>
          </div>

          {/* Mathematical Weight Explanation */}
          <div className="bg-app border border-line rounded-lg p-3 text-xs text-text-main font-mono text-center">
            Hybrid Match = (0.25 × {comparison.tfidf_score.toFixed(4)}) + (0.45 × {comparison.semantic_score.toFixed(4)}) + (0.30 × {comparison.skill_score.toFixed(4)}) ={' '}
            <strong className="text-text-main font-bold">{comparison.hybrid_score.toFixed(4)}</strong>
          </div>

          {/* Four Quadrants: Detailed Skill Gap Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-text-main flex items-center gap-2">
              <Sliders className="w-4 h-4 text-accent" />
              <span>Technical Skill Gap Diagnostics</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Matched Required Skills */}
              <div className="border border-status-success-border bg-status-success-bg/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-status-success-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-status-success" />
                    <h4 className="font-bold text-xs text-status-success">Matched Required Skills</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-status-success-bg text-status-success border border-status-success-border rounded text-xs font-bold font-mono">
                    {comparison.matched_required_skills.length}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Required competencies satisfied by the candidate's profile:
                </p>
                {comparison.matched_required_skills.length === 0 ? (
                  <p className="text-text-muted italic text-xs py-2">No required skills matched for this requisition.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {comparison.matched_required_skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-status-success border border-status-success-border rounded text-xs font-semibold">
                        <Check className="w-3 h-3 text-status-success" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Missing Required Skills */}
              <div className="border border-status-danger-border bg-status-danger-bg/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-status-danger-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-status-danger" />
                    <h4 className="font-bold text-xs text-status-danger">Missing Required Skills</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-status-danger-bg text-status-danger border border-status-danger-border rounded text-xs font-bold font-mono">
                    {comparison.missing_required_skills.length}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Mandatory qualifications specified by employer that were not identified:
                </p>
                {comparison.missing_required_skills.length === 0 ? (
                  <p className="text-status-success font-semibold text-xs py-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Candidate possesses all required skills for this position.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {comparison.missing_required_skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-status-danger border border-status-danger-border rounded text-xs font-semibold">
                        <Minus className="w-3 h-3 text-status-danger" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Matched Preferred Skills */}
              <div className="border border-accent-border bg-accent-light/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-accent-border pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <h4 className="font-bold text-xs text-accent">Matched Preferred Skills</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-xs font-bold font-mono">
                    {comparison.matched_preferred_skills.length}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Secondary qualifications that provide an advantage:
                </p>
                {comparison.matched_preferred_skills.length === 0 ? (
                  <p className="text-text-muted italic text-xs py-2">No preferred skills matched.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {comparison.matched_preferred_skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-accent border border-accent-border rounded text-xs font-semibold">
                        <Check className="w-3 h-3 text-accent" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Missing Preferred Skills */}
              <div className="border border-line bg-app rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between border-b border-line pb-2">
                  <div className="flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-text-muted" />
                    <h4 className="font-bold text-xs text-text-main">Skills for Career Advancement</h4>
                  </div>
                  <span className="px-2 py-0.5 bg-white text-text-muted border border-line rounded text-xs font-bold font-mono">
                    {comparison.missing_preferred_skills.length}
                  </span>
                </div>
                <p className="text-[11px] text-text-muted">
                  Preferred skills to develop to maximize candidate competitiveness:
                </p>
                {comparison.missing_preferred_skills.length === 0 ? (
                  <p className="text-text-muted text-xs py-2">No preferred skill gaps identified.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {comparison.missing_preferred_skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white text-text-muted border border-line rounded text-xs font-medium">
                        <Minus className="w-3 h-3 text-text-muted" />
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
