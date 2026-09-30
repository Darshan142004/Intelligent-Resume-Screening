import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { PlusCircle, ArrowLeft } from 'lucide-react';

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
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const payload = {
        title: formData.title,
        company: formData.company,
        description: formData.description,
        experience_required: formData.experience_required,
        education_required: formData.education_required,
        domain: formData.domain,
        required_skills: formData.required_skills ? formData.required_skills.split(',').map((s) => s.trim()) : [],
        preferred_skills: formData.preferred_skills ? formData.preferred_skills.split(',').map((s) => s.trim()) : [],
      };

      await api.post('/jobs', payload);
      setMessage('Job description created successfully!');
      setTimeout(() => navigate('/recruiter/jobs'), 1000);
    } catch (err: any) {
      console.error(err);
      setMessage('Failed to create job description.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Create Job Description</h2>
          <p className="text-xs text-slate-500">Specify requirements, domain, and skills for automated screening</p>
        </div>
        <button
          onClick={() => navigate('/recruiter/jobs')}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs</span>
        </button>
      </div>

      {message && (
        <div className={`p-3 rounded text-xs font-semibold ${message.includes('success') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              name="company"
              required
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. TechCorp Systems"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Experience Requirements</label>
            <input
              type="text"
              name="experience_required"
              value={formData.experience_required}
              onChange={handleChange}
              placeholder="e.g. 3-5 years"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Education Requirements</label>
            <input
              type="text"
              name="education_required"
              value={formData.education_required}
              onChange={handleChange}
              placeholder="e.g. B.Tech / MCA / M.Tech"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Job Domain</label>
            <input
              type="text"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              placeholder="e.g. Software Engineering / Data Science"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description *</label>
          <textarea
            name="description"
            rows={4}
            required
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of responsibilities, technical tasks, and scope..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required Skills (Comma separated)</label>
            <input
              type="text"
              name="required_skills"
              value={formData.required_skills}
              onChange={handleChange}
              placeholder="Python, FastAPI, PostgreSQL, React, Docker"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Skills (Comma separated)</label>
            <input
              type="text"
              name="preferred_skills"
              value={formData.preferred_skills}
              onChange={handleChange}
              placeholder="PyTorch, Ollama, Redis, Kubernetes"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-sm transition disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{submitting ? 'Creating Job...' : 'Save Job Description'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
