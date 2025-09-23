import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  FiUsers,
  FiDownload,
  FiSearch,
  FiFilter,
  FiEye,
  FiTrash2,
  FiRefreshCw,
  FiFileText,
  FiShield,
  FiBarChart2,
  FiCalendar,
  FiX
} from 'react-icons/fi';
import './SecurityManagerDashboard.css';

const SecurityManagerDashboard = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    fetchUsers();
  }, []);

  // Check if user is security manager
  if (!isAuthenticated || user?.role !== 'securitymanager') {
    return <Navigate to="/login" replace />;
  }

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/users/admin/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/users/admin/users/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.data.success) {
          setUsers(users.filter(user => user._id !== userId));
          setShowModal(false);
          setSelectedUser(null);
        }
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

  const generatePDFReport = async () => {
    setPdfGenerating(true);
    
    try {
      console.log('Generating comprehensive user management PDF report...');
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      // Header with styling
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, pageWidth, 30, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('PolicyPulse Learning - User Management Report', 14, 20);
      
      // Report metadata
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 40);
      doc.text(`Generated by: ${user?.name || 'Security Manager'} (Security Manager)`, 14, 46);
      doc.text(`Total Records: ${users.length} users`, 14, 52);
      
      let yPosition = 65;

      // Summary Statistics Section
      doc.setFillColor(240, 248, 255);
      doc.rect(14, yPosition - 5, pageWidth - 28, 35, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('User Statistics Summary', 18, yPosition + 5);
      
      const totalUsers = users.length;
      const adminUsers = users.filter(u => u.role === 'admin').length;
      const studentUsers = users.filter(u => u.role === 'employee').length;
      const instructorUsers = users.filter(u => u.role === 'instructor').length;
      const securityManagerUsers = users.filter(u => u.role === 'securitymanager').length;
      const activeUsers = users.filter(u => u.isActive).length;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Users: ${totalUsers}`, 18, yPosition + 15);
      doc.text(`Active Users: ${activeUsers}`, 18, yPosition + 22);
      doc.text(`Employees: ${studentUsers}`, 90, yPosition + 15);
      doc.text(`Instructors: ${instructorUsers}`, 90, yPosition + 22);
      doc.text(`Administrators: ${adminUsers}`, 140, yPosition + 15);
      doc.text(`Security Managers: ${securityManagerUsers}`, 140, yPosition + 22);
      
      yPosition += 45;

      // Prepare user table data
      console.log('Processing user data for table...');
      const tableData = users.map((userData, index) => {
        console.log(`Processing user ${index + 1}: ${userData.name}`);
        
        try {
          const progress = calculateUserProgress(userData);
          const quizScores = getQuizScores(userData);
          const avgQuizScore = quizScores.length > 0 
            ? (quizScores.reduce((sum, score) => sum + score.score, 0) / quizScores.length).toFixed(1)
            : 'N/A';
          
          return [
            userData.name || 'N/A',
            userData.email || 'N/A',
            (userData.role || 'N/A').charAt(0).toUpperCase() + (userData.role || 'N/A').slice(1),
            userData.isActive ? 'Active' : 'Inactive',
            progress.totalCourses.toString(),
            `${progress.averageProgress.toFixed(1)}%`,
            progress.completedCourses.toString(),
            avgQuizScore,
            userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'
          ];
        } catch (userError) {
          console.error(`Error processing user ${userData.name}:`, userError);
          return [
            userData.name || 'N/A',
            userData.email || 'N/A',
            (userData.role || 'N/A').charAt(0).toUpperCase() + (userData.role || 'N/A').slice(1),
            userData.isActive ? 'Active' : 'Inactive',
            '0',
            '0%',
            '0',
            'N/A',
            userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'
          ];
        }
      });

      console.log('Creating detailed user table...');
      
      // User Details Table
      autoTable(doc, {
        head: [['Name', 'Email', 'Role', 'Status', 'Enrolled', 'Avg Progress', 'Completed', 'Quiz Avg', 'Joined']],
        body: tableData,
        startY: yPosition,
        theme: 'striped',
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 8,
          cellPadding: 2,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 22, halign: 'left' },   // Name
          1: { cellWidth: 32, halign: 'left' },   // Email
          2: { cellWidth: 18, halign: 'center' }, // Role
          3: { cellWidth: 16, halign: 'center' }, // Status
          4: { cellWidth: 16, halign: 'center' }, // Enrolled
          5: { cellWidth: 18, halign: 'center' }, // Progress
          6: { cellWidth: 16, halign: 'center' }, // Completed
          7: { cellWidth: 16, halign: 'center' }, // Quiz Score
          8: { cellWidth: 18, halign: 'center' }  // Joined
        },
        margin: { left: 14, right: 14 },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        didDrawPage: function (data) {
          // Page footer
          doc.setFontSize(8);
          doc.setTextColor(128);
          const pageNumber = doc.internal.getNumberOfPages();
          doc.text(
            `Page ${data.pageNumber} of ${pageNumber}`,
            pageWidth - 25,
            pageHeight - 10
          );
          doc.text(
            'PolicyPulse Learning Management System',
            14,
            pageHeight - 10
          );
        }
      });

      // Add course enrollment details if there's space
      if (doc.lastAutoTable.finalY < pageHeight - 60) {
        yPosition = doc.lastAutoTable.finalY + 15;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Course Enrollments', 14, yPosition);
        yPosition += 5;

        const enrollmentData = [];
        users.forEach(userData => {
          userData.enrolledCourses?.forEach(enrollment => {
            if (enrollment.course && enrollmentData.length < 10) { // Limit to 10 most recent
              const progress = enrollment.progress || {};
              const totalContent = (enrollment.course.lecturePages?.length || 0) + 
                                 (enrollment.course.quizzes?.length || 0);
              const completedContent = (progress.completedPages?.length || 0) + 
                                     (progress.completedQuizzes?.length || 0);
              const courseProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;

              enrollmentData.push([
                userData.name,
                enrollment.course.courseName,
                `${courseProgress.toFixed(1)}%`,
                enrollment.isCompleted ? 'Completed' : 'In Progress',
                new Date(enrollment.enrolledAt).toLocaleDateString()
              ]);
            }
          });
        });

        if (enrollmentData.length > 0) {
          autoTable(doc, {
            head: [['Employee Name', 'Course Name', 'Progress', 'Status', 'Enrolled Date']],
            body: enrollmentData,
            startY: yPosition + 5,
            theme: 'grid',
            headStyles: {
              fillColor: [46, 204, 113],
              textColor: 255,
              fontSize: 9,
              fontStyle: 'bold'
            },
            bodyStyles: {
              fontSize: 8,
              cellPadding: 2
            },
            columnStyles: {
              0: { cellWidth: 35 },
              1: { cellWidth: 45 },
              2: { cellWidth: 20 },
              3: { cellWidth: 25 },
              4: { cellWidth: 25 }
            },
            margin: { left: 14, right: 14 }
          });
        }
      }

      // Save the PDF with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const fileName = `PolicyPulse_UserManagement_Report_${timestamp}.pdf`;
      console.log('Saving comprehensive PDF report as:', fileName);
      doc.save(fileName);
      
      console.log('✅ Comprehensive PDF report generated successfully!');
      setError(''); // Clear any previous errors
      
    } catch (error) {
      console.error('❌ Error generating comprehensive PDF:', error);
      setError(`Failed to generate PDF report: ${error.message}`);
    } finally {
      setPdfGenerating(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="security-dashboard">
        <div className="loading-state">
          <FiRefreshCw className="spinning" size={48} />
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="security-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="title-section">
            <FiShield className="shield-icon" />
            <div>
              <h1>Security Manager Dashboard</h1>
              <p>Advanced User Management & Reporting</p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={generatePDFReport}
              disabled={pdfGenerating}
              className="btn-pdf"
            >
              {pdfGenerating ? (
                <>
                  <FiRefreshCw className="spinning" />
                  Generating...
                </>
              ) : (
                <>
                  <FiDownload />
                  Export PDF Report
                </>
              )}
            </button>
            
            <button onClick={() => fetchUsers()} className="btn-refresh">
              <FiRefreshCw />
              Refresh
            </button>
            
            <button onClick={logout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError('')} className="close-error">×</button>
        </div>
      )}

      <div className="dashboard-stats">
        <div className="stat-card">
          <FiUsers className="stat-icon" />
          <div className="stat-info">
            <h3>{users.length}</h3>
            <p>Total Users</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FiBarChart2 className="stat-icon" />
          <div className="stat-info">
            <h3>{users.filter(u => u.role === 'employee').length}</h3>
            <p>Employees</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FiFileText className="stat-icon" />
          <div className="stat-info">
            <h3>{users.filter(u => u.role === 'instructor').length}</h3>
            <p>Instructors</p>
          </div>
        </div>
        
        <div className="stat-card">
          <FiShield className="stat-icon" />
          <div className="stat-info">
            <h3>{users.filter(u => u.role === 'admin').length}</h3>
            <p>Administrators</p>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-box">
          <FiFilter className="filter-icon" />
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="employee">Employees</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      <div className="users-table-section">
        <h2>User Management ({filteredUsers.length} users)</h2>
        
        <div className="table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Enrolled Courses</th>
                <th>Avg Progress</th>
                <th>Quiz Performance</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const progress = calculateUserProgress(user);
                const quizScores = getQuizScores(user);
                const avgQuizScore = quizScores.length > 0 
                  ? (quizScores.reduce((sum, score) => sum + score.score, 0) / quizScores.length).toFixed(1)
                  : 'N/A';

                return (
                  <tr key={user._id} className={!user.isActive ? 'inactive-user' : ''}>
                    <td className="user-info">
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <span className="user-name">{user.name}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{progress.totalCourses}</td>
                    <td>
                      <div className="progress-display">
                        <div className="progress-bar-mini">
                          <div 
                            className="progress-fill-mini" 
                            style={{ width: `${progress.averageProgress}%` }}
                          ></div>
                        </div>
                        <span>{progress.averageProgress.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>{avgQuizScore}%</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="actions">
                      <button 
                        onClick={() => handleViewUser(user)}
                        className="btn-view"
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button 
                        onClick={() => deleteUser(user._id)}
                        className="btn-delete"
                        title="Delete User"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
          onDelete={deleteUser}
        />
      )}
    </div>
  );
};

// Enhanced User Details Modal
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
      <div className="modal-content security-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>User Security Profile</h2>
          <button onClick={onClose} className="modal-close">
            <FiX />
          </button>
        </div>

        <div className="modal-body">
          <div className="user-profile-section">
            <div className="profile-header">
              <div className="profile-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
                <div className="profile-badges">
                  <span className={`role-badge ${user.role}`}>
                    {user.role}
                  </span>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">
                  <FiCalendar />
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Updated</span>
                <span className="stat-value">
                  {new Date(user.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Email Verified</span>
                <span className="stat-value">
                  {user.emailVerified ? '✅ Verified' : '❌ Not Verified'}
                </span>
              </div>
            </div>
          </div>

          {/* Learning Statistics */}
          <div className="learning-stats-section">
            <h4>Learning Analytics</h4>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>{userStats.totalCourses}</h3>
                <p>Enrolled Courses</p>
              </div>
              <div className="stat-card">
                <h3>{Math.round(averageProgress)}%</h3>
                <p>Average Progress</p>
              </div>
              <div className="stat-card">
                <h3>{userStats.completedCourses}</h3>
                <p>Completed Courses</p>
              </div>
              <div className="stat-card">
                <h3>{quizScores.length}</h3>
                <p>Quizzes Taken</p>
              </div>
            </div>
          </div>

          {/* Quiz Performance */}
          {quizScores.length > 0 && (
            <div className="quiz-performance-section">
              <h4>Recent Quiz Performance</h4>
              <div className="quiz-scores">
                {quizScores.slice(0, 5).map((quiz, index) => (
                  <div key={index} className="quiz-score-item">
                    <div className="quiz-info">
                      <span className="course-name">{quiz.courseName}</span>
                      <span className="quiz-date">
                        {new Date(quiz.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="quiz-score">
                      <span className={`score ${quiz.score >= 80 ? 'excellent' : quiz.score >= 60 ? 'good' : 'needs-improvement'}`}>
                        {quiz.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button 
            onClick={() => onDelete(user._id)} 
            className="btn-danger"
          >
            <FiTrash2 />
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

export default SecurityManagerDashboard;