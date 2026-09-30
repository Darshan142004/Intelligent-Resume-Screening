import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, UserCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title & Overview Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-8 mb-8 shadow-md border border-slate-800">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Intelligent Resume Screening and Job Recommendation System
        </h1>
        <p className="mt-2 text-sm text-slate-300 max-w-3xl leading-relaxed">
          An NLP and LLM powered web application featuring TF-IDF baseline matching, Sentence Transformer semantic embeddings, and hybrid candidate scoring algorithms.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">Python FastAPI</span>
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">PostgreSQL</span>
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">React + TypeScript</span>
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">TF-IDF & Embeddings</span>
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded border border-slate-700">Ollama LLM</span>
        </div>
      </div>

      {/* Main Two Section Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* RECRUITER CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg text-blue-700">
                <Briefcase className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">RECRUITER</h2>
                <p className="text-xs text-blue-600 font-semibold">Resume Screening & Candidate Ranking</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Manage job descriptions, process bulk resumes, extract candidate profiles, and generate ranked match lists with skill gap explanations.
            </p>

            <ul className="space-y-2 mb-6 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Create Jobs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Upload Resumes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Bulk Screening</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Rank Candidates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Skill Gap</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Reports</span>
              </li>
            </ul>
          </div>

          <Link
            to="/recruiter"
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <span>Enter Recruiter Section</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* CANDIDATE CARD */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-emerald-100 p-3 rounded-lg text-emerald-700">
                <UserCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">CANDIDATE</h2>
                <p className="text-xs text-emerald-600 font-semibold">Job Recommendation</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Upload your resume, inspect extracted skills and experience, discover matched job roles, and review personalized skill-gap feedback.
            </p>

            <ul className="space-y-2 mb-6 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Upload Resume</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Profile Analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Find Suitable Jobs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Skill Gap</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Recommendations</span>
              </li>
            </ul>
          </div>

          <Link
            to="/candidate"
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            <span>Enter Candidate Section</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
