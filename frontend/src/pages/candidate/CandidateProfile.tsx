import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { User, BookOpen, Briefcase, Code, FileText, CheckCircle2 } from 'lucide-react';

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
  const [candidate, setCandidate] = useState<CandidateProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get('/candidates')
      .then((res) => {
        if (res.data && res.data.length > 0) {
          // Display latest uploaded candidate profile
          setCandidate(res.data[res.data.length - 1]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Extracted Candidate Profile</h2>
        <p className="text-xs text-slate-500">
          Parsed contact information, extracted skills, education, and professional experience
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-slate-500">Loading candidate profile...</div>
      ) : !candidate ? (
        <div className="border border-slate-200 rounded-lg p-8 bg-slate-50 text-center">
          <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Resume Uploaded Yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload your resume from the Upload Resume page to view your extracted profile.</p>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg p-6 bg-white space-y-4 shadow-sm">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-100 text-emerald-800 p-3 rounded-full">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{candidate.name || 'Candidate Profile'}</h3>
                <p className="text-xs text-slate-500">Ingested on {new Date(candidate.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              ID #{candidate.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-md">
            <div>
              <span className="font-semibold text-slate-500 block">Name</span>
              <span className="text-slate-900 font-bold">{candidate.name || 'Not Extracted'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Email Address</span>
              <span className="text-slate-900 font-bold">{candidate.email || 'Not Extracted'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Phone Number</span>
              <span className="text-slate-900 font-bold">{candidate.phone || 'Not Extracted'}</span>
            </div>
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Extracted Technical Skills ({candidate.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((skill) => (
                  <span key={skill.id} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
                    {skill.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidate.education && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Education</span>
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded">{candidate.education}</p>
            </div>
          )}

          {candidate.experience && (
            <div className="pt-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-1">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Work Experience</span>
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded">{candidate.experience}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
