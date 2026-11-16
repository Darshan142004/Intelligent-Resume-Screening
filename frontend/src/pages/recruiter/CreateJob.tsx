import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { PlusCircle, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react';

export const CreateJob: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    experience_required: '',
    education_required: '',
    domain: '',
    required_skills: '',
    preferred_skills: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        description: formData.description.trim(),
        experience_required: formData.experience_required.trim(),
        education_required: formData.education_required.trim(),
        domain: formData.domain.trim(),
        required_skills: formData.required_skills ? formData.required_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
        preferred_skills: formData.preferred_skills ? formData.preferred_skills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      };

      await api.post('/jobs', payload);
      setFeedback({ type: 'success', message: 'Job requisition created and saved successfully.' });
      setTimeout(() => navigate('/recruiter/jobs'), 800);
    } catch (err: any) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: err.response?.data?.detail || 'Failed to create job requisition. Please verify input fields.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <div>
          <h2 className="text-base font-bold text-text-main">Create Job Requisition</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Specify technical skills, qualifications, and role scope for screening
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/recruiter/jobs')}
          className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition px-2 py-1 rounded hover:bg-app"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-md text-xs font-medium border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-status-success-bg text-status-success border-status-success-border'
              : 'bg-status-danger-bg text-status-danger border-status-danger-border'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Title & Company */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Company / Hiring Entity <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="company"
              required
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. TechCorp Systems"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>
        </div>

        {/* Row 2: Experience, Education, Domain */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">Experience Required</label>
            <input
              type="text"
              name="experience_required"
              value={formData.experience_required}
              onChange={handleChange}
              placeholder="e.g. 3-5 years"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">Education Required</label>
            <input
              type="text"
              name="education_required"
              value={formData.education_required}
              onChange={handleChange}
              placeholder="e.g. B.Tech / MCA / M.Tech"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">Domain</label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="e.g. Software Engineering"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>
        </div>

        {/* Row 3: Description */}
        <div>
          <label className="block text-xs font-semibold text-text-main mb-1">
            Job Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Comprehensive description of responsibilities, technical tasks, and scope..."
            className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
          />
        </div>

        {/* Row 4: Required & Preferred Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Required Technical Skills
            </label>
            <p className="text-[10px] text-text-muted mb-1.5">Comma-separated skills (used for strict overlap ratio)</p>
            <input
              type="text"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleChange}
              placeholder="Python, FastAPI, PostgreSQL, Docker"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Preferred Technical Skills
            </label>
            <p className="text-[10px] text-text-muted mb-1.5">Comma-separated skills (additional scoring bonus)</p>
            <input
              type="text"
              name="preferred_skills"
              value={formData.preferred_skills}
              onChange={handleChange}
              placeholder="PyTorch, Kubernetes, Redis, CI/CD"
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white placeholder-text-muted/60 focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="pt-3 border-t border-line flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/recruiter/jobs')}
            className="px-3.5 py-1.5 border border-line text-xs font-medium text-text-muted hover:text-text-main hover:bg-app rounded-md transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md shadow-xs transition disabled:opacity-50"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{submitting ? 'Creating Requisition...' : 'Save Job Requisition'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
