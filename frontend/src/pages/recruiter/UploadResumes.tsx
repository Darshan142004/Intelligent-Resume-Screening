import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle, User, Code, BookOpen, Briefcase } from 'lucide-react';

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
  
  const [singleResult, setSingleResult] = useState<ExtractedCandidate | null>(null);
  const [bulkResult, setBulkResult] = useState<BulkSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    api.get('/jobs')
      .then((res) => {
        setJobs(res.data);
        if (res.data.length > 0) setSelectedJob(res.data[0].id.toString());
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
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Upload & Ingest Resumes</h2>
        <p className="text-xs text-slate-500">
          Support for PDF (.pdf) and Word (.docx). Automatic structured information & skill extraction.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Job Description</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Unassigned / General Pool --</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} ({job.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Upload Mode</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="bulk"
                  checked={uploadMode === 'bulk'}
                  onChange={() => setUploadMode('bulk')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Bulk Upload (Multiple PDF/DOCX)
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={() => setUploadMode('single')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Single Resume Upload
              </label>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-white text-center">
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800 mb-1">
              {uploadMode === 'single' ? 'Select single PDF or DOCX file' : 'Select multiple PDF or DOCX files (Bulk Batch)'}
            </p>
            <p className="text-xs text-slate-500 mb-3">Supported extensions: .pdf, .docx (Max 10MB per file)</p>
            <input
              type="file"
              accept=".pdf,.docx"
              multiple={uploadMode === 'bulk'}
              onChange={handleFileChange}
              className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {files && (
              <p className="text-xs font-semibold text-blue-700 mt-3">
                Selected {files.length} file(s) ready for processing.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md shadow-sm transition disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Processing Resumes...' : 'Run Extraction'}</span>
          </button>
        </div>
      </form>

      {/* SINGLE RESULT DISPLAY */}
      {singleResult && (
        <div className="border border-blue-200 rounded-lg p-5 bg-blue-50/50 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-blue-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Extracted Profile (ID: #{singleResult.id})
            </h3>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-semibold">
              Status: Success
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div><span className="font-semibold text-slate-500">Name:</span> <span className="text-slate-900 font-medium">{singleResult.name || 'N/A'}</span></div>
            <div><span className="font-semibold text-slate-500">Email:</span> <span className="text-slate-900 font-medium">{singleResult.email || 'N/A'}</span></div>
            <div><span className="font-semibold text-slate-500">Phone:</span> <span className="text-slate-900 font-medium">{singleResult.phone || 'N/A'}</span></div>
          </div>

          {singleResult.skills && singleResult.skills.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-1">Extracted Technical Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {singleResult.skills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-200 text-xs font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {singleResult.education && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Education:</span>
              <p className="text-xs text-slate-600 line-clamp-2">{singleResult.education}</p>
            </div>
          )}

          {singleResult.experience && (
            <div>
              <span className="text-xs font-semibold text-slate-700 block">Experience:</span>
              <p className="text-xs text-slate-600 line-clamp-2">{singleResult.experience}</p>
            </div>
          )}
        </div>
      )}

      {/* BULK RESULT DISPLAY */}
      {bulkResult && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
              <span className="text-xs text-slate-500 font-semibold">Total Processed</span>
              <p className="text-xl font-bold text-slate-900">{bulkResult.total_files}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
              <span className="text-xs text-emerald-700 font-semibold">Successful</span>
              <p className="text-xl font-bold text-emerald-800">{bulkResult.successful_files}</p>
            </div>
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-center">
              <span className="text-xs text-rose-700 font-semibold">Failed</span>
              <p className="text-xl font-bold text-rose-800">{bulkResult.failed_files}</p>
            </div>
          </div>

          {bulkResult.errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-rose-900 mb-2">Failed Files Log:</h4>
              <ul className="space-y-1 text-xs text-rose-800">
                {bulkResult.errors.map((errItem, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>{errItem.filename}:</strong> {errItem.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {bulkResult.candidates.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-900">Successfully Ingested Candidates ({bulkResult.candidates.length}):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {bulkResult.candidates.map((cand) => (
                  <div key={cand.id} className="border border-slate-200 rounded-lg p-3 bg-white space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900">{cand.name || 'Unnamed Candidate'}</span>
                      <span className="text-slate-400 text-[10px]">ID #{cand.id}</span>
                    </div>
                    <div className="text-slate-600">
                      <div>{cand.email || 'No email extracted'}</div>
                      <div>{cand.phone || 'No phone extracted'}</div>
                    </div>
                    {cand.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cand.skills.map((s, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
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
