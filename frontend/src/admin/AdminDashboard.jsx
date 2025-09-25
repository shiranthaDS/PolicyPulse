import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AddCourse from './AddCourse';
import CoursesList from '../CoursesList';
import UserManagement from './UserManagement';
import {
  FiUsers,
  FiBook,
  FiPlus,
  FiBarChart2,
  FiHome,
  FiLogOut
} from 'react-icons/fi';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const menuItems = [
    {
      path: '/admin',
      name: 'Dashboard',
      icon: FiBarChart2,
      exact: true
    },
    {
      path: '/admin/users',
      name: 'User Management',
      icon: FiUsers
    },
    {
      path: '/admin/courses',
      name: 'All Courses',
      icon: FiBook
    },
    {
      path: '/admin/add-course',
      name: 'Add Course',
      icon: FiPlus
    }
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <div className="admin-sidebar open">
        <div className="sidebar-header">
          <div className="logo">
            <h2>Admin Panel</h2>
          </div>
        </div>

        <div className="sidebar-content">
            <div className="user-info">
              <div className="user-avatar">
                <FiUsers />
              </div>
              <div className="user-details">
                <span className="user-name">{user?.name}</span>
                <span className="user-role">Administrator</span>
              </div>
            </div>

            <ul className="sidebar-nav">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.path} className="nav-item">
                    <Link
                      to={item.path}
                      className={`nav-link ${isActive(item.path, item.exact) ? 'active' : ''}`}
                    >
                      <Icon />
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="sidebar-footer">
              <Link to="/" className="nav-link">
                <FiHome />
                <span>Back to Site</span>
              </Link>
              
              <button onClick={handleLogout} className="nav-link logout-btn">
                <FiLogOut />
                <span>Logout</span>
              </button>
            </div>
          </div>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-content">
          <Routes>
            <Route index element={<AdminDashboardHome />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="courses" element={<CoursesList />} />
            <Route path="add-course" element={<AddCourse />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

// Dashboard Home Component
const AdminDashboardHome = () => {
  const [stats, setStats] = useState({
    userStats: {
      totalUsers: 0,
      totalStudents: 0,
      totalAdmins: 0
    },
    enrollmentStats: [],
    recentEnrollments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/users/admin/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <FiBarChart2 className="spinning" size={48} />
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the PolicyPulse Learning Management System</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon users">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>{stats.userStats.totalUsers}</h3>
            <p>Total Users</p>
            <span className="stat-detail">
              {stats.userStats.totalStudents} Employees, {stats.userStats.totalAdmins} Admins
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon courses">
            <FiBook />
          </div>
          <div className="stat-content">
            <h3>{stats.enrollmentStats.length}</h3>
            <p>Active Courses</p>
            <span className="stat-detail">With enrollments</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon enrollments">
            <FiBarChart2 />
          </div>
          <div className="stat-content">
            <h3>
              {stats.enrollmentStats.reduce((total, course) => total + course.enrollmentCount, 0)}
            </h3>
            <p>Total Enrollments</p>
            <span className="stat-detail">Across all courses</span>
          </div>
        </div>
      </div>

      {/* Course Enrollment Stats */}
      <div className="dashboard-section">
        <h2>Course Enrollment Statistics</h2>
        <div className="enrollment-stats">
          {stats.enrollmentStats.slice(0, 5).map((course, index) => (
            <div key={course._id} className="enrollment-item">
              <div className="course-info">
                <h4>{course.courseName}</h4>
                <span>{course.enrollmentCount} employees enrolled</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(course.avgProgress * 10, 100)}%` }}
                ></div>
              </div>
              <span className="progress-text">{course.avgProgress} avg progress</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Enrollments */}
      <div className="dashboard-section">
        <h2>Recent Enrollments</h2>
        <div className="recent-enrollments">
          {stats.recentEnrollments.slice(0, 5).map((user, index) => (
            <div key={user._id} className="enrollment-card">
              <div className="user-avatar">
                <FiUsers />
              </div>
              <div className="enrollment-details">
                <h4>{user.name}</h4>
                <p>{user.email}</p>
                <span>{user.enrolledCourses.length} course(s) enrolled</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;