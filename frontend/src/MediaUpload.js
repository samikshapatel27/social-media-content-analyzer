import React, { useCallback, useState } from 'react';
import axios from 'axios';
import './MediaUpload.css';

// Configuration constants
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPT_ATTRIBUTE = '.pdf,.jpg,.jpeg,.png';

const MediaUpload = ({ 
  onAnalysisComplete, 
  onError, 
  onUploadStart, 
  onProgress, 
  loading 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const fileInputRef = React.createRef();

  // Drag and drop event handlers
  const handleDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  // File selection handlers
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

  // Main file processing function
  const processFile = async (file) => {
    setSelectedFileName(file.name);

    // File validation
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      onError(`Please select a PDF or image file (${ALLOWED_FILE_TYPES.join(', ')})`);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      onError(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
      return;
    }

    onUploadStart();
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      // API call to backend
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      onAnalysisComplete(response.data);
    } catch (error) {
      console.error('Upload error:', error);
      
      // Error handling with specific messages
      let errorMessage = 'Failed to analyze the file. Please try again.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Please try a smaller file.';
      } else if (error.response?.status === 413) {
        errorMessage = 'File too large for the server. Please select a smaller file.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (!navigator.onLine) {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      onError(errorMessage);
    }
  };

  return (
    <div className="file-upload">
      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${loading ? 'disabled' : ''}`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={handleDrop}
      >
        <div className="drop-zone-content">
          <i className="upload-icon">📁</i>
          <p>Drag & drop your file here</p>
          <p className="support-text">Supports PDF and image files (JPEG, PNG)</p>
          <p className="or-text">OR</p>
          <button 
            className="browse-btn"
            onClick={handleBrowseClick}
            disabled={loading}
            type="button"
          >
            Browse files
          </button>
          <input
            ref={fileInputRef}
            id="file-input"
            type="file"
            accept={ACCEPT_ATTRIBUTE}
            onChange={handleFileSelect}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      
      {selectedFileName && !loading && (
        <div className="file-name">
          Selected: <span>{selectedFileName}</span>
        </div>
      )}
    </div>
  );
};

export default MediaUpload;