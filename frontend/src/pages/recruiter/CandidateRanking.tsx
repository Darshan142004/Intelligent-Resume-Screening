import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Award, Briefcase, Info } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
}

export const CandidateRanking: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');

  useEffect(() => {
    api.get('/jobs')
      .then((res) => {
        setJobs(res.data);
        if (res.data.length > 0) setSelectedJob(res.data[0].id.toString());
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Candidate Ranking Results</h2>
          <p className="text-xs text-slate-500">
            Compare candidates using TF-IDF baseline, Sentence Transformers semantic score, and Hybrid score
          </p>
        </div>

        <div className="w-full sm:w-72">
          <select
            value={selectedJob}
            onChange={(e) => setSelectedJob(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {jobs.length === 0 ? (
              <option value="">No jobs available</option>
            ) : (
              jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.company})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <span>
          Ranking table will display candidate match scores computed via TF-IDF, Dense Semantic Vectors, and Skill Overlap once the matching pipeline is executed.
        </span>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold">
              <th className="p-3">Rank</th>
              <th className="p-3">Candidate Name</th>
              <th className="p-3">TF-IDF Score</th>
              <th className="p-3">Semantic Score</th>
              <th className="p-3">Skill Score</th>
              <th className="p-3 bg-blue-50 text-blue-900">Hybrid Score</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-500">
                Select a job and upload resumes to populate candidate rankings.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
