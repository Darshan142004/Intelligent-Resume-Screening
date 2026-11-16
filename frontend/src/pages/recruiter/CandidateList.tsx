import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Users, User, Award, Filter, Trash2, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface SkillItem {
  id: number;
  name: string;
}

interface Candidate {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  created_at: string;
  duplicate_count?: number;
  skills?: SkillItem[];
}

export const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUniqueOnly, setShowUniqueOnly] = useState<boolean>(true);

  // Deletion modal state
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchCandidates = (unique: boolean) => {
    setLoading(true);
    api.get(`/candidates?unique=${unique}&limit=100`)
      .then((res) => setCandidates(res.data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCandidates(showUniqueOnly);
  }, [showUniqueOnly]);

  const handleDeleteClick = (c: Candidate) => {
    setCandidateToDelete(c);
    setFeedbackMsg(null);
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/candidates/${candidateToDelete.id}`);
      setFeedbackMsg({
        type: 'success',
        text: `Candidate #${candidateToDelete.id} (${candidateToDelete.name || 'Unidentified Profile'}) was permanently deleted successfully.`
      });
      setCandidateToDelete(null);
      fetchCandidates(showUniqueOnly);
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to delete candidate profile.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const totalUploads = candidates.reduce((acc, c) => acc + (c.duplicate_count || 1), 0);

  return (
    <div className="space-y-4">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-base font-bold text-text-main">Extracted Candidate Profiles</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Structured candidate information, verified technical skills, and candidate pool management
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUniqueOnly(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              showUniqueOnly
                ? 'bg-accent text-white shadow-xs'
                : 'bg-white text-text-muted border border-line hover:text-text-main hover:bg-app'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Unique Profiles</span>
          </button>
          <button
            type="button"
            onClick={() => setShowUniqueOnly(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition ${
              !showUniqueOnly
                ? 'bg-accent text-white shadow-xs'
                : 'bg-white text-text-muted border border-line hover:text-text-main hover:bg-app'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>All Uploads</span>
          </button>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMsg && (
        <div
          className={`p-3 rounded-md text-xs font-medium flex items-center justify-between border ${
            feedbackMsg.type === 'success'
              ? 'bg-status-success-bg text-status-success border-status-success-border'
              : 'bg-status-danger-bg text-status-danger border-status-danger-border'
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
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Summary Banner */}
      <div className="bg-app border border-line rounded-lg p-3 text-xs text-text-main flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-main">
            {showUniqueOnly ? 'Consolidated Candidate Pool:' : 'Historical Resume Uploads:'}
          </span>
          <span className="text-text-muted">
            {candidates.length} profiles displayed
            {showUniqueOnly && totalUploads > candidates.length && (
              <span className="text-accent font-medium ml-1">
                (consolidated from {totalUploads} uploads)
              </span>
            )}
          </span>
        </div>
        <span className="text-[11px] text-text-muted">
          Normalized email deduplication active
        </span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-text-muted">Loading candidate list...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-line rounded-lg">
          <Users className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-60" />
          <p className="text-xs font-semibold text-text-main">No Candidate Profiles Found</p>
          <p className="text-[11px] text-text-muted mt-1">
            Upload resumes from the Upload Resumes section to populate candidate profiles.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line rounded-lg bg-surface">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-app text-text-muted border-b border-line font-semibold text-[11px] uppercase tracking-wider">
                <th className="p-3 w-16">ID</th>
                <th className="p-3">Candidate Identity</th>
                <th className="p-3">Contact</th>
                <th className="p-3">Extracted Skills</th>
                <th className="p-3">Qualifications</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {candidates.map((c) => {
                const dupCount = c.duplicate_count || 1;
                const skills = c.skills || [];
                return (
                  <tr key={c.id} className="hover:bg-app/60 transition">
                    {/* ID */}
                    <td className="p-3 font-mono font-bold text-text-muted">#{c.id}</td>

                    {/* Candidate Identity */}
                    <td className="p-3">
                      <div className="font-bold text-text-main text-xs flex items-center gap-1.5 flex-wrap">
                        <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span>{c.name || 'Unidentified'}</span>
                        {dupCount > 1 && (
                          <span
                            title={`${dupCount} resume uploads consolidated into this profile`}
                            className="text-[10px] px-1.5 py-0.2 bg-accent-light text-accent rounded font-medium border border-accent-border"
                          >
                            {dupCount} uploads
                          </span>
                        )}
                        {!c.email && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded font-medium border border-amber-200">
                            No Email
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-text-muted mt-0.5">
                        Extracted: {new Date(c.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-3 space-y-0.5">
                      <div className="text-text-main font-medium">{c.email || '—'}</div>
                      <div className="text-text-muted text-[11px]">{c.phone || '—'}</div>
                    </td>

                    {/* Extracted Skills */}
                    <td className="p-3 max-w-xs">
                      {skills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 5).map((s) => (
                            <span
                              key={s.id}
                              className="px-1.5 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-[10px] font-medium"
                            >
                              {s.name}
                            </span>
                          ))}
                          {skills.length > 5 && (
                            <span className="px-1.5 py-0.5 bg-app text-text-muted border border-line rounded text-[10px] font-medium">
                              +{skills.length - 5}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-text-muted italic">No skills detected</span>
                      )}
                    </td>

                    {/* Qualifications */}
                    <td className="p-3 max-w-xs space-y-1">
                      {c.education && (
                        <div className="truncate text-text-main" title={c.education}>
                          <span className="font-semibold text-text-muted">Edu:</span> {c.education}
                        </div>
                      )}
                      {c.experience && (
                        <div className="truncate text-text-muted text-[11px]" title={c.experience}>
                          <span className="font-semibold text-text-muted">Exp:</span> {c.experience}
                        </div>
                      )}
                      {!c.education && !c.experience && (
                        <span className="text-text-muted text-[11px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/candidate/profile?id=${c.id}`}
                          className="inline-flex items-center gap-1 px-2 py-1 text-text-muted hover:text-text-main hover:bg-app border border-line rounded text-[11px] font-medium transition"
                        >
                          <User className="w-3 h-3 text-text-muted" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/recruiter/ranking"
                          className="inline-flex items-center gap-1 px-2 py-1 text-accent hover:bg-accent-light border border-accent-border rounded text-[11px] font-semibold transition"
                        >
                          <Award className="w-3 h-3 text-accent" />
                          <span>Rank</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(c)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded text-[11px] font-semibold transition"
                          title="Permanently Delete Candidate"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {candidateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4">
          <div className="bg-surface rounded-lg shadow-lg max-w-md w-full border border-line overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h3 className="font-bold text-text-main text-sm flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Permanently Delete Candidate Profile</span>
              </h3>
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
                className="text-text-muted hover:text-text-main p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-text-muted">
              <p>
                Are you sure you want to permanently delete candidate{' '}
                <strong className="text-text-main">
                  #{candidateToDelete.id} ({candidateToDelete.name || 'Unidentified Profile'})
                </strong>
                ?
              </p>

              {candidateToDelete.email && (
                <div className="p-2.5 bg-app rounded border border-line font-mono text-[11px] text-text-main">
                  Email: {candidateToDelete.email}
                </div>
              )}

              <div className="p-3 bg-status-danger-bg border border-status-danger-border rounded text-status-danger space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Permanent Action</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This candidate record, extracted skills, and all associated job match scores will be permanently deleted from the database.
                </p>
              </div>
            </div>

            <div className="p-3 bg-app border-t border-line flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCandidateToDelete(null)}
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
