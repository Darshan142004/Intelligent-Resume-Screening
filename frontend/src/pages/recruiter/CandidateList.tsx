import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, FileText, UserCheck } from 'lucide-react';

interface Candidate {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  created_at: string;
}

export const CandidateList: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get('/candidates')
      .then((res) => setCandidates(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Extracted Candidate Profiles</h2>
        <p className="text-xs text-slate-500">Structured information extracted from parsed resumes</p>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-slate-500">Loading candidate list...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
          <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Candidate Resumes Processed Yet</p>
          <p className="text-xs text-slate-500 mt-1">Upload resumes from the Upload Resumes section to populate parsed candidate profiles.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
                <th className="p-3">ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Education</th>
                <th className="p-3">Experience</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-mono font-medium">{c.id}</td>
                  <td className="p-3 font-bold text-slate-900">{c.name || 'N/A'}</td>
                  <td className="p-3 text-slate-600">{c.email || 'N/A'}</td>
                  <td className="p-3 text-slate-600">{c.phone || 'N/A'}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{c.education || 'N/A'}</td>
                  <td className="p-3 text-slate-600 max-w-xs truncate">{c.experience || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
