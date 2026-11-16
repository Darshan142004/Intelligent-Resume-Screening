import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-line bg-surface py-5 mt-auto text-text-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-semibold text-text-main">
            Intelligent Resume Screening and Job Matching System
          </span>
          <span className="mx-2 text-line-strong hidden sm:inline">|</span>
          <span className="text-text-muted">MCA Minor Project</span>
        </div>
        <div className="text-[11px] text-text-muted">
          Python FastAPI · PostgreSQL · React TypeScript · Pure NLP
        </div>
      </div>
    </footer>
  );
};
