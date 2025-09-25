import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomePage from './HomePage';
import CoursesList from './CoursesList';
import CoursesPage from './CoursesPage';
import CourseEnroll from './CourseEnroll';
import CourseWorkspace from './CourseWorkspace';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './admin/AdminDashboard';
import UserDashboard from './UserDashboard';
import SecurityManagerDashboard from './admin/SecurityManagerDashboard';
import AuditorDashboard from './admin/AuditorDashboard';
import { FiUser, FiLogOut, FiSettings, FiHome, FiShield, FiFileText, FiBook } from 'react-icons/fi';
import './App.css';

// Protected Route Component for Employee Dashboard
function EmployeeRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (user?.role !== 'employee') {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="nav-logo">
            <span className="logo-icon">🚀</span>
            <span className="logo-text">PolicyPulse</span>
          </Link>
        </div>
        
        <div className="nav-center">
          {isAuthenticated && (
            <div className="nav-links-center">
              {user?.role === 'employee' && (
                <>
                  <Link to="/dashboard" className="nav-link nav-link-primary">
                    <FiHome className="nav-icon" />
                    <span>Dashboard</span>
                  </Link>
                  <Link to="/courses-page" className="nav-link nav-link-primary">
                    <FiBook className="nav-icon" />
                    <span>Courses</span>
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link nav-link-admin">
                  <FiSettings className="nav-icon" />
                  <span>Admin Panel</span>
                </Link>
              )}
              {user?.role === 'securitymanager' && (
                <Link to="/security-manager" className="nav-link nav-link-security">
                  <FiShield className="nav-icon" />
                  <span>Security Manager</span>
                </Link>
              )}
              {user?.role === 'auditor' && (
                <Link to="/auditor" className="nav-link nav-link-auditor">
                  <FiFileText className="nav-icon" />
                  <span>Auditor Panel</span>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="nav-right">
          {isAuthenticated ? (
            <div className="user-menu">
              <div className="user-profile">
                <div className="user-avatar">
                  <FiUser />
                </div>
                <div className="user-details">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">{user?.role}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link nav-link-secondary">
                <span>Sign In</span>
              </Link>
              <Link to="/register" className="nav-link nav-link-cta">
                <span>Register</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <NavBar />

          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/courses" element={<CoursesList />} />
              <Route path="/courses-page" element={
                <EmployeeRoute>
                  <CoursesPage />
                </EmployeeRoute>
              } />
              <Route path="/dashboard" element={
                <EmployeeRoute>
                  <UserDashboard />
                </EmployeeRoute>
              } />
              <Route path="/course/:courseId" element={<CourseEnroll />} />
              <Route path="/course/:courseId/workspace" element={<CourseWorkspace />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              <Route path="/security-manager" element={<SecurityManagerDashboard />} />
              <Route path="/auditor" element={<AuditorDashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
