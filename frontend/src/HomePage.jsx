import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { FiArrowRight, FiBook, FiShield, FiAward, FiTarget, FiTrendingUp, FiMail, FiPhone, FiMapPin, FiTwitter, FiLinkedin, FiGithub, FiFacebook } from 'react-icons/fi';
import './HomePage.css';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  const getDashboardRoute = () => {
    if (!isAuthenticated) return '/login';
    
    switch (user?.role) {
      case 'admin':
        return '/admin';
      case 'security_manager':
        return '/security-manager';
      case 'auditor':
        return '/auditor';
      case 'employee':
        return '/dashboard';
      default:
        return '/courses';
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
          <div className="hero-particles"></div>
        </div>
        
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Transform Your Organization with
                <span className="highlight"> PolicyPulse</span>
              </h1>
              <p className="hero-subtitle">
                Comprehensive learning management system designed for modern organizations. 
                Streamline training, ensure compliance, and empower your workforce with cutting-edge educational technology.
              </p>
              
              <div className="hero-actions">
                {isAuthenticated ? (
                  <Link to={getDashboardRoute()} className="btn btn-primary">
                    <span>Go to Dashboard</span>
                    <FiArrowRight />
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-primary">
                      <span>Get Started</span>
                      <FiArrowRight />
                    </Link>
                    
                  </>
                )}
              </div>
            </div>
            
            <div className="hero-visual">
              <div className="hero-image">
                <img 
                  src="https://www.shutterstock.com/image-photo/lock-mark-cybersecurity-internet-protect-600nw-2493802703.jpg"
                  alt="Team collaboration and learning"
                  className="hero-main-image"
                />
                <div className="floating-elements">
                  <div className="element element-1">
                    <FiBook />
                  </div>
                  <div className="element element-2">
                    <FiShield />
                  </div>
                  <div className="element element-3">
                    <FiTarget />
                  </div>
                  <div className="element element-4">
                    <FiAward />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose PolicyPulse?</h2>
            <p>Empowering organizations with comprehensive learning solutions</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Security First</h3>
              <p>Enterprise-grade security with comprehensive audit trails and compliance monitoring.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiBook />
              </div>
              <h3>Interactive Learning</h3>
              <p>Engaging courses with video content, quizzes, and progress tracking for effective learning outcomes.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiAward />
              </div>
              <h3>Certification</h3>
              <p>Track achievements and certifications with automated progress monitoring and reporting.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiTarget />
              </div>
              <h3>Goal Tracking</h3>
              <p>Set and monitor learning objectives with detailed analytics and performance insights.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <FiTrendingUp />
              </div>
              <h3>Analytics</h3>
              <p>Comprehensive reporting and analytics to measure learning effectiveness and organizational growth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Organization?</h2>
            <p>Join thousands of organizations already using PolicyPulse to enhance their training and compliance programs.</p>
            
            <div className="cta-actions">
              {!isAuthenticated && (
                <>
                  <Link to="/register" className="btn btn-primary btn-large">
                    <span>Start Free Trial</span>
                    <FiArrowRight />
                  </Link>
                  <Link to="/login" className="btn btn-outline">
                    <span>Sign In</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <div className="footer-brand">
                <h3>PolicyPulse</h3>
                <p>Empowering organizations with comprehensive learning management solutions for the digital age.</p>
                <div className="social-links">
                  <a href="#" className="social-link">
                    <FiTwitter />
                  </a>
                  <a href="#" className="social-link">
                    <FiLinkedin />
                  </a>
                  <a href="#" className="social-link">
                    <FiGithub />
                  </a>
                  <a href="#" className="social-link">
                    <FiFacebook />
                  </a>
                </div>
              </div>
            </div>

            <div className="footer-section">
              <h4>Product</h4>
              <ul className="footer-links">
                <li><Link to="/courses">Courses</Link></li>
                <li><Link to="/login">Login</Link></li>
                <li><Link to="/register">Sign Up</Link></li>
                <li><a href="#">Features</a></li>
                <li><a href="#">Pricing</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Company</h4>
              <ul className="footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Press</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Partners</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Support</h4>
              <ul className="footer-links">
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Status</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Contact</h4>
              <div className="contact-info">
                <div className="contact-item">
                  <FiMail />
                  <span>hello@policypulse.com</span>
                </div>
                <div className="contact-item">
                  <FiPhone />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="contact-item">
                  <FiMapPin />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <p>&copy; 2025 PolicyPulse. All rights reserved.</p>
              <div className="footer-bottom-links">
                <a href="#">Privacy Policy</a>
                <a href="#">Terms of Service</a>
                <a href="#">Cookie Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;