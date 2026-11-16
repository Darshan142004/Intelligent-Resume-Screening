import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, UserCheck, Check, ArrowRight, Layers, Cpu, ShieldCheck } from 'lucide-react';

export const Home: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Project Introduction Header */}
      <div className="bg-surface border border-line rounded-lg p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="text-[11px] font-medium px-2.5 py-0.5 bg-slate-100 text-text-muted rounded border border-line">
            MCA Minor Project
          </span>
          <span className="text-[11px] font-medium px-2.5 py-0.5 bg-accent-light text-accent rounded border border-accent-border">
            Pure NLP Screening Pipeline
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-main">
          Intelligent Resume Screening and Job Matching System
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-text-muted max-w-3xl leading-relaxed">
          A recruitment management application utilizing Natural Language Processing (NLP) to automate resume information extraction, candidate-to-job matching, and structured skill gap analysis.
        </p>

        {/* Core Stack Specs */}
        <div className="mt-5 pt-4 border-t border-line flex flex-wrap items-center gap-2 text-xs text-text-muted">
          <span className="font-semibold text-text-main text-[11px] mr-1">System Architecture:</span>
          <span className="px-2 py-0.5 bg-app text-text-main rounded border border-line text-[11px]">Python FastAPI</span>
          <span className="px-2 py-0.5 bg-app text-text-main rounded border border-line text-[11px]">PostgreSQL 15</span>
          <span className="px-2 py-0.5 bg-app text-text-main rounded border border-line text-[11px]">React + TypeScript</span>
          <span className="px-2 py-0.5 bg-app text-text-main rounded border border-line text-[11px]">scikit-learn TF-IDF</span>
          <span className="px-2 py-0.5 bg-app text-text-main rounded border border-line text-[11px]">Sentence Transformers (all-MiniLM-L6-v2)</span>
        </div>
      </div>

      {/* Main Two Entry Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* RECRUITER SECTION */}
        <div className="bg-surface rounded-lg border border-line p-6 flex flex-col justify-between hover:border-line-strong transition">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-md bg-accent-light text-accent flex items-center justify-center shrink-0">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-main">Recruiter Workspace</h2>
                <p className="text-xs text-text-muted">Resume screening &amp; candidate ranking</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-text-muted mb-5 leading-relaxed">
              Create structured job requisitions, upload single or bulk resumes, extract verified technical skills, and inspect ranked candidate score breakdowns.
            </p>

            <div className="mb-6 space-y-2 border-t border-line pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-2">
                Available Recruiter Features
              </span>
              <ul className="space-y-2 text-xs text-text-main">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Create &amp; manage job descriptions with required/preferred skills</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Single and bulk resume upload (PDF &amp; DOCX formats)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Automated contact, experience, and skill taxonomy extraction</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Hybrid candidate ranking table with adjustable score thresholds</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Interactive side-by-side skill gap inspection modal</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Permanent job and candidate deletion with safety cascades</span>
                </li>
              </ul>
            </div>
          </div>

          <Link
            to="/recruiter"
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md transition shadow-xs"
          >
            <span>Open Recruiter Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* CANDIDATE SECTION */}
        <div className="bg-surface rounded-lg border border-line p-6 flex flex-col justify-between hover:border-line-strong transition">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-md bg-accent-light text-accent flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-text-main">Candidate Workspace</h2>
                <p className="text-xs text-text-muted">Profile analysis &amp; skill gap evaluation</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-text-muted mb-5 leading-relaxed">
              Upload your resume in evaluation mode to inspect extracted credentials, evaluate match scores across posted roles, and identify skill deficiencies.
            </p>

            <div className="mb-6 space-y-2 border-t border-line pt-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-2">
                Available Candidate Features
              </span>
              <ul className="space-y-2 text-xs text-text-main">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Upload resume and preview extracted profile immediately</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Inspect recognized technical skills, education, and experience</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Candidate profile selector for evaluation and demonstration</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Detailed side-by-side job matching and similarity analysis</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Actionable missing required and preferred skills breakdown</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span>Deterministic NLP match score transparency without black-box AI</span>
                </li>
              </ul>
            </div>
          </div>

          <Link
            to="/candidate"
            className="w-full inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-surface hover:bg-slate-50 text-text-main text-xs font-semibold rounded-md border border-line hover:border-line-strong transition"
          >
            <span>Open Candidate Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* NLP Hybrid Scoring Methodology Overview */}
      <div className="bg-surface rounded-lg border border-line p-6">
        <h3 className="text-sm font-bold text-text-main mb-1">Hybrid Scoring Methodology</h3>
        <p className="text-xs text-text-muted mb-4">
          Candidates are ranked deterministically by combining three complementary NLP scoring dimensions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded bg-app border border-line">
            <div className="flex items-center justify-between font-semibold text-text-main mb-1">
              <span>TF-IDF Frequency</span>
              <span className="font-mono text-accent">25%</span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Lexical cosine similarity capturing exact terminology, keyword density, and token frequencies.
            </p>
          </div>

          <div className="p-3.5 rounded bg-app border border-line">
            <div className="flex items-center justify-between font-semibold text-text-main mb-1">
              <span>Semantic Similarity</span>
              <span className="font-mono text-accent">45%</span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Dense vector embeddings via Sentence Transformers (<code className="text-[10px]">all-MiniLM-L6-v2</code>) capturing semantic context beyond literal words.
            </p>
          </div>

          <div className="p-3.5 rounded bg-app border border-line">
            <div className="flex items-center justify-between font-semibold text-text-main mb-1">
              <span>Skill Overlap Ratio</span>
              <span className="font-mono text-accent">30%</span>
            </div>
            <p className="text-text-muted text-[11px] leading-relaxed">
              Exact coverage ratio of candidate's extracted technical skills against job required and preferred skills.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
