import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface Job {
  id: number;
  title: string;
  company: string;
}

export const UploadResumes: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('bulk');
  const [files, setFiles] = useState<FileList | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    api.get('/jobs')
      .then((res) => {
        setJobs(res.data);
        if (res.data.length > 0) {
          setSelectedJob(res.data[0].id.toString());
        }
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
      setStatusMsg('Please select at least one PDF or DOCX resume.');
      return;
    }

    setUploading(true);
    setStatusMsg('');

    try {
      const formData = new FormData();
      if (uploadMode === 'single') {
        formData.append('file', files[0]);
        if (selectedJob) formData.append('job_id', selectedJob);
        const res = await api.post('/resumes/upload/single', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setStatusMsg(`Success: ${res.data.message}`);
      } else {
        Array.from(files).forEach((f) => formData.append('files', f));
        if (selectedJob) formData.append('job_id', selectedJob);
        const res = await api.post('/resumes/upload/bulk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setStatusMsg(`Success: ${res.data.message}`);
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg('Error submitting files to backend shell.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Upload Candidate Resumes</h2>
        <p className="text-xs text-slate-500">
          Supports PDF and DOCX formats. Process single or bulk candidate submissions (up to 100 resumes).
        </p>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded text-xs font-semibold flex items-center gap-2 ${
          statusMsg.includes('Success')
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {statusMsg.includes('Success') ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{statusMsg}</span>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Target Job Description</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Unassigned / General Upload --</option>
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
                  value="single"
                  checked={uploadMode === 'single'}
                  onChange={() => setUploadMode('single')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Single Resume Upload
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-800 font-medium cursor-pointer">
                <input
                  type="radio"
                  name="uploadMode"
                  value="bulk"
                  checked={uploadMode === 'bulk'}
                  onChange={() => setUploadMode('bulk')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                Bulk Resumes Upload (Multiple Files)
              </label>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 bg-white text-center">
            <Upload className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-800 mb-1">
              {uploadMode === 'single' ? 'Select single PDF or DOCX file' : 'Select multiple PDF or DOCX files'}
            </p>
            <p className="text-xs text-slate-500 mb-3">PDF, DOCX, DOC files supported</p>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              multiple={uploadMode === 'bulk'}
              onChange={handleFileChange}
              className="text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {files && (
              <p className="text-xs font-semibold text-blue-700 mt-3">
                Selected {files.length} file(s) for upload.
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
            <span>{uploading ? 'Uploading...' : 'Process Upload'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
