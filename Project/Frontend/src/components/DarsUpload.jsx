import React, { useState } from 'react';
import { uploadDars } from '../services/api';
import './DarsUpload.css';

const DarsUpload = ({ onUploadComplete, onSkip }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedCourses, setUploadedCourses] = useState([]);
  const [fileSizeError, setFileSizeError] = useState(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    setFileSizeError(null);
    
    if (selectedFile) {
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        setError('Please upload a PDF file. Only .pdf files are accepted.');
        setFile(null);
        return;
      }
      
      // Validate file size
      if (selectedFile.size > MAX_FILE_SIZE) {
        setFileSizeError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
        setFile(null);
        return;
      }
      
      // Validate file name
      if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
        setError('File must have a .pdf extension.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file to upload.');
      return;
    }

    // Re-validate before upload
    if (file.type !== 'application/pdf') {
      setError('Invalid file type. Please select a PDF file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileSizeError(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setFileSizeError(null);

      const data = await uploadDars(file);
      
      // Validate response
      if (!data || !data.courses) {
        throw new Error('Invalid response from server. Please try again.');
      }
      
      if (!Array.isArray(data.courses)) {
        throw new Error('Unexpected response format. Please try again.');
      }
      
      setUploadedCourses(data.courses || []);
      
      if (onUploadComplete) {
        onUploadComplete(data.courses || []);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload DARS file. Please check the file and try again.';
      setError(errorMessage);
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="dars-upload">
      <h1 className="screen-title">Upload Your DARS Report</h1>
      <p className="screen-subtitle">
        Upload your DARS PDF to automatically extract your completed courses, or skip to enter courses manually
      </p>

      {error && (
        <div className="error-message" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {fileSizeError && (
        <div className="error-message" role="alert">
          <strong>File Size Error:</strong> {fileSizeError}
        </div>
      )}

      <div className="upload-container">
        <div className="file-input-wrapper">
          <input
            type="file"
            id="dars-file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={uploading}
            className="file-input"
            aria-label="Select DARS PDF file"
          />
          <label htmlFor="dars-file" className="file-label">
            {file ? (
              <span>
                <strong>Selected:</strong> {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              'Click to Choose PDF File'
            )}
          </label>
          <p className="file-hint">Accepted: PDF files only, max 10MB</p>
        </div>

        {file && (
          <button
            className="upload-button"
            onClick={handleUpload}
            disabled={uploading}
            aria-label="Upload and parse DARS file"
          >
            {uploading ? 'Uploading...' : 'Upload & Parse DARS'}
          </button>
        )}
      </div>

      {uploadedCourses.length > 0 && (
        <div className="upload-success" role="status">
          <h3>✓ Successfully parsed {uploadedCourses.length} courses!</h3>
          <div className="courses-preview">
            <p className="preview-label">Sample courses found:</p>
            <div className="courses-list">
              {uploadedCourses.slice(0, 10).map((course, index) => (
                <span key={index} className="course-tag">{course}</span>
              ))}
              {uploadedCourses.length > 10 && (
                <span className="course-tag">... and {uploadedCourses.length - 10} more</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="skip-section">
        <p className="skip-hint">Don't have a DARS report?</p>
        <button
          className="skip-button"
          onClick={handleSkip}
          disabled={uploading}
          aria-label="Skip DARS upload"
        >
          Skip This Step
        </button>
      </div>
    </div>
  );
};

export default DarsUpload;

