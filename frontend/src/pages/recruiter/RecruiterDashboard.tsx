import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Upload, Users, Award, PlusCircle, FileText } from 'lucide-react';

export const RecruiterDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Recruiter Dashboard</h2>
        <p className="text-xs text-slate-500">
          Overview of job postings, uploaded resumes, candidate rankings, and screening metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Active Jobs</span>
            <Briefcase className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Job descriptions created</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Resumes Uploaded</span>
            <Upload className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Single & bulk uploads</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Parsed Profiles</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Extracted candidates</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Screening Reports</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Hybrid matching reports</p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Recruiter Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/recruiter/jobs/create"
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 hover:border-blue-500 transition"
          >
            <PlusCircle className="w-4 h-4 text-blue-600" />
            <span>Create New Job</span>
          </Link>
          <Link
            to="/recruiter/upload"
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 hover:border-blue-500 transition"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Upload Resumes (Bulk)</span>
          </Link>
          <Link
            to="/recruiter/ranking"
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 hover:border-blue-500 transition"
          >
            <Award className="w-4 h-4 text-blue-600" />
            <span>View Candidate Rankings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
