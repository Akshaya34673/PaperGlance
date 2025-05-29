import axios from 'axios';

// Backend API URL (FastAPI on port 8080)
const API_URL = 'http://localhost:8080';

// Function to log in a user
export const loginUser = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/api/login`, { username, password });
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Login failed');
  }
};

// Function to log out a user
export const logoutUser = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await axios.post(
      `${API_URL}/api/logout`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error logging out:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Logout failed');
  }
};

// Function to fetch user profile
export const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await axios.get(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching profile:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch profile');
  }
};

// Function to update user profile
export const updateProfile = async (profileData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await axios.put(
      `${API_URL}/api/users/update-profile`,
      profileData,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating profile:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to update profile');
  }
};

// Function to summarize a file with specified length
export const summarizeFile = async (file, summaryLength = 'medium', title) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('summary_length', summaryLength);
  formData.append('title', title);

  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_URL}/api/summaries`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error summarizing file:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Summary generation failed');
  }
};

// Function to fetch summaries with chat history
export const fetchSummaries = async (limit = 10) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await axios.get(`${API_URL}/api/summaries?limit=${limit}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching summaries:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch summaries');
  }
};

// Function to send a question to the chat endpoint
export const sendQuestion = async (question, paperId = null) => {
  const formData = new FormData();
  formData.append('question', question);

  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/summaries/${paperId}/chat`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending question:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to send question');
  }
};

// Function to fetch detailed history for a specific paper
export const fetchPaperHistory = async (paperId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/api/history/${paperId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching paper history:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to fetch paper history');
  }
};

// Function to delete a summary
export const deleteSummary = async (summaryId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(`${API_URL}/api/summaries/${summaryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting summary:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to delete summary');
  }
};

// Function to download a summary as PDF
export const downloadSummary = async (summaryText) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/summaries/download-summary/`,
      { summary_text: summaryText },
      { 
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' 
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error downloading summary:", error.response?.data?.detail || error.message);
    throw new Error(error.response?.data?.detail || 'Failed to download summary');
  }
};