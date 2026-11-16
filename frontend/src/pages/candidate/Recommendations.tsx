import React from 'react';
import { Link } from 'react-router-dom';
import { Target, ArrowRight, Upload, BrainCircuit, CheckSquare, FileText } from 'lucide-react';

export const Recommendations: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-text-main tracking-tight">Job Match Assessment</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Candidate-to-job matching evaluation powered by deterministic NLP, Sentence Transformers, and skill gap scoring
        </p>
      </div>

      {/* Main Assessment Overview Card */}
      <div className="border border-line rounded-lg p-8 bg-surface text-center max-w-2xl mx-auto">
        <div className="w-12 h-12 bg-app text-accent rounded-lg border border-line flex items-center justify-center mx-auto mb-4">
          <Target className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-text-main mb-2">Job Match &amp; Skill Gap Evaluation</h3>
        <p className="text-sm text-text-muted mb-6 leading-relaxed max-w-lg mx-auto">
          The system evaluates candidate profiles against open job roles using an NLP hybrid scoring model:
          TF-IDF keyword extraction, Sentence Transformers (<code className="bg-app border border-line px-1.5 py-0.5 rounded text-xs text-text-main font-mono">all-MiniLM-L6-v2</code>) semantic similarity, and structured skill-gap analysis.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/candidate/skill-gap"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-[#254665] text-white rounded-md text-sm font-medium transition"
          >
            <span>Open Skill Gap Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/candidate/upload"
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface hover:bg-app text-text-main border border-line rounded-md text-sm font-medium transition"
          >
            <Upload className="w-4 h-4 text-text-muted" />
            <span>Upload New Resume</span>
          </Link>
        </div>
      </div>

      {/* Three Pillars Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <div className="p-4 bg-surface border border-line rounded-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <BrainCircuit className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-semibold text-text-main">Semantic Fit (45%)</h4>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Cosine similarity on 384-dimensional dense embeddings capturing resume responsibilities and domain context.
          </p>
        </div>

        <div className="p-4 bg-surface border border-line rounded-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <CheckSquare className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-semibold text-text-main">Skill Overlap (30%)</h4>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            Exact and aliased technical skill matching prioritizing required qualifications over preferred items.
          </p>
        </div>

        <div className="p-4 bg-surface border border-line rounded-lg">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4 text-accent" />
            <h4 className="text-xs font-semibold text-text-main">Keyword TF-IDF (25%)</h4>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            N-gram lexical overlap identifying frequency-weighted domain terminology between resume and job description.
          </p>
        </div>
      </div>
    </div>
  );
};
