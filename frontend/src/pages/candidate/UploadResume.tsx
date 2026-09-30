import React, { useState } from 'react';
import { api } from '../../services/api';
import { Upload, CheckCircle2, AlertCircle, User, Code, BookOpen, Briefcase, FileText } from 'lucide-react';

interface ExtractedCandidate {
  id: number;
  name?: string;
  email?: string;
  phone?: string;
  education?: string;
  experience?: string;
  projects?: string;
  certifications?: string;
  languages?: string;
  skills: string[];
  resume_path?: string;
  created_at: string;
}

export const UploadResume: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [candidateProfile, setCandidateProfile] = useState<ExtractedCandidate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg('Please select your resume file (.pdf or .docx).');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setCandidateProfile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/resumes/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCandidateProfile(res.data);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to upload and extract candidate resume.';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Upload Your Resume</h2>
        <p className="text-xs text-slate-500">
          Upload your PDF or DOCX resume to parse contact information, skills, education, and experience.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-emerald-300 rounded-lg p-8 bg-emerald-50/40 text-center">
          <Upload className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 mb-1">Select Resume File</p>
          <p className="text-xs text-slate-500 mb-4">Supported formats: .pdf, .docx (Max 10MB)</p>

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 transition"
          />

          {file && (
            <div className="mt-4 p-2 bg-white rounded border border-emerald-200 text-xs text-emerald-800 font-semibold inline-block">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md shadow-sm transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Parsing & Extracting Resume...' : 'Analyze Resume'}</span>
          </button>
        </div>
      </form>

      {/* EXTRACTED PROFILE DISPLAY */}
      {candidateProfile && (
        <div className="border border-emerald-200 bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Extracted Profile Summary
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">
              Candidate #{candidateProfile.id}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-md">
            <div>
              <span className="font-semibold text-slate-500 block">Extracted Name</span>
              <span className="text-slate-900 font-bold">{candidateProfile.name || 'Not Detected'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Email Address</span>
              <span className="text-slate-900 font-bold">{candidateProfile.email || 'Not Detected'}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-500 block">Phone Number</span>
              <span className="text-slate-900 font-bold">{candidateProfile.phone || 'Not Detected'}</span>
            </div>
          </div>

          {candidateProfile.skills && candidateProfile.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>Extracted Technical Skills ({candidateProfile.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {candidateProfile.skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidateProfile.education && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Education</span>
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded">{candidateProfile.education}</p>
            </div>
          )}

          {candidateProfile.experience && (
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>Experience</span>
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded">{candidateProfile.experience}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
