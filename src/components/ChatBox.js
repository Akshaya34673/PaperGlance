import React, { useState } from 'react';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { sendQuestion } from '../api'; // Fixed: Changed sendChatMessage to sendQuestion
import { useNavigate } from 'react-router-dom';

const ChatBox = ({ paperId, chatHistory, onNewMessage, isSummarizing, darkMode, colors }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    if (!paperId) {
      setError('No paper selected for Q&A.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await sendQuestion(question, paperId); // Fixed: Use sendQuestion
      const newQandA = {
        question,
        answer: response.answer,
        created_at: new Date().toISOString(),
      };
      onNewMessage(newQandA);
      setQuestion('');
    } catch (err) {
      setError(err.message || 'Failed to send question.');
      if (err.message.includes('401')) {
        localStorage.removeItem("token");
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="chat-history">
        {chatHistory.map((chat, index) => (
          <div
            key={index}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
              borderRadius: '4px',
            }}
          >
            <p style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
              <strong>Question:</strong> {chat.question}
            </p>
            <p style={{ marginBottom: '0' }}>
              <strong>Answer:</strong> {chat.answer}
            </p>
          </div>
        ))}
      </div>
      <Form onSubmit={handleSendQuestion}>
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about the paper..."
            disabled={loading || isSummarizing}
            style={{
              backgroundColor: darkMode ? '#2d3748' : '#fff',
              color: colors(darkMode).textDark,
              borderColor: colors(darkMode).borderColor,
            }}
          />
        </Form.Group>
        <Button
          type="submit"
          variant="primary"
          disabled={loading || isSummarizing || !question.trim()}
          style={{
            backgroundColor: colors(darkMode).primary,
            borderColor: colors(darkMode).primary,
            color: colors(darkMode).buttonText,
          }}
        >
          {loading ? <Spinner animation="border" size="sm" /> : 'Send'}
        </Button>
      </Form>
    </div>
  );
};

export default ChatBox;