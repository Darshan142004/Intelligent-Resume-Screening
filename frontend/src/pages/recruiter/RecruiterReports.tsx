import React from 'react';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';

export const RecruiterReports: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-bold text-text-main">Screening &amp; Analytics Reports</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Generate structured screening summary and talent pool skill deficiency reports
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-line rounded-lg p-4 bg-app space-y-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-text-main text-xs sm:text-sm">Candidate Screening Summary Report</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Detailed breakdown of applicants across open positions, featuring extracted skills, missing required capabilities, and hybrid ranking percentiles.
          </p>
          <div className="pt-1">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/80 text-text-muted text-xs font-semibold rounded cursor-not-allowed border border-line"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV (Scheduled Feature)</span>
            </button>
          </div>
        </div>

        <div className="border border-line rounded-lg p-4 bg-app space-y-3">
          <div className="flex items-center space-x-2.5">
            <span className="w-7 h-7 rounded bg-accent-light text-accent flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-text-main text-xs sm:text-sm">Aggregate Skill Gap Analytics</h3>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Macro-level analysis of missing skills across all applicant submissions to evaluate applicant pool technical alignment with job specifications.
          </p>
          <div className="pt-1">
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-200/80 text-text-muted text-xs font-semibold rounded cursor-not-allowed border border-line"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF (Scheduled Feature)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
