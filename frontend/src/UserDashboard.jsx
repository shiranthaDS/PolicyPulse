import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import axios from 'axios';
import {
  FiUser,
  FiBook,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiAward,
  FiTrendingUp,
  FiPlay,
  FiCheck,
  FiStar,
  FiUsers,
  FiEye,
  FiPlus,
  FiSettings,
  FiMail,
  FiMapPin,
  FiEdit3
} from 'react-icons/fi';
import './UserDashboard.css';

const UserDashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: [],
    availableCourses: [],
    stats: {
      totalEnrolled: 0,
      completedCourses: 0,
      totalProgress: 0,
      certificatesEarned: 0
    }
  });

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [isAuthenticated, navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch user profile with enrolled courses
      const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch all published courses
      const coursesResponse = await axios.get(`${API_BASE_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (profileResponse.data.success && coursesResponse.data.success) {
        const enrolledCourses = profileResponse.data.data.enrolledCourses || [];
        const allCourses = coursesResponse.data.data || [];
        
        // Filter available courses (not enrolled)
        const enrolledCourseIds = enrolledCourses.map(enrollment => 
          enrollment.course ? (enrollment.course._id || enrollment.course) : null
        ).filter(Boolean);
        const availableCourses = allCourses.filter(course => 
          !enrolledCourseIds.includes(course._id)
        );

        // Filter out enrollments with null courses
        const validEnrollments = enrolledCourses.filter(enrollment => enrollment.course);

        // Calculate stats
        const completedCourses = validEnrollments.filter(enrollment => 
          enrollment.isCompleted || enrollment.progress?.overallProgress === 100
        ).length;
        
        const totalProgress = validEnrollments.length > 0 
          ? validEnrollments.reduce((sum, enrollment) => 
              sum + (enrollment.progress?.overallProgress || 0), 0
            ) / validEnrollments.length
          : 0;

        const certificatesEarned = validEnrollments.filter(enrollment => 
          enrollment.certificateIssued
        ).length;

        setDashboardData({
          enrolledCourses: validEnrollments,
          availableCourses,
          stats: {
            totalEnrolled: validEnrollments.length,
            completedCourses,
            totalProgress: Math.round(totalProgress),
            certificatesEarned
          }
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/users/enroll/${courseId}`,
        {},
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in course. Please try again.');
    }
  };

  const calculateCourseProgress = (enrollment) => {
    if (!enrollment.course || !enrollment.progress) return 0;
    
    const course = enrollment.course;
    const progress = enrollment.progress;
    
    const totalContent = (course.lecturePages?.length || 0) + (course.quizzes?.length || 0);
    const completedContent = (progress.completedPages?.length || 0) + (progress.completedQuizzes?.length || 0);
    
    return totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
  };

  if (loading || authLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.name}!</h1>
          <p>Track your learning progress and explore new courses</p>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      <div className="dashboard-content">
        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card enrolled">
            <div className="stat-icon">
              <FiBook />
            </div>
            <div className="stat-info">
              <span className="stat-number">{dashboardData.stats.totalEnrolled}</span>
              <span className="stat-label">Enrolled Courses</span>
            </div>
          </div>
          
          <div className="stat-card completed">
            <div className="stat-icon">
              <FiCheck />
            </div>
            <div className="stat-info">
              <span className="stat-number">{dashboardData.stats.completedCourses}</span>
              <span className="stat-label">Completed</span>
            </div>
          </div>
          
          <div className="stat-card progress">
            <div className="stat-icon">
              <FiTrendingUp />
            </div>
            <div className="stat-info">
              <span className="stat-number">{dashboardData.stats.totalProgress}%</span>
              <span className="stat-label">Avg Progress</span>
            </div>
          </div>
          
          <div className="stat-card certificates">
            <div className="stat-icon">
              <FiAward />
            </div>
            <div className="stat-info">
              <span className="stat-number">{dashboardData.stats.certificatesEarned}</span>
              <span className="stat-label">Certificates</span>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          {/* Profile Section */}
          <div className="dashboard-section profile-section">
            <div className="section-header">
              <h2><FiUser /> Profile</h2>
              <button className="edit-profile-btn">
                <FiEdit3 /> Edit
              </button>
            </div>
            
            <div className="profile-content">
              <div className="profile-avatar">
                <FiUser />
              </div>
              
              <div className="profile-details">
                <div className="profile-field">
                  <FiUser className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Full Name</span>
                    <span className="field-value">{user?.name}</span>
                  </div>
                </div>
                
                <div className="profile-field">
                  <FiMail className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Email</span>
                    <span className="field-value">{user?.email}</span>
                  </div>
                </div>
                
                <div className="profile-field">
                  <FiCalendar className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Member Since</span>
                    <span className="field-value">
                      {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="profile-field">
                  <FiAward className="field-icon" />
                  <div className="field-content">
                    <span className="field-label">Role</span>
                    <span className={`role-badge ${user?.role}`}>{user?.role}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="dashboard-section enrolled-courses-section">
            <div className="section-header">
              <h2><FiBookOpen /> My Courses</h2>
              <span className="course-count">{dashboardData.enrolledCourses.length} enrolled</span>
            </div>
            
            <div className="courses-content">
              {dashboardData.enrolledCourses.length === 0 ? (
                <div className="empty-state">
                  <FiBook className="empty-icon" />
                  <h3>No courses enrolled yet</h3>
                  <p>Start learning by enrolling in a course below!</p>
                </div>
              ) : (
                <div className="courses-grid">
                  {dashboardData.enrolledCourses.map((enrollment) => {
                    const course = enrollment.course;
                    const progress = calculateCourseProgress(enrollment);
                    
                    return (
                      <div key={enrollment._id} className="course-card enrolled">
                        <div className="course-header">
                          <h3>{course.courseName}</h3>
                          <div className="course-status">
                            {enrollment.isCompleted ? (
                              <span className="status-badge completed">
                                <FiCheck /> Completed
                              </span>
                            ) : (
                              <span className="status-badge in-progress">
                                <FiClock /> In Progress
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="course-description">
                          {course.description || 'No description available'}
                        </p>
                        
                        <div className="course-progress">
                          <div className="progress-header">
                            <span>Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        <div className="course-stats">
                          <div className="stat">
                            <FiBook className="stat-icon" />
                            <span>{course.lecturePages?.length || 0} Lectures</span>
                          </div>
                          <div className="stat">
                            <FiAward className="stat-icon" />
                            <span>{course.quizzes?.length || 0} Quizzes</span>
                          </div>
                        </div>
                        
                        <div className="course-actions">
                          <Link 
                            to={`/course/${course._id}/workspace`} 
                            className="btn-primary"
                          >
                            <FiPlay /> Continue Learning
                          </Link>
                          <Link 
                            to={`/course/${course._id}`} 
                            className="btn-secondary"
                          >
                            <FiEye /> View Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available Courses Section */}
        <div className="dashboard-section available-courses-section">
          <div className="section-header">
            <h2><FiBook /> Available Courses</h2>
            <span className="course-count">{dashboardData.availableCourses.length} available</span>
          </div>
          
          <div className="courses-content">
            {dashboardData.availableCourses.length === 0 ? (
              <div className="empty-state">
                <FiBook className="empty-icon" />
                <h3>No new courses available</h3>
                <p>You're enrolled in all available courses!</p>
              </div>
            ) : (
              <div className="courses-grid">
                {dashboardData.availableCourses.filter(course => course && course.courseName).map((course) => (
                  <div key={course._id} className="course-card available">
                    <div className="course-header">
                      <h3>{course.courseName}</h3>
                      <div className="course-difficulty">
                        {course.difficulty && (
                          <span className={`difficulty-badge ${course.difficulty.toLowerCase()}`}>
                            {course.difficulty}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="course-description">
                      {course.description || 'No description available'}
                    </p>
                    
                    <div className="course-meta">
                      <div className="meta-item">
                        <FiBook className="meta-icon" />
                        <span>{course.lecturePages?.length || 0} Lectures</span>
                      </div>
                      <div className="meta-item">
                        <FiAward className="meta-icon" />
                        <span>{course.quizzes?.length || 0} Quizzes</span>
                      </div>
                      <div className="meta-item">
                        <FiUsers className="meta-icon" />
                        <span>{course.enrollmentCount || 0} Employees</span>
                      </div>
                      {course.duration && (
                        <div className="meta-item">
                          <FiClock className="meta-icon" />
                          <span>{course.duration}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="course-actions">
                      <button 
                        onClick={() => enrollInCourse(course._id)}
                        className="btn-primary"
                      >
                        <FiPlus /> Enroll Now
                      </button>
                      <Link 
                        to={`/course/${course._id}`} 
                        className="btn-secondary"
                      >
                        <FiEye /> View Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;