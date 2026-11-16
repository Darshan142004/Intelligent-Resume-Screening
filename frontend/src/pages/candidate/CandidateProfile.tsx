import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { User, BookOpen, Briefcase, Code, ArrowRight } from 'lucide-react';

interface CandidateProfileData {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  projects?: string;
  certifications?: string;
  languages?: string;
  skills: { id: number; name: string; category?: string }[];
  created_at: string;
}

export const CandidateProfile: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = searchParams.get('id');

  const [candidates, setCandidates] = useState<CandidateProfileData[]>([]);
  const [selectedId, setSelectedId] = useState<string>(paramId || '');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    api.get('/candidates')
      .then((res) => {
        const list: CandidateProfileData[] = res.data || [];
        setCandidates(list);
        if (list.length > 0) {
          const matched = list.find((c) => c.id.toString() === paramId);
          if (matched) {
            setSelectedId(matched.id.toString());
          } else {
            const defaultId = list[list.length - 1].id.toString();
            setSelectedId(defaultId);
            setSearchParams({ id: defaultId }, { replace: true });
          }
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    setSearchParams({ id }, { replace: true });
  };

  const candidate = candidates.find((c) => c.id.toString() === selectedId) || null;

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Evaluation Notice */}
      <div className="bg-app border border-line rounded-md p-3 text-xs text-text-muted flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-text-main">Evaluation &amp; Demo Mode:</span> No authentication required. Select an ingested candidate profile to inspect extracted credentials.
        </div>
        <span className="text-[11px] font-mono text-text-muted hidden sm:inline">
          {candidates.length} profiles stored
        </span>
      </div>

      {/* Header and Profile Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-3">
        <div>
          <h2 className="text-base font-bold text-text-main">Extracted Candidate Profile</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Parsed contact information, verified technical skills, education, and professional history
          </p>
        </div>

        {candidates.length > 1 && (
          <div className="w-full sm:w-72">
            <label htmlFor="candidate-selector" className="sr-only">Select Candidate</label>
            <select
              id="candidate-selector"
              value={selectedId}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="w-full px-3 py-1.5 border border-line rounded-md text-xs bg-white text-text-main focus:border-accent focus:ring-1 focus:ring-accent outline-none"
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} · {c.name || 'Candidate'} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-text-muted">Loading candidate profile...</div>
      ) : !candidate ? (
        <div className="border border-dashed border-line rounded-lg p-10 bg-app text-center space-y-2">
          <User className="w-8 h-8 text-text-muted mx-auto opacity-60" />
          <p className="text-xs font-semibold text-text-main">No Candidate Profiles Found</p>
          <p className="text-[11px] text-text-muted">
            Upload your resume to extract and initialize a candidate profile.
          </p>
          <div className="pt-2">
            <Link
              to="/candidate/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent text-white rounded-md text-xs font-semibold hover:bg-accent-hover transition shadow-xs"
            >
              <span>Upload Resume</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="border border-line rounded-lg p-5 bg-surface space-y-4">
          {/* Identity Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-line">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-md bg-accent-light text-accent flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text-main text-sm sm:text-base">
                  {candidate.name || 'Candidate Profile'}
                </h3>
                <p className="text-[11px] text-text-muted">
                  Ingested on {new Date(candidate.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 bg-app text-text-muted border border-line rounded font-medium">
                Candidate ID #{candidate.id}
              </span>
              <Link
                to={`/candidate/skill-gap?candidateId=${candidate.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md transition shadow-xs"
              >
                <span>Evaluate Job Match</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-app p-3 rounded border border-line">
            <div>
              <span className="text-[11px] font-semibold text-text-muted block">Full Name</span>
              <span className="text-text-main font-medium">{candidate.name || 'Not Detected'}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-muted block">Email Address</span>
              <span className="text-text-main font-medium truncate block">{candidate.email || 'Not Detected'}</span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-muted block">Phone Number</span>
              <span className="text-text-main font-medium">{candidate.phone || 'Not Detected'}</span>
            </div>
          </div>

          {/* Technical Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <div className="pt-2 border-t border-line">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-accent" />
                <span>Extracted Technical Skills ({candidate.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {candidate.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-[11px] font-medium"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education && (
            <div className="pt-2 border-t border-line text-xs">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>Education</span>
              </h4>
              <p className="text-text-muted bg-app p-2.5 rounded border border-line leading-relaxed">{candidate.education}</p>
            </div>
          )}

          {/* Work Experience */}
          {candidate.experience && (
            <div className="pt-2 border-t border-line text-xs">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-accent" />
                <span>Work Experience</span>
              </h4>
              <p className="text-text-muted bg-app p-2.5 rounded border border-line leading-relaxed">{candidate.experience}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
