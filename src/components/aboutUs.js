import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

const AboutUs = () => {
  return (
    <div style={styles.aboutPage}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <Container>
          <div style={styles.heroContent}>
            <h1 style={styles.heroTitle}>About PaperGlance</h1>
            <p style={styles.heroSubtitle}>Revolutionizing Academic Research Through AI</p>
          </div>
        </Container>
      </section>

      {/* Mission Section */}
      <section style={styles.missionSection}>
        <Container>
          <Row className="justify-content-center">
            <Col lg={8} style={styles.missionCol}>
              <h2 style={styles.sectionTitle}>Our Mission</h2>
              <p style={styles.missionText}>
                At PaperGlance, we're transforming how researchers interact with scholarly content. 
                Our AI-driven platform delivers concise, accurate summaries of complex research papers, 
                accelerating your academic workflow.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Value Propositions */}
      <section style={styles.valuesSection}>
        <Container>
          <h2 style={{...styles.sectionTitle, textAlign: 'center'}}>Why Choose PaperGlance</h2>
          <Row className="g-4">
            {[
              { 
                icon: 'bi-file-earmark-text',
                title: 'Smart Summarization',
                text: 'AI-powered summaries capture the essence of complex papers in minutes'
              },
              { 
                icon: 'bi-shield-check',
                title: 'Academic Integrity',
                text: 'Algorithms designed to maintain scholarly rigor and accuracy'
              },
              { 
                icon: 'bi-graph-up',
                title: 'Critical Analysis',
                text: 'Highlight key strengths and limitations for balanced evaluation'
              },
              { 
                icon: 'bi-people',
                title: 'Community Driven',
                text: 'Developed with continuous feedback from researchers worldwide'
              }
            ].map((value, index) => (
              <Col md={6} lg={3} key={index}>
                <Card style={styles.valueCard}>
                  <Card.Body style={styles.cardBody}>
                    <i className={`bi ${value.icon}`} style={styles.valueIcon}></i>
                    <h3 style={styles.valueTitle}>{value.title}</h3>
                    <p style={styles.valueText}>{value.text}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section style={styles.teamSection}>
        <Container>
          <h2 style={{...styles.sectionTitle, textAlign: 'center'}}>Our Team</h2>
          <Row className="g-4 justify-content-center">
            {[
              'Varshini Gopaldas', 
              'Laitha Vaishnavi',
              'YashaSree Garige',
              'Vaishnavi Sampangi',
              'Akshaya Batharaju'
            ].map((member, index) => (
              <Col md={6} lg={3} key={index}>
                <Card style={styles.teamCard}>
                  <div style={styles.teamAvatar}>
                    {member.split(' ').map(n => n[0]).join('')}
                  </div>
                  <Card.Body style={{...styles.cardBody, textAlign: 'center'}}>
                    <h3 style={styles.teamMemberName}>{member}</h3>
                
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <Container style={{textAlign: 'center'}}>
          <h2 style={styles.ctaTitle}>Transform Your Research Process</h2>
          <Button style={styles.ctaButton}>

            Start Free Trial
          </Button>
          
        </Container>
      </section>
    </div>
  );
};

// All styles in one object
const styles = {
  aboutPage: {
    fontFamily: "'Inter', sans-serif",
    color: '#2c3e50'
  },
  heroSection: {
    background: 'linear-gradient(135deg, #2c3e50, #16213E)',
    color: 'white',
    padding: '8rem 0 4rem',
    position: 'relative',
    overflow: 'hidden'
  },
  heroContent: {
    textAlign: 'center'
  },
  heroTitle: {
    fontSize: '3rem',
    fontWeight: '800',
    marginBottom: '1rem'
  },
  heroSubtitle: {
    fontSize: '1.25rem',
    opacity: '0.9'
  },
  missionSection: {
    padding: '4rem 0',
    backgroundColor: '#f9fafb'
  },
  missionCol: {
    textAlign: 'center'
  },
  sectionTitle: {
    fontSize: '2.25rem',
    color: '#2c3e50',
    marginBottom: '2rem',
    position: 'relative'
  },
  missionText: {
    fontSize: '1.1rem',
    lineHeight: '1.8'
  },
  valuesSection: {
    padding: '4rem 0'
  },
  valueCard: {
    border: 'none',
    borderRadius: '1rem',
    transition: 'all 0.3s ease',
    backgroundColor: 'white',
    boxShadow: '0 5px 25px rgba(0,0,0,0.08)',
    height: '100%',
    ':hover': {
      transform: 'translateY(-10px)'
    }
  },
  cardBody: {
    padding: '2rem',
    textAlign: 'center'
  },
  valueIcon: {
    fontSize: '2.5rem',
    color: '#3498db',
    marginBottom: '1rem'
  },
  valueTitle: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '1rem'
  },
  valueText: {
    color: '#7f8c8d'
  },
  teamSection: {
    padding: '4rem 0',
    backgroundColor: '#f9fafb'
  },
  teamCard: {
    border: 'none',
    borderRadius: '1rem',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    paddingTop: '60px'
  },
  teamAvatar: {
    width: '120px',
    height: '120px',
    backgroundColor: '#3498db',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
    fontWeight: '700',
    margin: '-60px auto 1rem',
    boxShadow: '0 10px 20px rgba(52, 152, 219, 0.2)'
  },
  teamMemberName: {
    fontSize: '1.25rem',
    color: '#2c3e50',
    marginBottom: '0.5rem'
  },
  teamMemberRole: {
    color: '#7f8c8d',
    fontSize: '0.9rem'
  },
  featuresSection: {
    padding: '4rem 0'
  },
  featuresList: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  featureItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
    fontSize: '1.1rem'
  },
  featureIcon: {
    color: '#3498db',
    marginRight: '1rem',
    fontSize: '1.25rem'
  },
  ctaSection: {
    padding: '6rem 0',
    background: 'linear-gradient(135deg, #2c3e50, #16213E)',
    color: 'white',
    textAlign: 'center'
  },
  ctaTitle: {
    fontSize: '2.25rem',
    marginBottom: '2rem'
  },
  ctaButton: {
    backgroundColor: '#3498db',
    border: 'none',
    padding: '1rem 2.5rem',
    fontSize: '1.1rem',
    borderRadius: '0.75rem',
    transition: 'all 0.3s ease',
    ':hover': {
      transform: 'translateY(-3px)',
      boxShadow: '0 5px 15px rgba(52, 152, 219, 0.3)'
    }
  }
};

export default AboutUs;