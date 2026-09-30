import React from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Upload, User, Sparkles, AlertCircle } from 'lucide-react';

export const CandidateDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Candidate Dashboard</h2>
        <p className="text-xs text-slate-500">
          Upload your resume to receive AI-powered job recommendations and skill gap analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Profile Status</span>
            <User className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">Not Uploaded</p>
          <p className="text-xs text-slate-500 mt-1">Upload resume to create profile</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Recommended Jobs</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">0</p>
          <p className="text-xs text-slate-500 mt-1">Matched open roles</p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold uppercase">Skill Insights</span>
            <AlertCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-slate-900 mt-2">Pending</p>
          <p className="text-xs text-slate-500 mt-1">Gap analysis ready after upload</p>
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
        <h3 className="text-sm font-bold text-slate-900 mb-2">Candidate Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/candidate/upload"
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 hover:border-emerald-500 transition"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Upload Resume</span>
          </Link>
          <Link
            to="/candidate/recommendations"
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 hover:border-emerald-500 transition"
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>View Job Recommendations</span>
          </Link>
          <Link
            to="/candidate/skill-gap"
            className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-md text-sm font-semibold text-slate-800 hover:border-emerald-500 transition"
          >
            <AlertCircle className="w-4 h-4 text-emerald-600" />
            <span>Skill Gap Analysis</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
