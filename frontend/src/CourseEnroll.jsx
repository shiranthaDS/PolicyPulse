import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
import { 
  FiBook, 
  FiClock, 
  FiUsers, 
  FiStar, 
  FiPlay, 
  FiCheckCircle, 
  FiHelpCircle,
  FiUser,
  FiAward,
  FiLoader
} from 'react-icons/fi';
import './CourseEnroll.css';

const CourseEnroll = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, enrollInCourse } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');
  const [isEnrolled, setIsEnrolled] = useState(false);

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (user && course) {
      checkEnrollmentStatus();
    }
  }, [user, course]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
      if (response.data.success) {
        setCourse(response.data.data);
      } else {
        setError('Course not found');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = () => {
    if (user && user.enrolledCourses) {
      const enrolled = user.enrolledCourses.some(
        enrollment => enrollment.course && (enrollment.course._id === courseId || enrollment.course === courseId)
      );
      setIsEnrolled(enrolled);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const result = await enrollInCourse(courseId);
      if (result.success) {
        setIsEnrolled(true);
        // Navigate to course workspace
        navigate(`/course/${courseId}/workspace`);
      } else {
        setError(result.message);
      }
    } catch (error) {
      setError('Enrollment failed. Please try again.');
    } finally {
      setEnrolling(false);
    }
  };

  const handleStartCourse = () => {
    navigate(`/course/${courseId}/workspace`);
  };

  if (loading) {
    return (
      <div className="course-enroll-container">
        <div className="loading-state">
          <FiLoader className="spinning" size={48} />
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-enroll-container">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-enroll-container">
        <div className="error-state">
          <h2>Course Not Found</h2>
          <p>The course you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-enroll-container">
      <div className="course-enroll-content">
        {/* Course Header */}
        <div className="course-header">
          <div className="course-header-content">
            <h1>{course.courseName}</h1>
            <p className="course-description">{course.courseDescription}</p>
            
            <div className="course-meta">
              <div className="meta-item">
                <FiClock />
                <span>{course.duration || 'N/A'} hours</span>
              </div>
              <div className="meta-item">
                <FiUsers />
                <span>{course.enrollmentCount || 0} employees</span>
              </div>
              <div className="meta-item">
                <FiStar />
                <span>{course.rating?.average?.toFixed(1) || '0.0'} rating</span>
              </div>
              <div className="meta-item">
                <FiAward />
                <span className={`difficulty-badge ${course.difficulty}`}>
                  {course.difficulty}
                </span>
              </div>
            </div>

            {course.category && (
              <div className="course-category">
                <span className="category-badge">{course.category}</span>
              </div>
            )}
          </div>

          <div className="course-actions">
            {isAuthenticated ? (
              isEnrolled ? (
                <button 
                  onClick={handleStartCourse}
                  className="btn-primary large"
                >
                  <FiPlay /> Continue Learning
                </button>
              ) : (
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary large"
                >
                  {enrolling ? (
                    <>
                      <FiLoader className="spinning" /> Enrolling...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle /> Enroll Now
                    </>
                  )}
                </button>
              )
            ) : (
              <div className="auth-prompt">
                <p>Please log in to enroll in this course</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="btn-primary large"
                >
                  <FiUser /> Login to Enroll
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Course Content Overview */}
        <div className="course-content-overview">
          <div className="content-section">
            <h2><FiBook /> Course Content</h2>
            
            {/* Lecture Pages */}
            <div className="content-group">
              <h3>Lecture Materials</h3>
              <div className="content-list">
                {course.lecturePages?.map((page, index) => (
                  <div key={page.id} className="content-item">
                    <div className="content-icon">
                      <FiBook />
                    </div>
                    <div className="content-details">
                      <h4>{page.title}</h4>
                      <p>Page {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quizzes */}
            <div className="content-group">
              <h3>Assessments</h3>
              <div className="content-list">
                {course.quizzes?.map((quiz, index) => (
                  <div key={quiz.id} className="content-item">
                    <div className="content-icon">
                      <FiHelpCircle />
                    </div>
                    <div className="content-details">
                      <h4>{quiz.title}</h4>
                      <p>{quiz.questions?.length || 0} questions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Course Statistics */}
          <div className="course-stats">
            <h3>Course Overview</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{course.lecturePages?.length || 0}</div>
                <div className="stat-label">Lecture Pages</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{course.quizzes?.length || 0}</div>
                <div className="stat-label">Quizzes</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">
                  {course.quizzes?.reduce((total, quiz) => total + (quiz.questions?.length || 0), 0) || 0}
                </div>
                <div className="stat-label">Total Questions</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{course.enrollmentCount || 0}</div>
                <div className="stat-label">Employees Enrolled</div>
              </div>
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="learning-outcomes">
          <h2>What You'll Learn</h2>
          <div className="outcomes-grid">
            <div className="outcome-item">
              <FiCheckCircle className="outcome-icon" />
              <span>Master the fundamentals of {course.category || 'the subject'}</span>
            </div>
            <div className="outcome-item">
              <FiCheckCircle className="outcome-icon" />
              <span>Complete hands-on exercises and assessments</span>
            </div>
            <div className="outcome-item">
              <FiCheckCircle className="outcome-icon" />
              <span>Build practical skills through interactive content</span>
            </div>
            <div className="outcome-item">
              <FiCheckCircle className="outcome-icon" />
              <span>Earn a certificate of completion</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseEnroll;