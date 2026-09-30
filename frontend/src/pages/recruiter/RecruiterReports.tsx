import React from 'react';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';

export const RecruiterReports: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Screening & Analytics Reports</h2>
        <p className="text-xs text-slate-500">Generate and export screening summary reports for job openings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Candidate Screening Summary Report</h3>
          </div>
          <p className="text-xs text-slate-600">
            Export a comprehensive breakdown of all applicants, their extracted skills, missing requirements, and hybrid rank scores.
          </p>
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-500 text-xs font-semibold rounded cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Report (Phase 4)</span>
          </button>
        </div>

        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Skill Gap Analysis Report</h3>
          </div>
          <p className="text-xs text-slate-600">
            Export aggregate missing skills across all candidate submissions to analyze talent pool technical gaps.
          </p>
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-500 text-xs font-semibold rounded cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Generate Report (Phase 4)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
