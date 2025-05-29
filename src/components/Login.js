import React, { useState, useEffect } from "react";
import "./Login.css";
import LoginImg from "../Login.png";
import Typed from 'typed.js';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import { loginUser } from '../api'; // Import the loginUser function from api.js

const Login = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const strings = isLogin 
      ? ["Welcome Back!", "Research Made Efficient", "Login to Continue"] 
      : ["Create Account", "Join PaperGlance", "Start Your Research Journey"];
      
    const typed = new Typed(".typing-text", {
      strings,
      typeSpeed: 80,
      backSpeed: 50,
      loop: true,
    });
    return () => typed.destroy();
  }, [isLogin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation for signup
    if (!isLogin) {
      if (!formData.email) {
        setError("Email is required for signup.");
        setLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords don't match.");
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        // Use loginUser from api.js for login
        const { token } = await loginUser(formData.username, formData.password);
        localStorage.setItem("token", token);
        alert("Login successful!");
        navigate("/profile");
      } else {
        // Signup API
        const response = await fetch("http://localhost:8080/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Signup failed");
        }
        const data = await response.json();
        alert(data.message);
        setIsLogin(true); // Switch to login mode after signup
        setFormData({ username: "", email: "", password: "", confirmPassword: "" });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const token = credentialResponse.credential;
      const response = await fetch("http://localhost:8080/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Google login failed");
      }
      const data = await response.json();
      localStorage.setItem("token", data.token);
      alert("Google login successful!");
      navigate("/profile");
    } catch (err) {
      console.error("Google login error:", err);
      setError(err.message || "Google login failed");
    }
  };

  return (
    <div className="login-page">
      <Container className="login-container">
        <Row className="align-items-center gx-5">
          {/* Illustration Column */}
          <Col md={6} className="d-none d-md-block login-illustration">
            <div className="illustration-wrapper">
              <div className="floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
              </div>
              <img
                src={LoginImg}
                alt="Research Illustration"
                className="illustration-img"
              />
            </div>
          </Col>

          {/* Form Column */}
          <Col md={6} className="form-column">
            <div className="form-container">
              <div className="form-header">
                <img
                  src={process.env.PUBLIC_URL + "/logopaperglance1.jpg"}
                  alt="PaperGlance Logo"
                  className="form-logo"
                />
                <h1 className="form-title">
                  <span className="typing-text"></span>
                </h1>
                <p className="form-subtitle">
                  {isLogin
                    ? "Sign in to access your research dashboard"
                    : "Create your account to get started"}
                </p>
              </div>

              <Form onSubmit={handleSubmit} className="auth-form">
                {!isLogin && (
                  <Form.Group className="mb-3" controlId="email">
                    <Form.Label>Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      autoComplete="email" // Added for accessibility
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3" controlId="username">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your username"
                    required
                    autoComplete="username" // Added for accessibility
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password" // Added to fix warning
                  />
                </Form.Group>

                {!isLogin && (
                  <Form.Group className="mb-4" controlId="confirmPassword">
                    <Form.Label>Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      required
                      autoComplete="new-password" // Added for accessibility
                    />
                  </Form.Group>
                )}

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {isLogin && (
                  <div className="d-flex justify-content-end mb-3">
                    <a href="#forgot-password" className="text-decoration-none forgot-password">
                      Forgot password?
                    </a>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-100 auth-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      {isLogin ? "Logging in..." : "Creating account..."}
                    </>
                  ) : (
                    isLogin ? "Login" : "Sign Up"
                  )}
                </Button>

                {isLogin && (
                  <div className="mt-4 text-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError("Google login failed")}
                    />
                  </div>
                )}

                <div className="auth-toggle text-center mt-4">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button 
                    type="button" 
                    className="btn btn-link p-0 toggle-link"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setError("");
                    }}
                  >
                    {isLogin ? "Sign up" : "Login"}
                  </button>
                </div>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Login;