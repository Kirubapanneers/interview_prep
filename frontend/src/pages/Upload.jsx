import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import { documentAPI } from '../services/api';
import { Upload as UploadIcon, FileText, Trash2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Upload() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState({ resume: false, jd: false });
  const [dragActive, setDragActive] = useState({ resume: false, jd: false });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await documentAPI.list();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const hasResume = documents.some(doc => doc.type === 'resume');
  const hasJD = documents.some(doc => doc.type === 'job_description');

  const handleUpload = async (file, type) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setUploading(prev => ({ ...prev, [type === 'resume' ? 'resume' : 'jd']: true }));

    try {
      await documentAPI.upload(formData);
      toast.success(`${type === 'resume' ? 'Resume' : 'Job Description'} uploaded successfully!`);
      await fetchDocuments();
    } catch (error) {
      const message = error.response?.data?.message || 'Upload failed';
      toast.error(message);
    } finally {
      setUploading(prev => ({ ...prev, [type === 'resume' ? 'resume' : 'jd']: false }));
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentAPI.delete(id);
      toast.success('Document deleted');
      await fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(prev => ({ ...prev, [type]: true }));
    } else if (e.type === 'dragleave') {
      setDragActive(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(prev => ({ ...prev, [type]: false }));

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0], type === 'resume' ? 'resume' : 'job_description');
    }
  };

  const startChat = () => {
    if (!hasResume || !hasJD) {
      toast.error('Please upload both resume and job description first');
      return;
    }
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Documents</h1>
          <p className="text-gray-600">Upload your resume and job description to start your interview prep</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Resume Upload */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="w-6 h-6 text-primary-600" />
                <span>Resume</span>
              </h2>
              {hasResume && <CheckCircle className="w-6 h-6 text-green-500" />}
            </div>

            <div
              onDragEnter={(e) => handleDrag(e, 'resume')}
              onDragLeave={(e) => handleDrag(e, 'resume')}
              onDragOver={(e) => handleDrag(e, 'resume')}
              onDrop={(e) => handleDrop(e, 'resume')}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive.resume ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
              } ${hasResume ? 'bg-green-50' : ''}`}
            >
              <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${hasResume ? 'text-green-500' : 'text-gray-400'}`} />
              <p className="text-gray-600 mb-2">
                {hasResume ? 'Resume uploaded! Upload again to replace' : 'Drag and drop your resume here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label className="btn-primary inline-block cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files[0], 'resume')}
                  disabled={uploading.resume}
                />
                {uploading.resume ? 'Uploading...' : 'Choose File'}
              </label>
              <p className="text-xs text-gray-500 mt-2">PDF only, max 2MB</p>
            </div>
          </div>

          {/* Job Description Upload */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center space-x-2">
                <FileText className="w-6 h-6 text-primary-600" />
                <span>Job Description</span>
              </h2>
              {hasJD && <CheckCircle className="w-6 h-6 text-green-500" />}
            </div>

            <div
              onDragEnter={(e) => handleDrag(e, 'jd')}
              onDragLeave={(e) => handleDrag(e, 'jd')}
              onDragOver={(e) => handleDrag(e, 'jd')}
              onDrop={(e) => handleDrop(e, 'jd')}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive.jd ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
              } ${hasJD ? 'bg-green-50' : ''}`}
            >
              <UploadIcon className={`w-12 h-12 mx-auto mb-4 ${hasJD ? 'text-green-500' : 'text-gray-400'}`} />
              <p className="text-gray-600 mb-2">
                {hasJD ? 'Job Description uploaded! Upload again to replace' : 'Drag and drop job description here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <label className="btn-primary inline-block cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => handleUpload(e.target.files[0], 'job_description')}
                  disabled={uploading.jd}
                />
                {uploading.jd ? 'Uploading...' : 'Choose File'}
              </label>
              <p className="text-xs text-gray-500 mt-2">PDF only, max 2MB</p>
            </div>
          </div>
        </div>

        {/* Uploaded Documents List */}
        {documents.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-sm text-gray-500">
                        {doc.type === 'resume' ? 'Resume' : 'Job Description'} • {doc.totalChunks || 1} chunks
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc._id, doc.type)}
                    className="text-red-600 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Start Chat Button */}
        <div className="mt-8 text-center">
          <button
            onClick={startChat}
            disabled={!hasResume || !hasJD}
            className="btn-primary text-lg px-8 py-3"
          >
            {hasResume && hasJD ? 'Start Interview Prep →' : 'Upload Both Documents to Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}