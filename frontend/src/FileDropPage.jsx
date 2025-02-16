import { useState, useEffect } from 'react';

function FileDropPage({ onBack }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files[0] || e.target.files[0];
    if (droppedFile && droppedFile.type.startsWith('video/')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please upload a video file');
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('video', file);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch('http://localhost:5000/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        }
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Analysis failed - Server returned an error');
      }
    } catch (err) {
      console.error('Error details:', err);
      setError('Failed to connect to server - Please ensure the backend server is running');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await fetch('http://localhost:5000/health', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
          }
        });
        if (response.ok) {
          setServerStatus('connected');
        } else {
          setServerStatus('error');
        }
      } catch (err) {
        setServerStatus('error');
      }
    };
    
    checkServer();
  }, []);

  return (
    <div className="app-content">
    <div className="home-header">
      <button className="back-button" onClick={onBack}>
        <svg viewBox="0 0 24 24" className="back-icon">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </button>
      <span>Analysis</span>
    </div>

      <div className="file-drop-area" 
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {!file ? (
          <>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileDrop}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" className="file-upload-button">
              Upload Video
            </label>
            <p>or drag and drop here</p>
          </>
        ) : (
          <div className="file-info">
            <p>{file.name}</p>
            <button 
              className="analyze-button"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Analyzing...' : 'Start Analysis'}
            </button>
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      
      {result && (
        <div className="result-card">
          <h3>Analysis Results</h3>
          <p>Average Count: {result.average_count.toFixed(2)}</p>
          <p>Motility Score: {result.motility_score.toFixed(2)}%</p>
          <p>Grade: {result.grade} NFT</p>
          <p className="transaction-hash">
            TX: {result.transaction_hash.slice(0, 10)}...
          </p>
        </div>
      )}

      {serverStatus === 'error' && (
        <div className="error-message">
          Backend server not connected. Please ensure the Python backend is running.
        </div>
      )}
    </div>
  );
}

export default FileDropPage; 