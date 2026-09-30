import React from 'react';
import { AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

export const SkillGapAnalysis: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Skill Gap Analysis</h2>
        <p className="text-xs text-slate-500">
          Identify missing technical and domain competencies to improve job matching potential
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-xs text-emerald-900">Matched Skills</h3>
          </div>
          <p className="text-xs text-emerald-800">No data loaded yet.</p>
        </div>

        <div className="border border-rose-200 bg-rose-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-rose-700" />
            <h3 className="font-bold text-xs text-rose-900">Missing Required Skills</h3>
          </div>
          <p className="text-xs text-rose-800">No data loaded yet.</p>
        </div>

        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <h3 className="font-bold text-xs text-amber-900">Recommended Skills to Learn</h3>
          </div>
          <p className="text-xs text-amber-800">No data loaded yet.</p>
        </div>
      </div>
    </div>
  );
};
