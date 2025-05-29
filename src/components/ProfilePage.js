import React, { useState, useEffect } from "react";
import { Button, Form, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { fetchProfile, updateProfile, fetchSummaries, logoutUser } from '../api'; // Fixed: Changed './api' to '../api'
import "./ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState([]);
  const [loadingSummaries, setLoadingSummaries] = useState(false);
  const [errorSummaries, setErrorSummaries] = useState("");

  const navigate = useNavigate();

  const handleFetchProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchProfile();
      setUser(data);
      setUsername(data.username || "");
      setEmail(data.email || "");
      setBio(data.bio || "");
    } catch (err) {
      setError(err.message || "Failed to fetch profile details.");
      if (err.message.includes('401')) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFetchSummaries = async () => {
    setLoadingSummaries(true);
    setErrorSummaries("");
    try {
      const data = await fetchSummaries();
      setSummaries(data);
    } catch (err) {
      setErrorSummaries(err.message || "Failed to fetch saved summaries.");
      if (err.message.includes('401')) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoadingSummaries(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Error during logout:", error.message);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await handleFetchProfile();
      await handleFetchSummaries();
    };
    fetchData();
  }, [navigate]);

  const handleEditToggle = () => {
    if (isEditing) {
      handleSaveChanges();
    }
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      await updateProfile({ username, email, bio });
      setUser({ ...user, username, email, bio });
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to update profile.");
      if (err.message.includes('401')) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <div className="card p-4 shadow-lg rounded" style={{ maxWidth: "500px", width: "100%" }}>
        <div className="text-center mb-4">
          <div
            className="rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center mx-auto"
            style={{ width: 80, height: 80, fontSize: "2rem" }}
          >
            {username?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h4 className="mt-3">Profile Information</h4>
          <p className="text-muted mb-0">Manage your personal info</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">Profile updated successfully!</Alert>}

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={!isEditing}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!isEditing}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={!isEditing}
              rows={3}
            />
          </Form.Group>

          <div className="saved-summaries mt-4">
            <h5>Saved Summaries</h5>
            {loadingSummaries && <Spinner animation="border" />}
            {errorSummaries && <Alert variant="danger">{errorSummaries}</Alert>}
            {!loadingSummaries && !errorSummaries && summaries.length === 0 && (
              <p>No saved summaries found.</p>
            )}
            <ul className="list-group">
              {summaries.map((summary) => (
                <li key={summary._id} className="list-group-item">
                  <strong>{summary.title || "Untitled"}</strong>
                  <p>{summary.summary || "No summary available"}</p>
                  <small className="text-muted">
                    Uploaded on {new Date(summary.created_at).toLocaleDateString()}
                  </small>
                </li>
              ))}
            </ul>
          </div>

          <div className="d-flex justify-content-between mt-4">
            <Button
              variant={isEditing ? "success" : "primary"}
              onClick={handleEditToggle}
              disabled={loading}
            >
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Edit Profile"
              )}
            </Button>
            <Button
              variant="outline-danger"
              onClick={handleLogout}
              disabled={loading}
            >
              Logout
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ProfilePage;