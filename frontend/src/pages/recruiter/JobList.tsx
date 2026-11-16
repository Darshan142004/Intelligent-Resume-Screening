import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Briefcase, PlusCircle, Building, Award, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface Skill {
  id: number;
  name: string;
  category?: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  experience_required?: string;
  education_required?: string;
  domain?: string;
  created_at: string;
  required_skills?: Skill[];
  preferred_skills?: Skill[];
}

export const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Deletion modal & feedback state
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJobs = () => {
    setLoading(true);
    api.get('/jobs')
      .then((res) => setJobs(res.data || []))
      .catch((err) => {
        console.error('Error fetching jobs:', err);
        setFeedbackMsg({ type: 'error', text: 'Failed to load jobs from database.' });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDeleteClick = (job: Job) => {
    setJobToDelete(job);
    setFeedbackMsg(null);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/jobs/${jobToDelete.id}`);
      setFeedbackMsg({
        type: 'success',
        text: `Job #${jobToDelete.id} ("${jobToDelete.title}" at ${jobToDelete.company}) was permanently deleted successfully.`
      });
      setJobToDelete(null);
      fetchJobs();
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to delete job description.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-text-main">Job Requisitions</h2>
            {!loading && (
              <span className="px-2 py-0.5 bg-accent-light text-accent border border-accent-border text-[11px] font-semibold rounded">
                {jobs.length} Active {jobs.length === 1 ? 'Job' : 'Jobs'}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Active job descriptions used for resume screening and candidate ranking
          </p>
        </div>
        <Link
          to="/recruiter/jobs/create"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md transition shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Create New Job</span>
        </Link>
      </div>

      {/* Dismissible Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center justify-between ${
            feedbackMsg.type === 'success'
              ? 'bg-status-success-bg border-status-success-border text-status-success'
              : 'bg-status-danger-bg border-status-danger-border text-status-danger'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-text-muted hover:text-text-main p-0.5 rounded transition"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-text-muted">Loading job descriptions from server...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg">
          <Briefcase className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
          <p className="text-xs font-semibold text-text-main">No Job Requisitions Found</p>
          <p className="text-[11px] text-text-muted mt-1 mb-4">Create your first job posting to begin screening resumes.</p>
          <Link
            to="/recruiter/jobs/create"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white text-xs font-semibold rounded-md hover:bg-accent-hover transition shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Job Requisition</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="border border-line rounded-lg p-4 bg-app hover:bg-white hover:border-line-strong transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-text-main text-sm">{job.title}</h3>
                    <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                      <Building className="w-3 h-3 text-text-muted shrink-0" />
                      <span className="font-medium text-text-main">{job.company}</span>
                      {job.domain && (
                        <span className="px-1.5 py-0.2 bg-white text-text-muted text-[10px] rounded border border-line">
                          {job.domain}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(job)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded text-[11px] font-semibold transition shrink-0"
                    title="Permanently Delete Job"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Delete</span>
                  </button>
                </div>

                <p className="text-xs text-text-muted mt-2.5 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Required Skills */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
                      Required Skills ({job.required_skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {job.required_skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-1.5 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-[10px] font-medium"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferred Skills */}
                {job.preferred_skills && job.preferred_skills.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block mb-1">
                      Preferred Skills ({job.preferred_skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {job.preferred_skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px] font-medium"
                        >
                          {skill.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-line flex items-center justify-between text-[11px] text-text-muted">
                <div className="space-x-3">
                  <span>Exp: {job.experience_required || 'N/A'}</span>
                  <span>Edu: {job.education_required || 'N/A'}</span>
                </div>
                <Link
                  to={`/recruiter/ranking?jobId=${job.id}`}
                  className="inline-flex items-center gap-1 font-semibold text-accent hover:underline transition"
                >
                  <Award className="w-3 h-3" />
                  <span>View Rankings</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-lg shadow-lg max-w-md w-full border border-line overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h3 className="font-bold text-text-main text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Permanently Delete Job Requisition</span>
              </h3>
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="text-text-muted hover:text-text-main p-1 rounded transition"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-text-muted">
              <p>
                Are you sure you want to permanently delete job{' '}
                <strong className="text-text-main">
                  #{jobToDelete.id} — {jobToDelete.title}
                </strong>
                ?
              </p>

              <div className="p-2.5 bg-app rounded border border-line text-[11px] text-text-main space-y-1">
                <div>
                  <span className="font-semibold text-text-muted">Company:</span>{' '}
                  <span className="font-medium">{jobToDelete.company}</span>
                </div>
                {jobToDelete.domain && (
                  <div>
                    <span className="font-semibold text-text-muted">Domain:</span>{' '}
                    <span>{jobToDelete.domain}</span>
                  </div>
                )}
                {jobToDelete.required_skills && jobToDelete.required_skills.length > 0 && (
                  <div>
                    <span className="font-semibold text-text-muted">Required Skills:</span>{' '}
                    <span>{jobToDelete.required_skills.map((s) => s.name).join(', ')}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-status-danger-bg border border-status-danger-border rounded text-status-danger space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Permanent Action</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Deleting this job will permanently remove the job description and all associated candidate matching results. Candidate profiles and global skill vocabulary remain safely preserved.
                </p>
              </div>
            </div>

            <div className="p-3 bg-app border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                disabled={deleting}
                className="px-3 py-1.5 text-xs font-semibold text-text-main hover:bg-white border border-line rounded transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded transition shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
