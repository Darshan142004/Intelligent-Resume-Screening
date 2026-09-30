import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { Briefcase, PlusCircle, Building } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
  experience_required?: string;
  education_required?: string;
  domain?: string;
  created_at: string;
}

export const JobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/jobs')
      .then((res) => setJobs(res.data))
      .catch((err) => console.error('Error fetching jobs:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Job Descriptions</h2>
          <p className="text-xs text-slate-500">List of all active recruiter job descriptions</p>
        </div>
        <Link
          to="/recruiter/jobs/create"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Job</span>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-8 text-sm text-slate-500">Loading jobs from database...</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-300 rounded-lg">
          <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No Job Descriptions Created Yet</p>
          <p className="text-xs text-slate-500 mt-1 mb-4">Create your first job posting to start screening candidate resumes.</p>
          <Link
            to="/recruiter/jobs/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Job Description</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <div key={job.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-white transition">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{job.title}</h3>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-1">
                    <Building className="w-3.5 h-3.5" />
                    <span>{job.company}</span>
                    {job.domain && <span className="ml-2 px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded">{job.domain}</span>}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3 line-clamp-3">{job.description}</p>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Exp: {job.experience_required || 'N/A'}</span>
                <span>Edu: {job.education_required || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
