// src/components/DictionaryWidget.js

import React, { useState, useEffect } from 'react';
import { X } from 'react-bootstrap-icons';
import 'bootstrap-icons/font/bootstrap-icons.css';


const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

const chatBoxStyle = {
    position: 'fixed',
    bottom: '90px',
    right: '20px',
    width: '300px',
    backgroundColor: '#2c3e50',
    color: '#f1f1f1',
    borderRadius: '15px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    padding: '15px',
    zIndex: 1000,
    animation: 'slideUp 0.3s ease-out',
  };
  
  

const DictionaryWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [word, setWord] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleBox = () => {
    setIsOpen(!isOpen);
    setWord('');
    setResult(null);
    setError('');
  };

  const fetchDefinition = async () => {
    if (!word.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/api/define', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.results.length === 0) {
          setError(`No definitions found for "${word}".`);
          setResult(null);
        } else {
          setResult(data.results);
          setError(
            data.suggested && data.suggested !== word
              ? `Showing results for "${data.suggested}" instead of "${word}".`
              : ''
          );
        }
      } else {
        setResult(null);
        setError(data.suggestion ? `Did you mean "${data.suggestion}"?` : data.error || 'Word not found.');
      }
    } catch (err) {
      setResult(null);
      setError('Server error. Please try again later.');
    }
  };

  // Add slide-up animation keyframes dynamically
  useEffect(() => {
    const styleSheet = document.styleSheets[0];
    styleSheet.insertRule(`
      @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `, styleSheet.cssRules.length);
  }, []);

  return (
    <div>
      <button
  onClick={toggleBox}
  className="btn btn-primary shadow rounded-circle d-flex flex-column align-items-center justify-content-center"
  style={{
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '70px',
    height: '70px',
    zIndex: 1000,
    transition: '0.3s',
    fontSize: '20px',
    padding: 0,
  }}
  title="Open Dictionary"
>
  <span style={{ fontSize: '28px' }}>📖</span>
  <span className="dictionary-text">Dictionary</span>
</button>


      {isOpen && (
        <div className="chat-box" style={chatBoxStyle}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h5 className="mb-2">Dictionary</h5>
            <X role="button" onClick={toggleBox} />
          </div>

          <input
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="Enter a word"
            className="form-control mb-2"
          />
          <button className="btn btn-primary btn-sm w-100" onClick={fetchDefinition}>
            Search
          </button>

          {error && <p className="text-danger mt-2">{error}</p>}

          {result && (
            <div className="mt-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {result.map((entry, idx) => (
                <div key={idx} className="mb-2">
                  <strong>{entry.partOfSpeech}</strong>: {entry.definition}
                  {entry.example && (
                    <div style={{ fontStyle: 'italic', color: '#555' }}>e.g. {entry.example}</div>
                  )}
                  <hr />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DictionaryWidget;
