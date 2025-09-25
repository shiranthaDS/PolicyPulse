import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import axios from 'axios';
import {
  FiBook,
  FiAward,
  FiUsers,
  FiClock,
  FiPlus,
  FiEye,
  FiSearch,
  FiFilter,
  FiGrid,
  FiList
} from 'react-icons/fi';
import './CoursesPage.css';

const CoursesPage = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'employee') {
      navigate('/');
      return;
    }
    fetchCourses();
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, difficultyFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch user profile to get enrolled courses
      const profileResponse = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fetch all courses
      const coursesResponse = await axios.get(`${API_BASE_URL}/courses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (profileResponse.data.success && coursesResponse.data.success) {
        const enrolledCourses = profileResponse.data.data.enrolledCourses || [];
        const allCourses = coursesResponse.data.data || [];
        
        // Get enrolled course IDs
        const enrolledIds = enrolledCourses.map(enrollment => 
          enrollment.course ? (enrollment.course._id || enrollment.course) : null
        ).filter(Boolean);
        
        setEnrolledCourseIds(enrolledIds);
        setCourses(allCourses);
        setFilteredCourses(allCourses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by difficulty
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(course =>
        course.difficulty?.toLowerCase() === difficultyFilter.toLowerCase()
      );
    }

    setFilteredCourses(filtered);
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
        // Update enrolled course IDs
        setEnrolledCourseIds(prev => [...prev, courseId]);
        setError('');
        // Show success message
        alert('Successfully enrolled in the course!');
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
      setError('Failed to enroll in course. Please try again.');
    }
  };

  const isEnrolled = (courseId) => {
    return enrolledCourseIds.includes(courseId);
  };

  if (loading) {
    return (
      <div className="courses-page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-page-container">
      {/* Header */}
      <div className="courses-page-header">
        <div className="header-content">
          <h1>Available Courses</h1>
          <p>Explore and enroll in courses to enhance your skills</p>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {/* Filters and Search */}
      <div className="courses-controls">
        <div className="search-section">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <FiFilter className="filter-icon" />
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <FiGrid />
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Course Stats */}
      <div className="courses-stats">
        <div className="stat">
          <span className="stat-number">{filteredCourses.length}</span>
          <span className="stat-label">Total Courses</span>
        </div>
        <div className="stat">
          <span className="stat-number">
            {filteredCourses.filter(course => !isEnrolled(course._id)).length}
          </span>
          <span className="stat-label">Available to Enroll</span>
        </div>
        <div className="stat">
          <span className="stat-number">{enrolledCourseIds.length}</span>
          <span className="stat-label">Already Enrolled</span>
        </div>
      </div>

      {/* Courses Content */}
      <div className="courses-content">
        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <FiBook className="empty-icon" />
            <h3>No courses found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className={`courses-grid ${viewMode}`}>
            {filteredCourses.filter(course => course && course.courseName).map((course) => (
              <div key={course._id} className={`course-card ${isEnrolled(course._id) ? 'enrolled' : 'available'}`}>
                <div className="course-header">
                  <h3>{course.courseName}</h3>
                  <div className="course-badges">
                    {course.difficulty && (
                      <span className={`difficulty-badge ${course.difficulty.toLowerCase()}`}>
                        {course.difficulty}
                      </span>
                    )}
                    {isEnrolled(course._id) && (
                      <span className="enrolled-badge">
                        Enrolled
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
                  {isEnrolled(course._id) ? (
                    <Link 
                      to={`/course/${course._id}/workspace`} 
                      className="btn-primary"
                    >
                      <FiBook /> Continue Learning
                    </Link>
                  ) : (
                    <button 
                      onClick={() => enrollInCourse(course._id)}
                      className="btn-primary"
                    >
                      <FiPlus /> Enroll Now
                    </button>
                  )}
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
  );
};

export default CoursesPage;