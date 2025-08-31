import React, { useState } from 'react';
import MediaUpload from './MediaUpload';
import './Dashboard.css';

function Dashboard() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle successful analysis completion
  const handleAnalysisComplete = (data) => {
    setResults(data);
    setLoading(false);
    setError(null);
  };

  // Handle errors during upload or analysis
  const handleError = (errorMsg) => {
    setError(errorMsg);
    setLoading(false);
    setResults(null);
  };

  // Start upload process
  const handleUploadStart = () => {
    setLoading(true);
    setError(null);
    setResults(null);
  };

  // Reset after error
  const handleRetry = () => {
    setError(null);
    setResults(null);
  };

  return (
    <div className="Dashboard">
      <header className="Dashboard-header">
        <h1>Social Media Content Analyzer</h1>
        <p>Upload documents to get engagement suggestions</p>
      </header>
      
      <main className="Dashboard-main">
        <MediaUpload 
          onAnalysisComplete={handleAnalysisComplete}
          onError={handleError}
          onUploadStart={handleUploadStart}
          loading={loading}
        />
        
        {/* Loading indicator */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Analyzing your content...</p>
          </div>
        )}
        
        {/* Error display */}
        {error && (
          <div className="error">
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={handleRetry} className="retry-btn">
              Try Another File
            </button>
          </div>
        )}
        
        {/* Results display */}
        {results && (
          <div className="results">
            <h2>Analysis Results</h2>
            
            <div className="score">
              Engagement Score: <span>{Math.round(results.score)}/100</span>
            </div>
            
            {results.suggestions && results.suggestions.length > 0 ? (
              <div className="suggestions">
                <h3>Suggestions to Improve Engagement:</h3>
                <ul>
                  {results.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="suggestions success">
                <h3>Great job!</h3>
                <p>Your content looks excellent.</p>
              </div>
            )}
            
            {results.originalText && (
              <div className="extracted-text-section">
                <h3>Extracted Text:</h3>
                <div className="text-content">
                  <p>{results.originalText}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;