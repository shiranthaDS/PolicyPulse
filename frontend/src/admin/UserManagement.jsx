import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiUsers, 
  FiSearch, 
  FiTrash2, 
  FiEye, 
  FiLoader,
  FiChevronLeft,
  FiChevronRight,
  FiBook,
  FiAward,
  FiFilter
} from 'react-icons/fi';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchUsers();
  }, [page, filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(filters.search && { search: filters.search }),
        ...(filters.role !== 'all' && { role: filters.role }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await axios.get(`${API_BASE_URL}/users/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('Failed to load users: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response) {
        // Server responded with error status
        const message = error.response.data?.message || `Server error: ${error.response.status}`;
        setError(`Failed to load users: ${message}`);
      } else if (error.request) {
        // Network error
        setError('Failed to load users: Network error. Please check your connection.');
      } else {
        // Other error
        setError('Failed to load users: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/users/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setUsers(users.filter(user => user._id !== userId));
        setShowUserDetails(false);
        setSelectedUser(null);
      } catch (error) {
        console.error('Error deleting user:', error);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const calculateUserProgress = (user) => {
    if (!user.enrolledCourses || user.enrolledCourses.length === 0) {
      return { totalCourses: 0, averageProgress: 0, completedCourses: 0 };
    }

    let totalProgress = 0;
    let completedCourses = 0;
    let validCoursesCount = 0;

    user.enrolledCourses.forEach(enrollment => {
      const course = enrollment.course;
      
      // Skip enrollments with null courses
      if (!course) return;
      
      validCoursesCount++;
      const progress = enrollment.progress || {};
      
      const totalContent = (course.lecturePages?.length || 0) + (course.quizzes?.length || 0);
      const completedContent = (progress.completedPages?.length || 0) + 
                              (progress.completedQuizzes?.length || 0);
      
      const courseProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
      totalProgress += courseProgress;
      
      if (courseProgress === 100) {
        completedCourses++;
      }
    });

    return {
      totalCourses: validCoursesCount,
      averageProgress: validCoursesCount > 0 ? totalProgress / validCoursesCount : 0,
      completedCourses
    };
  };

  const getQuizScores = (user) => {
    const scores = [];
    
    user.enrolledCourses?.forEach(enrollment => {
      // Skip enrollments with null courses
      if (!enrollment.course) return;
      
      const progress = enrollment.progress || {};
      const completedQuizzes = progress.completedQuizzes || [];
      
      completedQuizzes.forEach(quiz => {
        scores.push({
          courseName: enrollment.course.courseName,
          score: quiz.score || 0,
          completedAt: quiz.completedAt
        });
      });
    });

    return scores.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  };

  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  if (loading && users.length === 0) {
    return (
      <div className="user-management-container">
        <div className="loading-state">
          <FiLoader className="spinning" size={48} />
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management-container">
      <div className="user-management-header">
        <h1><FiUsers /> User Management</h1>
        
        {/* Filters */}
        <div className="filters">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="admin">Admins</option>
          </select>
          
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="filter-select"
          >
            <option value="createdAt">Date Joined</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
          
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="filter-select"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="alert-close">×</button>
        </div>
      )}

      {/* Users Table */}
      <div className="users-table-container">
        <div className="users-table">
          <div className="table-header">
            <div className="header-cell">User</div>
            <div className="header-cell">Role</div>
            <div className="header-cell">Enrollments</div>
            <div className="header-cell">Progress</div>
            <div className="header-cell">Joined</div>
            <div className="header-cell">Actions</div>
          </div>
          
          <div className="table-body">
            {users.map((user) => {
              const userStats = calculateUserProgress(user);
              
              return (
                <div key={user._id} className="table-row">
                  <div className="table-cell user-cell">
                    <div className="user-avatar">
                      <FiUsers />
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <span className={`role-badge ${user.role}`}>
                      {user.role}
                    </span>
                  </div>
                  
                  <div className="table-cell">
                    <div className="enrollment-info">
                      <span className="enrollment-count">
                        {userStats.totalCourses} courses
                      </span>
                      <span className="completed-count">
                        {userStats.completedCourses} completed
                      </span>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${userStats.averageProgress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {Math.round(userStats.averageProgress)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="table-cell">
                    <span className="join-date">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="table-cell actions-cell">
                    <button
                      onClick={() => viewUserDetails(user)}
                      className="action-btn view-btn"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="action-btn delete-btn"
                        title="Delete User"
                      >
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="pagination-btn"
        >
          <FiChevronLeft /> Previous
        </button>
        
        <span className="pagination-info">
          Page {page} of {totalPages}
        </span>
        
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="pagination-btn"
        >
          Next <FiChevronRight />
        </button>
      </div>

      {/* User Details Modal */}
      {showUserDetails && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
          onDelete={deleteUser}
        />
      )}
    </div>
  );
};

// User Details Modal Component
const UserDetailsModal = ({ user, onClose, onDelete }) => {
  const userStats = user.enrolledCourses ? user.enrolledCourses.reduce((stats, enrollment) => {
    const course = enrollment.course;
    
    // Skip enrollments with null courses
    if (!course) return stats;
    
    const progress = enrollment.progress || {};
    
    const totalContent = (course.lecturePages?.length || 0) + (course.quizzes?.length || 0);
    const completedContent = (progress.completedPages?.length || 0) + 
                            (progress.completedQuizzes?.length || 0);
    
    const courseProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
    
    return {
      ...stats,
      totalCourses: stats.totalCourses + 1,
      totalProgress: stats.totalProgress + courseProgress,
      completedCourses: courseProgress === 100 ? stats.completedCourses + 1 : stats.completedCourses
    };
  }, { totalCourses: 0, totalProgress: 0, completedCourses: 0 }) : { totalCourses: 0, totalProgress: 0, completedCourses: 0 };

  const averageProgress = userStats.totalCourses > 0 ? userStats.totalProgress / userStats.totalCourses : 0;

  const getQuizScores = () => {
    const scores = [];
    
    user.enrolledCourses?.forEach(enrollment => {
      // Skip enrollments with null courses
      if (!enrollment.course) return;
      
      const progress = enrollment.progress || {};
      const completedQuizzes = progress.completedQuizzes || [];
      
      completedQuizzes.forEach(quiz => {
        scores.push({
          courseName: enrollment.course.courseName,
          score: quiz.score || 0,
          completedAt: quiz.completedAt
        });
      });
    });

    return scores.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  };

  const quizScores = getQuizScores();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Details</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        
        <div className="modal-body">
          {/* User Info */}
          <div className="user-details-section">
            <div className="user-profile">
              <div className="user-avatar large">
                <FiUsers />
              </div>
              <div className="user-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <span className={`role-badge ${user.role}`}>{user.role}</span>
                <p className="join-date">
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="progress-overview">
            <div className="stat-item">
              <FiBook className="stat-icon" />
              <div className="stat-content">
                <span className="stat-number">{userStats.totalCourses}</span>
                <span className="stat-label">Enrolled Courses</span>
              </div>
            </div>
            
            <div className="stat-item">
              <FiAward className="stat-icon" />
              <div className="stat-content">
                <span className="stat-number">{userStats.completedCourses}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>
            
            <div className="stat-item">
              <div className="progress-circle">
                <span>{Math.round(averageProgress)}%</span>
              </div>
              <div className="stat-content">
                <span className="stat-label">Average Progress</span>
              </div>
            </div>
          </div>

          {/* Enrolled Courses */}
          <div className="courses-section">
            <h4>Enrolled Courses</h4>
            <div className="courses-list">
              {user.enrolledCourses?.filter(enrollment => enrollment.course).map((enrollment) => {
                const course = enrollment.course;
                const progress = enrollment.progress || {};
                
                const totalContent = (course.lecturePages?.length || 0) + (course.quizzes?.length || 0);
                const completedContent = (progress.completedPages?.length || 0) + 
                                        (progress.completedQuizzes?.length || 0);
                
                const courseProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
                
                return (
                  <div key={course._id} className="course-item">
                    <div className="course-info">
                      <h5>{course.courseName}</h5>
                      <p>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
                    </div>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${courseProgress}%` }}
                        ></div>
                      </div>
                      <span>{Math.round(courseProgress)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiz Scores */}
          {quizScores.length > 0 && (
            <div className="quiz-scores-section">
              <h4>Quiz Scores</h4>
              <div className="quiz-scores-table">
                <div className="quiz-header">
                  <span>Course</span>
                  <span>Score</span>
                  <span>Date</span>
                </div>
                {quizScores.map((quiz, index) => (
                  <div key={index} className="quiz-row">
                    <span className="course-name">{quiz.courseName}</span>
                    <span className={`score ${quiz.score >= 60 ? 'passed' : 'failed'}`}>
                      {quiz.score}%
                    </span>
                    <span className="quiz-date">
                      {new Date(quiz.completedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          {user.role !== 'admin' && (
            <button
              onClick={() => onDelete(user._id)}
              className="btn-danger"
            >
              <FiTrash2 /> Delete User
            </button>
          )}
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;