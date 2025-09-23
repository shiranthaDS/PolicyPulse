import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AddCourse from './admin/AddCourse';
import CoursesList from './CoursesList';
import CourseEnroll from './CourseEnroll';
import CourseWorkspace from './CourseWorkspace';
import Login from './Login';
import Register from './Register';
import AdminDashboard from './admin/AdminDashboard';
import UserDashboard from './UserDashboard';
import { FiUser, FiLogOut, FiSettings, FiHome } from 'react-icons/fi';
import './App.css';

function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          PolicyPulse Learning
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Courses
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="nav-link">
                <FiHome /> Dashboard
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="nav-link admin-link">
                  <FiSettings /> Admin Dashboard
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
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/course/:courseId" element={<CourseEnroll />} />
              <Route path="/course/:courseId/workspace" element={<CourseWorkspace />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
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
