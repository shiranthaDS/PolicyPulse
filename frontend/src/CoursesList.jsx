import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
import { 
  FiBook, 
  FiClock, 
  FiUsers, 
  FiStar, 
  FiTrash2, 
  FiPlay, 
  FiEye,
  FiCheck,
  FiX 
} from 'react-icons/fi';
import './CoursesList.css';

const CoursesList = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: '',
    published: 'all'
  });

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchCourses();
  }, [page, filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        published: filters.published, // Use the filter value
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.difficulty && { difficulty: filters.difficulty })
      });

      const response = await axios.get(`${API_BASE_URL}/courses?${queryParams}`);
      
      if (response.data.success) {
        setCourses(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
        setCourses(courses.filter(course => course._id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
        setError('Failed to delete course. Please try again.');
      }
    }
  };

  const togglePublish = async (courseId, currentStatus) => {
    try {
      await axios.patch(`${API_BASE_URL}/courses/${courseId}/publish`);
      setCourses(courses.map(course => 
        course._id === courseId 
          ? { ...course, isPublished: !currentStatus }
          : course
      ));
    } catch (error) {
      console.error('Error toggling course publication:', error);
      setError('Failed to update course status. Please try again.');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const isEnrolledInCourse = (courseId) => {
    if (!user || !user.enrolledCourses) return false;
    return user.enrolledCourses.some(
      enrollment => enrollment.course && (enrollment.course._id === courseId || enrollment.course === courseId)
    );
  };

  const getCourseProgress = (courseId) => {
    if (!user || !user.enrolledCourses) return 0;
    const enrollment = user.enrolledCourses.find(
      e => e.course && (e.course._id === courseId || e.course === courseId)
    );
    if (!enrollment || !enrollment.progress) return 0;
    
    // Calculate progress based on completed pages and quizzes
    const course = courses.find(c => c._id === courseId);
    if (!course) return 0;
    
    const totalContent = (course.lecturePages?.length || 0) + (course.quizzes?.length || 0);
    const completedContent = (enrollment.progress.completedPages?.length || 0) + 
                           (enrollment.progress.completedQuizzes?.length || 0);
    
    return totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
  };

  if ((loading && courses.length === 0) || authLoading) {
    return (
      <div className="courses-list-container">
        <div className="loading">
          <FiBook className="spinning" size={48} />
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-list-container">
      <div className="courses-header">
        <h1><FiBook /> All Courses</h1>
        
        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search courses..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          
          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <select
            value={filters.published}
            onChange={(e) => handleFilterChange('published', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Courses</option>
            <option value="true">Published Only</option>
            <option value="false">Drafts Only</option>
          </select>
          
          <input
            type="text"
            placeholder="Category..."
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="category-input"
          />
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {courses.length === 0 && !loading ? (
        <div className="no-courses">
          <FiBook size={64} />
          <h3>No courses found</h3>
          <p>Try adjusting your search filters or create a new course.</p>
        </div>
      ) : (
        <>
          <div className="courses-grid">
            {courses.map((course) => {
              const isEnrolled = isEnrolledInCourse(course._id);
              const progress = getCourseProgress(course._id);
              
              return (
                <div key={course._id} className={`course-card ${course.isPublished ? 'published' : 'draft'}`}>
                  <div className="course-card-header">
                    <h3>{course.courseName}</h3>
                    <div className="course-actions">
                      {/* Admin actions */}
                      <button
                        onClick={() => togglePublish(course._id, course.isPublished)}
                        className={`publish-btn ${course.isPublished ? 'published' : 'unpublished'}`}
                        title={course.isPublished ? 'Unpublish' : 'Publish'}
                      >
                        {course.isPublished ? <FiCheck /> : <FiX />}
                        {course.isPublished ? 'Published' : 'Draft'}
                      </button>
                      <button
                        onClick={() => deleteCourse(course._id)}
                        className="delete-btn-small"
                        title="Delete course"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  
                  <p className="course-description">
                    {course.courseDescription || 'No description available'}
                  </p>
                  
                  <div className="course-meta">
                    <div className="meta-item">
                      <FiClock size={16} />
                      <span>{course.duration || 'N/A'} hours</span>
                    </div>
                    
                    <div className="meta-item">
                      <FiBook size={16} />
                      <span>{course.lecturePages?.length || 0} pages</span>
                    </div>
                    
                    <div className="meta-item">
                      <FiUsers size={16} />
                      <span>{course.enrollmentCount || 0} enrolled</span>
                    </div>
                    
                    <div className="meta-item">
                      <FiStar size={16} />
                      <span>{course.rating?.average?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>

                  {/* Enrollment Status */}
                  {isAuthenticated && isEnrolled && (
                    <div className="enrollment-status">
                      <div className="progress-indicator">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{progress}% Complete</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="course-footer">
                    <div className="course-badges">
                      <span className={`difficulty-badge ${course.difficulty}`}>
                        {course.difficulty}
                      </span>
                      {course.category && (
                        <span className="category-badge">{course.category}</span>
                      )}
                    </div>
                    
                    <div className="quiz-info">
                      <span>{course.quizzes?.length || 0} Quiz(es)</span>
                      <span>
                        {course.quizzes?.reduce((total, quiz) => total + quiz.questions.length, 0) || 0} Questions
                      </span>
                    </div>
                  </div>

                  {/* Course Actions */}
                  <div className="course-card-actions">
                    {isAuthenticated && isEnrolled ? (
                      <Link 
                        to={`/course/${course._id}/workspace`} 
                        className="btn-primary"
                      >
                        <FiPlay /> Continue Learning
                      </Link>
                    ) : (
                      <Link 
                        to={`/course/${course._id}`} 
                        className="btn-secondary"
                      >
                        <FiEye /> View Course
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CoursesList;