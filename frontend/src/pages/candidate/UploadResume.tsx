import React, { useState } from 'react';
import { api } from '../../services/api';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';

export const UploadResume: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMsg('Please select your resume file (PDF or DOCX).');
      return;
    }

    setUploading(true);
    setMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/resumes/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMsg(`Success: ${res.data.message}`);
    } catch (err: any) {
      console.error(err);
      setMsg('Failed to upload candidate resume.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Upload Your Resume</h2>
        <p className="text-xs text-slate-500">
          Upload your resume in PDF or DOCX format for automatic skill extraction and job matching.
        </p>
      </div>

      {msg && (
        <div className={`p-3 rounded text-xs font-semibold flex items-center gap-2 ${
          msg.includes('Success')
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {msg.includes('Success') ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{msg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-emerald-300 rounded-lg p-8 bg-emerald-50/50 text-center">
          <Upload className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-800 mb-1">Select Resume File</p>
          <p className="text-xs text-slate-500 mb-4">Supported formats: PDF, DOCX, DOC</p>

          <input
            type="file"
            accept=".pdf,.docx,.doc"
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
            <span>{uploading ? 'Processing Resume...' : 'Upload and Analyze Resume'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
