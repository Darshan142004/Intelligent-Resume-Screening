import React from 'react';
import { User, BookOpen, Briefcase, Code, FileText } from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Extracted Candidate Profile</h2>
        <p className="text-xs text-slate-500">
          Parsed information, technical/soft skills, education, and professional experience
        </p>
      </div>

      <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 space-y-4">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200">
          <div className="bg-emerald-100 text-emerald-800 p-3 rounded-full">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Candidate Profile Shell</h3>
            <p className="text-xs text-slate-500">Upload your resume to extract contact & skill details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500 block">Full Name</span>
            <span className="text-slate-900 font-medium">No profile loaded</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Email Address</span>
            <span className="text-slate-900 font-medium">No profile loaded</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Phone Number</span>
            <span className="text-slate-900 font-medium">No profile loaded</span>
          </div>
          <div>
            <span className="font-semibold text-slate-500 block">Resume File</span>
            <span className="text-slate-900 font-medium">None</span>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
            <Code className="w-4 h-4 text-emerald-600" />
            <span>Extracted Skills</span>
          </h4>
          <p className="text-xs text-slate-500 italic">No skills extracted yet.</p>
        </div>

        <div className="pt-2">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Education</span>
          </h4>
          <p className="text-xs text-slate-500 italic">No education records extracted yet.</p>
        </div>

        <div className="pt-2">
          <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 mb-2">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Experience</span>
          </h4>
          <p className="text-xs text-slate-500 italic">No work experience extracted yet.</p>
        </div>
      </div>
    </div>
  );
};
