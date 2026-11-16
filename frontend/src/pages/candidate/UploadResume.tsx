import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Upload,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  User,
  Code,
  BookOpen,
  Briefcase,
  RefreshCw,
  ArrowRight,
  FileUp
} from 'lucide-react';

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
  extraction_status?: string;
  is_updated?: boolean;
}

export const UploadResume: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [candidateProfile, setCandidateProfile] = useState<ExtractedCandidate | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setDuplicateWarning(null);
    }
  };

  const executeUpload = async (forceUpdate: boolean = false) => {
    if (!file) {
      setErrorMsg('Please select your resume file (.pdf or .docx).');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setDuplicateWarning(null);
    setCandidateProfile(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('update_existing', (forceUpdate || updateExisting).toString());

      const res = await api.post('/resumes/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCandidateProfile(res.data);
      setDuplicateWarning(null);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 409) {
        const detail = err.response?.data?.detail || 'A candidate with this email address already exists.';
        setDuplicateWarning(typeof detail === 'string' ? detail : JSON.stringify(detail));
      } else {
        const detail = err.response?.data?.detail || 'Failed to upload and extract candidate resume.';
        setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeUpload(updateExisting);
  };

  const handleConfirmUpdate = () => {
    setUpdateExisting(true);
    executeUpload(true);
  };

  return (
    <div className="max-w-3xl space-y-5">
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-bold text-text-main">Resume Ingestion</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Upload your PDF or DOCX resume to extract contact information, verified technical skills, and employment history
        </p>
      </div>

      {/* Duplicate Profile Detected Warning */}
      {duplicateWarning && (
        <div className="p-4 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-xs text-amber-900">Existing Candidate Profile Detected</h4>
              <p className="text-amber-800 leading-relaxed text-[11px]">{duplicateWarning}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-200">
            <button
              type="button"
              onClick={handleConfirmUpdate}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${uploading ? 'animate-spin' : ''}`} />
              <span>Update Existing Profile</span>
            </button>
            {(() => {
              const idMatch = duplicateWarning.match(/Candidate ID: (\d+)/i);
              const targetUrl = idMatch ? `/candidate/profile?id=${idMatch[1]}` : '/candidate/profile';
              return (
                <Link
                  to={targetUrl}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-50 text-text-main border border-line rounded text-xs font-medium transition"
                >
                  <User className="w-3.5 h-3.5 text-text-muted" />
                  <span>Inspect Existing Profile</span>
                </Link>
              );
            })()}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-status-danger-bg text-status-danger border border-status-danger-border rounded-md text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dropzone */}
        <div className="border border-dashed border-line-strong rounded-lg p-7 bg-app text-center hover:border-accent transition">
          <div className="w-10 h-10 rounded-full bg-accent-light text-accent flex items-center justify-center mx-auto mb-2.5">
            <FileUp className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-text-main mb-1">Select Resume File</p>
          <p className="text-[11px] text-text-muted mb-3">Accepted formats: .pdf, .docx (Max 10MB)</p>

          <input
            type="file"
            accept=".pdf,.docx"
            onChange={handleFileChange}
            className="text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-line file:text-xs file:font-semibold file:bg-white file:text-text-main hover:file:bg-app cursor-pointer"
          />

          {file && (
            <div className="mt-3.5 p-2 bg-white rounded border border-line text-xs text-text-main font-medium inline-block">
              Selected: <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        {/* Update Existing Profile Checkbox */}
        <div className="flex items-center gap-2 px-1">
          <input
            id="update-existing-checkbox"
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            className="w-4 h-4 text-accent rounded border-line focus:ring-accent"
          />
          <label htmlFor="update-existing-checkbox" className="text-xs text-text-muted select-none cursor-pointer">
            Update my existing candidate record if a profile with the same email address already exists
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md shadow-xs transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Extracting Resume...' : updateExisting ? 'Update Profile' : 'Extract & Parse Resume'}</span>
          </button>
        </div>
      </form>

      {/* EXTRACTED PROFILE DISPLAY */}
      {candidateProfile && (
        <div className="border border-line bg-surface rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="font-bold text-text-main text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span>
                {candidateProfile.is_updated || candidateProfile.extraction_status === 'updated'
                  ? 'Candidate Profile Updated'
                  : 'Extracted Profile Summary'}
              </span>
            </h3>
            <div className="flex items-center gap-2">
              {candidateProfile.is_updated && (
                <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-medium border border-amber-200">
                  Updated Existing Record
                </span>
              )}
              <span className="text-[11px] bg-accent-light text-accent px-2.5 py-0.5 rounded font-mono font-medium border border-accent-border">
                Candidate #{candidateProfile.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-app p-3 rounded border border-line">
            <div>
              <span className="font-semibold text-text-muted block text-[11px]">Full Name</span>
              <span className="text-text-main font-medium">{candidateProfile.name || 'Unidentified'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted block text-[11px]">Email</span>
              <span className="text-text-main font-medium">{candidateProfile.email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted block text-[11px]">Phone</span>
              <span className="text-text-main font-medium">{candidateProfile.phone || 'N/A'}</span>
            </div>
          </div>

          {candidateProfile.skills && candidateProfile.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-accent" />
                <span>Extracted Technical Skills ({candidateProfile.skills.length})</span>
              </h4>
              <div className="flex flex-wrap gap-1">
                {candidateProfile.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {candidateProfile.education && (
            <div className="text-xs">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>Education</span>
              </h4>
              <p className="text-text-muted bg-app p-2.5 rounded border border-line leading-relaxed">{candidateProfile.education}</p>
            </div>
          )}

          {candidateProfile.experience && (
            <div className="text-xs">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-accent" />
                <span>Experience</span>
              </h4>
              <p className="text-text-muted bg-app p-2.5 rounded border border-line leading-relaxed">{candidateProfile.experience}</p>
            </div>
          )}

          <div className="pt-2 border-t border-line flex items-center justify-end gap-2 flex-wrap">
            <Link
              to={`/candidate/profile?id=${candidateProfile.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-app text-text-main border border-line rounded-md text-xs font-medium transition"
            >
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span>Inspect Profile</span>
            </Link>
            <Link
              to={`/candidate/skill-gap?candidateId=${candidateProfile.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-md text-xs font-semibold transition shadow-xs"
            >
              <span>Evaluate Match &amp; Skill Gap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
