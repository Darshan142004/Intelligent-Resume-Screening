import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, User, Code, BookOpen, Briefcase, FileUp } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
}

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
  extraction_status: string;
}

interface BulkError {
  filename: string;
  error: string;
}

interface BulkSummary {
  total_files: number;
  successful_files: number;
  failed_files: number;
  candidates_created: number[];
  candidates: ExtractedCandidate[];
  errors: BulkError[];
}

export const UploadResumes: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('bulk');
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [updateExisting, setUpdateExisting] = useState<boolean>(false);

  const [singleResult, setSingleResult] = useState<ExtractedCandidate | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    api.get('/jobs')
      .then((res) => {
        setJobs(res.data || []);
        if (res.data?.length > 0) setSelectedJob(res.data[0].id.toString());
      })
      .catch((err) => console.error(err));
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(e.target.files);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files || files.length === 0) {
      setErrorMsg('Please select at least one PDF or DOCX file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSingleResult(null);
    setBulkResult(null);

    try {
      const formData = new FormData();
      formData.append('update_existing', updateExisting.toString());

      if (uploadMode === 'single') {
        formData.append('file', files[0]);
        if (selectedJob) formData.append('job_id', selectedJob);

        const res = await api.post('/resumes/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setSingleResult(res.data);
      } else {
        Array.from(files).forEach((f) => formData.append('files', f));
        if (selectedJob) formData.append('job_id', selectedJob);

        const res = await api.post('/resumes/upload/bulk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setBulkResult(res.data);
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail || 'Failed to upload and extract resumes.';
      setErrorMsg(typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-5">
      {/* Page Title */}
      <div className="border-b border-line pb-3">
        <h2 className="text-base font-bold text-text-main">Upload &amp; Screen Resumes</h2>
        <p className="text-xs text-text-muted mt-0.5">
          Process single or batch resumes in PDF (.pdf) and Word (.docx) formats with deterministic information extraction
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-status-danger-bg text-status-danger border border-status-danger-border rounded-md text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="bg-app p-4 border border-line rounded-lg space-y-4">
          {/* Target Job Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1">
              Target Job Requisition
            </label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 border border-line rounded-md text-xs text-text-main bg-white focus:border-accent focus:ring-1 focus:ring-accent outline-none transition"
            >
              <option value="">— Unassigned / General Candidate Pool —</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.company}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-main mb-1.5">Processing Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer select-none">
                <input
                  type="radio"
                  name="uploadMode"
                  value="bulk"
                  checked={uploadMode === 'bulk'}
                  onChange={() => setUploadMode('bulk')}
                  className="text-accent focus:ring-accent"
                />
                <span>Bulk Upload (Multiple PDF / DOCX)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer select-none">
                <input
                  type="radio"
                  name="uploadMode"
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={() => setUploadMode('single')}
                  className="text-accent focus:ring-accent"
                />
                <span>Single Resume File</span>
              </label>
            </div>
          </div>

          {/* File Dropzone */}
          <div className="border border-dashed border-line-strong rounded-lg p-6 bg-white text-center hover:border-accent transition">
            <div className="w-10 h-10 rounded-full bg-accent-light text-accent flex items-center justify-center mx-auto mb-2">
              <FileUp className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-text-main mb-1">
              {uploadMode === 'single' ? 'Select single PDF or DOCX file' : 'Select multiple PDF or DOCX files for batch ingestion'}
            </p>
            <p className="text-[11px] text-text-muted mb-3">Accepted formats: .pdf, .docx (Up to 10MB per file)</p>
            <input
              type="file"
              accept=".pdf,.docx"
              multiple={uploadMode === 'bulk'}
              onChange={handleFileChange}
              className="text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-line file:text-xs file:font-semibold file:bg-app file:text-text-main hover:file:bg-white cursor-pointer"
            />
            {files && files.length > 0 && (
              <p className="text-xs font-semibold text-accent mt-3">
                {files.length} {files.length === 1 ? 'file' : 'files'} selected and ready for extraction.
              </p>
            )}
          </div>
        </div>

        {/* Update Existing Checkbox */}
        <div className="flex items-center gap-2 px-1">
          <input
            id="recruiter-update-existing"
            type="checkbox"
            checked={updateExisting}
            onChange={(e) => setUpdateExisting(e.target.checked)}
            className="w-4 h-4 text-accent rounded border-line focus:ring-accent"
          />
          <label htmlFor="recruiter-update-existing" className="text-xs text-text-muted select-none cursor-pointer">
            Update existing candidate profiles if a resume with the same normalized email address already exists
          </label>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-md shadow-xs transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{uploading ? 'Extracting & Ingesting...' : 'Run Information Extraction'}</span>
          </button>
        </div>
      </form>

      {/* SINGLE RESULT DISPLAY */}
      {singleResult && (
        <div className="border border-line rounded-lg p-5 bg-surface space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="font-bold text-text-main text-xs sm:text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-status-success" />
              <span>Extracted Profile (Candidate #{singleResult.id})</span>
            </h3>
            <span className="text-[11px] bg-status-success-bg text-status-success border border-status-success-border px-2 py-0.5 rounded font-medium">
              Extraction Complete
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="font-semibold text-text-muted block text-[11px]">Name:</span>
              <span className="text-text-main font-medium">{singleResult.name || 'Unidentified'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted block text-[11px]">Email:</span>
              <span className="text-text-main font-medium">{singleResult.email || 'N/A'}</span>
            </div>
            <div>
              <span className="font-semibold text-text-muted block text-[11px]">Phone:</span>
              <span className="text-text-main font-medium">{singleResult.phone || 'N/A'}</span>
            </div>
          </div>

          {singleResult.skills && singleResult.skills.length > 0 && (
            <div className="pt-2 border-t border-line">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-1.5">
                Extracted Technical Skills ({singleResult.skills.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {singleResult.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-accent-light text-accent border border-accent-border rounded text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {singleResult.education && (
            <div className="pt-2 border-t border-line text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-0.5">Education:</span>
              <p className="text-text-muted line-clamp-2 leading-relaxed">{singleResult.education}</p>
            </div>
          )}

          {singleResult.experience && (
            <div className="pt-2 border-t border-line text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted block mb-0.5">Experience:</span>
              <p className="text-text-muted line-clamp-2 leading-relaxed">{singleResult.experience}</p>
            </div>
          )}
        </div>
      )}

      {/* BULK RESULT DISPLAY */}
      {bulkResult && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-app border border-line rounded-lg p-3 text-center">
              <span className="text-[11px] text-text-muted font-medium">Total Files</span>
              <p className="text-xl font-bold text-text-main mt-0.5">{bulkResult.total_files}</p>
            </div>
            <div className="bg-status-success-bg border border-status-success-border rounded-lg p-3 text-center">
              <span className="text-[11px] text-status-success font-medium">Successful</span>
              <p className="text-xl font-bold text-status-success mt-0.5">{bulkResult.successful_files}</p>
            </div>
            <div className="bg-status-danger-bg border border-status-danger-border rounded-lg p-3 text-center">
              <span className="text-[11px] text-status-danger font-medium">Failed</span>
              <p className="text-xl font-bold text-status-danger mt-0.5">{bulkResult.failed_files}</p>
            </div>
          </div>

          {bulkResult.errors.length > 0 && (
            <div className="bg-status-danger-bg border border-status-danger-border rounded-lg p-4">
              <h4 className="text-xs font-bold text-status-danger mb-2">Ingestion Exceptions:</h4>
              <ul className="space-y-1.5 text-xs text-status-danger">
                {bulkResult.errors.map((errItem, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span><strong>{errItem.filename}:</strong> {errItem.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bulkResult.candidates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-text-main">
                Successfully Ingested Candidates ({bulkResult.candidates.length}):
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bulkResult.candidates.map((cand) => (
                  <div key={cand.id} className="border border-line rounded-lg p-3 bg-white space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-text-main">{cand.name || 'Unidentified Profile'}</span>
                      <span className="text-text-muted text-[10px] font-mono">ID #{cand.id}</span>
                    </div>
                    <div className="text-text-muted text-[11px]">
                      <div>{cand.email || 'No email extracted'}</div>
                      <div>{cand.phone || 'No phone extracted'}</div>
                    </div>
                    {cand.skills && cand.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cand.skills.map((s, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 bg-app text-text-main border border-line rounded text-[10px]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
