import React, { useState, useEffect } from 'react';
import { Container, Button, Form, Spinner, Alert } from 'react-bootstrap';
import { useDarkMode } from './App';
import DictionaryWidget from './components/DictionaryWidget';
import ChatBox from './components/ChatBox';
import TextToVoice from './components/TextToVoice';
import { summarizeFile, fetchSummaries, fetchPaperHistory, downloadSummary, deleteSummary } from './api';
import { FaHistory, FaClipboard, FaFileUpload, FaCheck, FaDownload, FaComments, FaTrash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const MAX_FILE_SIZE = 3 * 1024 * 1024;

const SummarizePage = () => {
  const darkMode = useDarkMode();
  const mutedColor = darkMode ? '#aaa' : '#6c757d';
  const navigate = useNavigate();

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);
  const [error, setError] = useState('');
  const [summaryLength, setSummaryLength] = useState('medium');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [copiedText, setCopiedText] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [currentPaperId, setCurrentPaperId] = useState(null);

  const colors = (darkMode) => ({
    primary: darkMode ? '#4d8bf5' : '#3a6fc9',
    secondary: darkMode ? '#e0e0e0' : '#1e2b3c',
    lightBg: darkMode ? '#1e2b3c' : '#f9f9f9',
    textDark: darkMode ? '#f5f5f5' : '#222',
    cardBg: darkMode ? '#24344e' : '#ffffff',
    sidebarBg: darkMode ? '#1e2b3c' : '#f8f9fa',
    borderColor: darkMode ? '#334a66' : '#e0e0e0',
    hoverBg: darkMode ? '#2a3e5c' : '#f0f0f0',
    buttonText: darkMode ? '#ffffff' : '#ffffff',
  });

  const fetchHistory = async () => {
    try {
      const summaries = await fetchSummaries();
      const items = summaries.map((item) => ({
        id: item._id,
        paper_id: item.paper_id,
        name: item.title || item.filename || 'Untitled',
        date: item.created_at ? new Date(item.created_at).toLocaleString() : 'Unknown Date',
        summary: item.summary || 'No summary',
        advantages: item.advantages || [],
        disadvantages: item.disadvantages || [],
        insights: item.insights || [],
        chat_history: item.chat_history || [],
      }));
      console.log('Fetched History Items:', items);
      setHistoryItems(items);
    } catch (error) {
      console.error('Failed to load history:', error);
      setError('Failed to load history. Please try again.');
      if (error.message.includes('401')) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [navigate]);

  const handleHistoryItemClick = async (item) => {
    console.log('Selected History Item:', item);
    try {
      const historyData = await fetchPaperHistory(item.paper_id);
      setSelectedHistoryItem({
        ...item,
        summary: historyData.summary,
        advantages: historyData.advantages || [],
        disadvantages: historyData.disadvantages || [],
        insights: historyData.insights || [],
        chat_history: historyData.chat_history || [],
      });
      setSummaryResult({
        summary: historyData.summary,
        advantages: historyData.advantages || [],
        disadvantages: historyData.disadvantages || [],
        insights: historyData.insights || [],
      });
      setError('');
      setFile(null);
      setFileName('');
      setTitle('');
      setFileUploaded(false);
      setCurrentPaperId(item.paper_id);
    } catch (error) {
      setError('Failed to load history item details.');
      if (error.message.includes('401')) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    }
  };

  const handleDeleteHistoryItem = async (id) => {
    try {
      await deleteSummary(id);
      setHistoryItems((prev) => prev.filter((item) => item.id !== id));
      if (selectedHistoryItem && selectedHistoryItem.id === id) {
        setSelectedHistoryItem(null);
        setSummaryResult(null);
        setCurrentPaperId(null);
      }
    } catch (error) {
      setError('Failed to delete history item');
      if (error.message.includes('401')) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    }
  };

  const handleDownloadSummary = async () => {
    try {
      const blob = await downloadSummary(summaryResult.summary);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'research_summary.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download summary');
      if (error.message.includes('401')) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.size > MAX_FILE_SIZE) {
        setError('File size is more than 3MB');
        return;
      }
      setFileName(droppedFile.name);
      setFile(droppedFile);
      setTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      setSummaryResult(null);
      setError('');
      setFileUploaded(true);
      setSelectedHistoryItem(null);
      setCurrentPaperId(null);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Unsupported file type. Please upload a PDF or Word document.');
      return;
    }
    setFileName(selectedFile.name);
    setFile(selectedFile);
    setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    setSummaryResult(null);
    setError('');
    setFileUploaded(true);
    setSelectedHistoryItem(null);
    setCurrentPaperId(null);
  };

  const handleSummarize = async () => {
    if (!file || !title) {
      setError('Please upload a file and provide a title.');
      return;
    }
    setLoading(true);
    setError('');
    setSummaryResult(null);

    try {
      const summaryResponse = await summarizeFile(file, summaryLength, title);
      const paperId = summaryResponse.paper_id;
      const newItem = {
        id: summaryResponse._id,
        paper_id: paperId,
        name: title,
        date: new Date(summaryResponse.created_at).toLocaleString(),
        summary: summaryResponse.summary,
        advantages: summaryResponse.advantages || [],
        disadvantages: summaryResponse.disadvantages || [],
        insights: summaryResponse.insights || [],
        chat_history: summaryResponse.chat_history || [],
      };
      setHistoryItems((prev) => [newItem, ...prev]);
      setSummaryResult({
        summary: summaryResponse.summary,
        advantages: summaryResponse.advantages || [],
        disadvantages: summaryResponse.disadvantages || [],
        insights: summaryResponse.insights || [],
      });
      setCurrentPaperId(paperId);
      setSelectedHistoryItem(newItem);
    } catch (error) {
      setError('Could not connect to the server: ' + (error.message || 'Unknown error'));
      if (error.message.includes('401')) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSummaryLengthChange = (length) => {
    setSummaryLength(length);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const handleNewMessage = (newQandA) => {
    setHistoryItems((prev) =>
      prev.map((item) =>
        item.paper_id === currentPaperId
          ? { ...item, chat_history: [...item.chat_history, newQandA] }
          : item
      )
    );
    if (selectedHistoryItem && selectedHistoryItem.paper_id === currentPaperId) {
      setSelectedHistoryItem((prev) => ({
        ...prev,
        chat_history: [...prev.chat_history, newQandA],
      }));
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors(darkMode).lightBg }}>
      {showHistory && (
        <div
          style={{
            width: '280px',
            background: colors(darkMode).sidebarBg,
            padding: '1.5rem 1rem',
            paddingTop: '2rem',
            borderRight: `1px solid ${colors(darkMode).borderColor}`,
            height: 'calc(100vh - 60px)',
            overflowY: 'auto',
            boxShadow: darkMode ? '1px 0 5px rgba(0,0,0,0.2)' : 'none',
            position: 'fixed',
            top: '67px',
            left: 0,
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
            <FaHistory style={{ marginRight: '0.5rem', color: colors(darkMode).primary }} />
            <h5 style={{ color: colors(darkMode).textDark, margin: 0, fontWeight: '600' }}>
              History
            </h5>
          </div>
          {historyItems.length === 0 ? (
            <p style={{ color: mutedColor, fontSize: '0.9rem', textAlign: 'center', marginTop: '2rem' }}>
              No history yet
            </p>
          ) : (
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {historyItems.map((item, index) => (
                <li
                  key={item.id}
                  style={{
                    borderBottom: `1px solid ${colors(darkMode).borderColor}`,
                    padding: '0.75rem 0.5rem',
                    borderRadius: '4px',
                    marginBottom: '0.5rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    backgroundColor:
                      selectedHistoryItem?.id === item.id
                        ? colors(darkMode).primary
                        : index === 0
                        ? colors(darkMode).hoverBg
                        : 'transparent',
                    color:
                      selectedHistoryItem?.id === item.id
                        ? colors(darkMode).buttonText
                        : colors(darkMode).textDark,
                  }}
                  onClick={() => handleHistoryItemClick(item)}
                  onMouseEnter={(e) =>
                    selectedHistoryItem?.id !== item.id &&
                    (e.currentTarget.style.backgroundColor = colors(darkMode).hoverBg)
                  }
                  onMouseLeave={(e) =>
                    selectedHistoryItem?.id !== item.id &&
                    (e.currentTarget.style.backgroundColor = index === 0 ? colors(darkMode).hoverBg : 'transparent')
                  }
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div
                        style={{
                          fontWeight: '500',
                          fontSize: '0.95rem',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ color: mutedColor, fontSize: '0.8rem', marginTop: '0.25rem' }}>
                        {item.date}
                        {item.chat_history.length > 0 && (
                          <span style={{ marginLeft: '0.5rem' }}>
                            <FaComments size={12} /> {item.chat_history.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteHistoryItem(item.id);
                      }}
                      style={{
                        color:
                          selectedHistoryItem?.id === item.id
                            ? colors(darkMode).buttonText
                            : mutedColor,
                        padding: '0.25rem',
                        fontSize: '0.8rem',
                      }}
                      aria-label={`Delete ${item.name} summary`}
                      title="Delete this summary"
                    >
                      <FaTrash size={12} />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div
        style={{
          flex: 1,
          padding: '2rem',
          overflowY: 'auto',
          marginLeft: showHistory ? '280px' : '0',
        }}
      >
        <Container className="py-4" style={{ maxWidth: '900px' }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 style={{ color: colors(darkMode).textDark, fontWeight: '700' }}>
              Research Summarizer
            </h2>
            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline-secondary"
              size="sm"
              style={{
                borderColor: colors(darkMode).borderColor,
                color: colors(darkMode).textDark,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaHistory size={14} /> {showHistory ? 'Hide History' : 'Show History'}
            </Button>
          </div>

          <p style={{ color: mutedColor, marginBottom: '2rem', fontSize: '1.1rem' }}>
            Upload your paper and get a concise summary with key advantages and limitations, or select a previous upload from history to view its summary and Q&A.
          </p>

          {!selectedHistoryItem && (
            <>
              <div
                className={`border rounded p-5 mb-4 text-center`}
                style={{
                  borderStyle: isDragging ? 'solid' : 'dashed',
                  borderWidth: isDragging ? '2px' : '1px',
                  borderColor: isDragging ? colors(darkMode).primary : colors(darkMode).borderColor,
                  backgroundColor: darkMode ? colors(darkMode).cardBg : '#ffffff',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Form.Group controlId="formFile" className="mb-3">
                  <div style={{ marginBottom: '1.5rem' }}>
                    <FaFileUpload size={48} style={{ color: colors(darkMode).primary, opacity: 0.8 }} />
                  </div>
                  <p className="fw-bold mb-3" style={{ color: colors(darkMode).textDark, fontSize: '1.2rem' }}>
                    Drag and drop your file here
                  </p>
                  <p style={{ color: mutedColor }} className="mb-3">
                    or
                  </p>
                  <Form.Label
                    className="btn"
                    style={{
                      backgroundColor: colors(darkMode).primary,
                      color: colors(darkMode).buttonText,
                      padding: '0.5rem 1.5rem',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                    onMouseOver={(e) => (e.target.style.opacity = 0.9)}
                    onMouseOut={(e) => (e.target.style.opacity = 1)}
                    aria-label="Browse files to upload"
                  >
                    Browse Files
                    <Form.Control
                      type="file"
                      accept=".pdf,.doc,.docx"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Form.Label>
                  <p style={{ color: mutedColor, fontSize: '0.875rem', marginTop: '1rem' }}>
                    Supported formats: PDF, DOC, DOCX
                  </p>
                </Form.Group>
              </div>

              {fileName && (
                <Form.Group className="mb-4">
                  <Form.Label style={{ color: colors(darkMode).textDark }}>
                    Title
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter paper title"
                    style={{
                      backgroundColor: darkMode ? '#2d3748' : '#fff',
                      color: colors(darkMode).textDark,
                      borderColor: colors(darkMode).borderColor,
                    }}
                  />
                </Form.Group>
              )}
            </>
          )}

          {fileName && !selectedHistoryItem && (
            <div
              className="alert"
              style={{
                backgroundColor: darkMode ? '#2d3748' : '#e9f5f9',
                color: darkMode ? '#e2e8f0' : '#2a4365',
                border: 'none',
                borderLeft: `4px solid ${colors(darkMode).primary}`,
                borderRadius: '4px',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.25rem',
              }}
            >
              <FaCheck style={{ marginRight: '0.75rem', color: '#48bb78' }} />
              <div>
                <strong>Ready to summarize:</strong> {fileName}
              </div>
            </div>
          )}

          {fileUploaded && !selectedHistoryItem && (
            <div className="mb-4 text-center" style={{ marginTop: '2rem' }}>
              <div style={{ marginBottom: '1rem', color: colors(darkMode).textDark }}>
                Select summary length:
              </div>
              <div className="d-flex justify-content-center gap-2">
                <Button
                  variant={summaryLength === 'short' ? 'primary' : 'outline-secondary'}
                  style={{
                    backgroundColor: summaryLength === 'short' ? colors(darkMode).primary : 'transparent',
                    borderColor: summaryLength === 'short' ? colors(darkMode).primary : colors(darkMode).borderColor,
                    color: summaryLength === 'short' ? colors(darkMode).buttonText : colors(darkMode).textDark,
                    minWidth: '100px',
                  }}
                  onClick={() => handleSummaryLengthChange('short')}
                >
                  Short
                </Button>
                <Button
                  variant={summaryLength === 'medium' ? 'primary' : 'outline-secondary'}
                  style={{
                    backgroundColor: summaryLength === 'medium' ? colors(darkMode).primary : 'transparent',
                    borderColor: summaryLength === 'medium' ? colors(darkMode).primary : colors(darkMode).borderColor,
                    color: summaryLength === 'medium' ? colors(darkMode).buttonText : colors(darkMode).textDark,
                    minWidth: '100px',
                  }}
                  onClick={() => handleSummaryLengthChange('medium')}
                >
                  Medium
                </Button>
                <Button
                  variant={summaryLength === 'long' ? 'primary' : 'outline-secondary'}
                  style={{
                    backgroundColor: summaryLength === 'long' ? colors(darkMode).primary : 'transparent',
                    borderColor: summaryLength === 'long' ? colors(darkMode).primary : colors(darkMode).borderColor,
                    color: summaryLength === 'long' ? colors(darkMode).buttonText : colors(darkMode).textDark,
                    minWidth: '100px',
                  }}
                  onClick={() => handleSummaryLengthChange('long')}
                >
                  Long
                </Button>
              </div>
            </div>
          )}

          {!selectedHistoryItem && (
            <div className="text-center mt-4 mb-5">
              <Button
                variant="primary"
                style={{
                  backgroundColor: colors(darkMode).primary,
                  borderColor: colors(darkMode).primary,
                  color: colors(darkMode).buttonText,
                  padding: '0.75rem 2.5rem',
                  fontWeight: '500',
                  borderRadius: '4px',
                  opacity: !file || loading || !fileUploaded || !title ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                }}
                disabled={!file || loading || !fileUploaded || !title}
                onClick={handleSummarize}
                onMouseOver={(e) => {
                  if (!(!file || loading || !fileUploaded || !title)) {
                    e.target.style.opacity = 0.9;
                  }
                }}
                onMouseOut={(e) => {
                  if (!(!file || loading || !fileUploaded || !title)) {
                    e.target.style.opacity = 1;
                  }
                }}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" style={{ marginRight: '0.5rem' }} />
                    Processing...
                  </>
                ) : (
                  'Summarize Now'
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert
              variant="danger"
              className="mt-4"
              style={{
                borderRadius: '4px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
                border: 'none',
                borderLeft: '4px solid #e53e3e',
              }}
            >
              {error}
            </Alert>
          )}

          {summaryResult && (
            <div className="mt-5">
              <div
                className="rounded p-4"
                style={{
                  backgroundColor: darkMode ? colors(darkMode).cardBg : '#ffffff',
                  color: colors(darkMode).textDark,
                  border: `1px solid ${colors(darkMode).borderColor}`,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4 style={{ color: colors(darkMode).primary, fontWeight: '600', margin: 0 }}>
                    {selectedHistoryItem ? `Summary of ${selectedHistoryItem.name}` : 'Summary'}
                  </h4>
                  <div className="d-flex gap-2">
                    <Button
                      variant="link"
                      onClick={handleDownloadSummary}
                      style={{
                        color: colors(darkMode).primary,
                        textDecoration: 'none',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      <FaDownload size={14} /> Download PDF
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => handleCopyText(summaryResult.summary)}
                      style={{
                        color: colors(darkMode).primary,
                        textDecoration: 'none',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        fontSize: '0.9rem',
                      }}
                    >
                      {copiedText ? 'Copied!' : (
                        <>
                          <FaClipboard size={14} /> Copy
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p style={{ lineHeight: '1.6', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>
                  {summaryResult.summary || 'No summary available.'}
                </p>
              </div>

              

              <div style={{ marginTop: '1.5rem' }}>
                <TextToVoice summaryText={summaryResult.summary} />
              </div>

              {(currentPaperId || selectedHistoryItem) && (
                <div className="mt-5">
                  <div
                    className="rounded p-4"
                    style={{
                      backgroundColor: darkMode ? colors(darkMode).cardBg : '#ffffff',
                      color: colors(darkMode).textDark,
                      border: `1px solid ${colors(darkMode).borderColor}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h4 style={{ color: colors(darkMode).primary, fontWeight: '600', margin: 0 }}>
                        Q&A: Ask Questions
                      </h4>
                    </div>
                    <ChatBox
                      darkMode={darkMode}
                      colors={colors}
                      paperId={currentPaperId || selectedHistoryItem?.paper_id}
                      chatHistory={(selectedHistoryItem?.chat_history || historyItems.find(item => item.paper_id === currentPaperId)?.chat_history) || []}
                      onNewMessage={handleNewMessage}
                      isSummarizing={loading}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>

        <div style={{ position: 'fixed', bottom: '1rem', right: '1rem' }}>
          <DictionaryWidget />
        </div>
      </div>
    </div>
  );
};

export default SummarizePage;