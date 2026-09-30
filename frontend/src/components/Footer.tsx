import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p className="font-medium text-slate-300">
          Intelligent Resume Screening and Job Recommendation System Using NLP
        </p>
        <p className="text-xs text-slate-500 mt-1">
          MCA Minor Project &copy; {new Date().getFullYear()} — Built with FastAPI, PostgreSQL, React, TypeScript & Docker
        </p>
      </div>
    </footer>
  );
};
