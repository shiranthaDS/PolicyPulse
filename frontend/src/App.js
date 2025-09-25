import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
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
        <Link to="/" className="nav-logo">
          PolicyPulse 
        </Link>
        <div className="nav-links">
         
          {isAuthenticated ? (
            <>
              {user?.role === 'employee' && (
                <>
                  <Link to="/dashboard" className="nav-link">
                    <FiHome /> Dashboard
                  </Link>
                  <Link to="/courses-page" className="nav-link">
                    <FiBook /> Courses
                  </Link>
                </>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link admin-link">
                  <FiSettings /> Admin Dashboard
                </Link>
              )}
              {user?.role === 'securitymanager' && (
                <Link to="/security-manager" className="nav-link security-manager-link">
                  <FiShield /> Security Manager
                </Link>
              )}
              {user?.role === 'auditor' && (
                <Link to="/auditor" className="nav-link auditor-link">
                  <FiFileText /> Auditor Dashboard
                </Link>
              )}
              <div className="user-menu">
                <span className="user-info">
                  <FiUser /> {user?.name}
                </span>
                <button onClick={handleLogout} className="logout-btn">
                  <FiLogOut /> Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link">
                Register
              </Link>
            </>
          )}
        </div>
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
              <Route path="/" element={<CoursesList />} />
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
