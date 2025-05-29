import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import axios from 'axios';
import React, { useState } from 'react';
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false); // optional: UX improvement

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start loader

    try {
      // Send form data to backend
      const res = await axios.post("http://localhost:8080/api/contact", formData);

      // Show success message
      setStatus({ type: 'success', message: "Message sent and stored successfully!" });

      // Clear form after success
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error("Error:", err.response ? err.response.data : err.message);
      setStatus({ type: 'danger', message: "Something went wrong. Please try again." });
    } finally {
      setLoading(false); // Stop loader
    }
  };
  return (
    <div style={styles.contactPage}>
      {/* Hero Section */}
      <section style={styles.contactHero}>
        <Container>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>Contact Us</h1>
            <p style={styles.heroSubtitle}>We're here to help with your research needs</p>
          </div>
        </Container>
      </section>

      {/* Content Section */}
      <section style={styles.contactContent}>
        <Container>
          <Row className="g-5">
            {/* Contact Form */}
            <Col lg={6}>
              <div style={styles.contactFormWrapper}>
                <h2 style={styles.sectionTitle}>Send a Message</h2>
                <Form onSubmit={handleSubmit}>
  <Form.Group className="mb-4">
    <Form.Label style={styles.formLabel}>Your Name</Form.Label>
    <Form.Control 
      type="text" 
      placeholder="Enter your name" 
      name="name"
      value={formData.name}
      onChange={handleChange}
      style={styles.formControl}
    />
  </Form.Group>

  <Form.Group className="mb-4">
    <Form.Label style={styles.formLabel}>Email Address</Form.Label>
    <Form.Control 
      type="email" 
      placeholder="Enter your email" 
      name="email"
      value={formData.email}
      onChange={handleChange}
      style={styles.formControl}
    />
  </Form.Group>

  <Form.Group className="mb-4">
    <Form.Label style={styles.formLabel}>Subject</Form.Label>
    <Form.Control 
      type="text" 
      placeholder="Message subject" 
      name="subject"
      value={formData.subject}
      onChange={handleChange}
      style={styles.formControl}
    />
  </Form.Group>

  <Form.Group className="mb-4">
    <Form.Label style={styles.formLabel}>Message</Form.Label>
    <Form.Control 
      as="textarea" 
      rows={5} 
      placeholder="Your message..." 
      name="message"
      value={formData.message}
      onChange={handleChange}
      style={styles.formControl}
    />
  </Form.Group>

  <Button type="submit" style={styles.submitButton} disabled={loading}>
    {loading ? "Sending..." : "Send Message"}
  </Button>

  {/* Show success or error message */}
  {status.message && (
    <div style={{ marginTop: '1rem', color: status.type === 'success' ? 'green' : 'red' }}>
      {status.message}
    </div>
  )}
</Form>

              </div>
            </Col>

            {/* Contact Info */}
            <Col lg={6}>
              <div style={styles.contactInfoWrapper}>
                <h2 style={styles.sectionTitle}>Get in Touch</h2>
                
                <div style={styles.infoItem}>
                  <i className="bi bi-envelope" style={styles.infoIcon}></i>
                  <div>
                    <h3 style={styles.infoTitle}>Email</h3>
                    <p style={styles.infoText}>contact@paperglance.com</p>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <i className="bi bi-telephone" style={styles.infoIcon}></i>
                  <div>
                    <h3 style={styles.infoTitle}>Phone</h3>
                    <p style={styles.infoText}>+1 (555) 123-4567</p>
                  </div>
                </div>

                <div style={styles.infoItem}>
                    
                  <div>
                    <h3 style={styles.infoTitle}>You can also contact us at:</h3>
                    <p style={styles.infoText}>instagram:PaperGlanceoffl_</p>
                    <p style={styles.infoText}>linkedin:PaperGlance</p>
                  </div>
                </div>

                <div style={styles.socialLinks}>
                  <a href="#" style={styles.socialLink}>
                    <i className="bi bi-twitter"></i>
                  </a>
                  <a href="#" style={styles.socialLink}>
                    <i className="bi bi-linkedin"></i>
                  </a>
                  <a href="#" style={styles.socialLink}>
                    <i className="bi bi-facebook"></i>
                  </a>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

// All styles in one object
const styles = {
  contactPage: {
    fontFamily: "'Inter', sans-serif",
    color: '#2c3e50',
    backgroundColor: '#f9fafb',
    minHeight: '100vh'
  },
  contactHero: {
    background: 'linear-gradient(135deg, #2c3e50, #16213E)',
    color: 'white',
    padding: '6rem 0',
    textAlign: 'center'
  },
  heroContent: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '1rem'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    opacity: '0.9'
  },
  contactContent: {
    padding: '4rem 0'
  },
  contactFormWrapper: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 5px 25px rgba(0,0,0,0.08)',
    height: '100%'
  },
  contactInfoWrapper: {
    backgroundColor: 'white',
    borderRadius: '1rem',
    padding: '2rem',
    boxShadow: '0 5px 25px rgba(0,0,0,0.08)',
    height: '100%'
  },
  sectionTitle: {
    fontSize: '2rem',
    color: '#2c3e50',
    marginBottom: '2rem',
    position: 'relative'
  },
  formLabel: {
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.5rem',
    display: 'block'
  },
  formControl: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid #dfe6e9',
    transition: 'all 0.3s ease',
    width: '100%',
    ':focus': {
      borderColor: '#3498db',
      boxShadow: '0 0 0 0.25rem rgba(52, 152, 219, 0.25)'
    }
  },
  submitButton: {
    backgroundColor: '#3498db',
    border: 'none',
    padding: '0.75rem 2rem',
    borderRadius: '0.75rem',
    transition: 'all 0.3s ease',
    color: 'white',
    fontWeight: '600',
    ':hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 5px 15px rgba(52, 152, 219, 0.3)',
      backgroundColor: '#2980b9'
    }
  },
  infoItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '2rem',
    padding: '1.5rem',
    backgroundColor: '#f9fafb',
    borderRadius: '0.75rem'
  },
  infoIcon: {
    fontSize: '1.75rem',
    color: '#3498db',
    marginRight: '1.5rem'
  },
  infoTitle: {
    fontSize: '1.1rem',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  infoText: {
    color: '#7f8c8d',
    margin: '0'
  },
  socialLinks: {
    display: 'flex',
    gap: '1.5rem',
    marginTop: '2rem'
  },
  socialLink: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.25rem',
    color: '#2c3e50',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    ':hover': {
      backgroundColor: '#3498db',
      color: 'white',
      transform: 'translateY(-3px)'
    }
  }
};

export default Contact;