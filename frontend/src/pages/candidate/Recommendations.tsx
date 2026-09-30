import React from 'react';
import { Sparkles, Briefcase, CheckCircle2, AlertCircle } from 'lucide-react';

export const Recommendations: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Job Recommendations</h2>
        <p className="text-xs text-slate-500">
          Personalized job role matches computed using semantic embeddings and skill alignment
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg p-8 bg-slate-50 text-center">
        <Sparkles className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-800 mb-1">No Recommendations Available Yet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
          Please upload your resume to allow our matching engine to score your profile against available job descriptions in the database.
        </p>
      </div>
    </div>
  );
};
