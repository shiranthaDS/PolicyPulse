import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
import MDEditor from '@uiw/react-md-editor';
import { normalizeYouTubeUrl } from './utils/video';
import {
  FiBook,
  FiHelpCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiCircle,
  FiHome,
  FiAward,
  FiLoader,
  FiX,
  FiRefreshCw
} from 'react-icons/fi';
import './CourseWorkspace.css';

const CourseWorkspace = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProgress } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [currentPageType, setCurrentPageType] = useState('lecture'); // 'lecture' or 'quiz'
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProgress, setUserProgress] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResults, setQuizResults] = useState(null);
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL = 'http://localhost:5001/api';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchCourseData();
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    if (course && user) {
      initializeProgress();
    }
  }, [course, user]);

  const fetchCourseData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses/${courseId}`);
      if (response.data.success) {
        setCourse(response.data.data);
      } else {
        setError('Course not found');
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const initializeProgress = () => {
    if (user?.enrolledCourses) {
      const enrollment = user.enrolledCourses.find(
        e => e.course && (e.course._id === courseId || e.course === courseId)
      );
      if (enrollment) {
        setUserProgress(enrollment.progress);
        // Set current page based on progress
        if (enrollment.progress?.currentPage !== undefined) {
          setCurrentPageIndex(enrollment.progress.currentPage);
        }
        if (enrollment.progress?.currentPageType) {
          setCurrentPageType(enrollment.progress.currentPageType);
        }
      }
    }
  };

  const getAllContent = () => {
    if (!course) return [];
    
    const content = [];
    
    // Add lecture pages
    course.lecturePages?.forEach((page, index) => {
      content.push({
        type: 'lecture',
        index,
        title: page.title,
        data: page,
        id: page.id
      });
    });
    
    // Add quizzes
    course.quizzes?.forEach((quiz, index) => {
      content.push({
        type: 'quiz',
        index,
        title: quiz.title,
        data: quiz,
        id: quiz.id
      });
    });
    
    return content;
  };

  const getCurrentContent = () => {
    const allContent = getAllContent();
    return allContent.find(item => 
      item.type === currentPageType && item.index === currentPageIndex
    );
  };

  const updateUserProgress = async (pageIndex, pageType, completed = false) => {
    try {
      if (completed) {
        if (pageType === 'lecture') {
          const pageId = course.lecturePages[pageIndex]?.id;
          if (pageId) {
            // Call the backend API to mark page as completed
            const response = await axios.put(
              `${API_BASE_URL}/users/progress/${courseId}`,
              { pageId, action: 'complete_page' },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );
            
            if (response.data.success) {
              // Update local progress state
              const updatedProgress = {
                ...userProgress,
                completedPages: [...(userProgress?.completedPages || []), { pageId, completedAt: new Date() }],
                currentPage: pageIndex.toString(),
                overallProgress: response.data.data.overallProgress
              };
              setUserProgress(updatedProgress);
            }
          }
        } else if (pageType === 'quiz') {
          // Quiz completion is handled in submitQuiz function
          return;
        }
      } else {
        // Just update current page position
        const response = await axios.put(
          `${API_BASE_URL}/users/progress/${courseId}`,
          { pageId: pageIndex.toString(), action: 'update_position' },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        
        if (response.data.success) {
          setUserProgress(prev => ({
            ...prev,
            currentPage: pageIndex.toString()
          }));
        }
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const navigateToContent = (type, index) => {
    setCurrentPageType(type);
    setCurrentPageIndex(index);
    updateUserProgress(index, type);
    setQuizResults(null);
    setShowQuizResults(false);
    setQuizAnswers({});
  };

  const navigateNext = () => {
    const allContent = getAllContent();
    const currentIndex = allContent.findIndex(item => 
      item.type === currentPageType && item.index === currentPageIndex
    );
    
    if (currentIndex < allContent.length - 1) {
      const nextContent = allContent[currentIndex + 1];
      navigateToContent(nextContent.type, nextContent.index);
    }
  };

  const navigatePrevious = () => {
    const allContent = getAllContent();
    const currentIndex = allContent.findIndex(item => 
      item.type === currentPageType && item.index === currentPageIndex
    );
    
    if (currentIndex > 0) {
      const prevContent = allContent[currentIndex - 1];
      navigateToContent(prevContent.type, prevContent.index);
    }
  };

  const handleQuizAnswer = (questionIndex, answerIndex) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const submitQuiz = async () => {
    const currentQuiz = course.quizzes[currentPageIndex];
    if (!currentQuiz) return;

    let score = 0;
    const totalQuestions = currentQuiz.questions.length;

    currentQuiz.questions.forEach((question, index) => {
      if (quizAnswers[index] === question.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / totalQuestions) * 100);
    const results = {
      score: percentage,
      correct: score,
      total: totalQuestions,
      passed: percentage >= 60
    };

    setQuizResults(results);
    setShowQuizResults(true);

    // Submit quiz to backend
    try {
      const response = await axios.post(
        `${API_BASE_URL}/users/quiz/${courseId}/${currentQuiz.id}`,
        {
          answers: Object.keys(quizAnswers).map((questionIndex) => ({
            questionId: currentQuiz.questions[questionIndex].id || questionIndex,
            selectedAnswer: quizAnswers[questionIndex],
            isCorrect: quizAnswers[questionIndex] === currentQuiz.questions[questionIndex].correctAnswer
          })),
          score: percentage,
          totalQuestions
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      if (response.data.success) {
        // Update local progress state
        const updatedProgress = {
          ...userProgress,
          completedQuizzes: [...(userProgress?.completedQuizzes || []), {
            quizId: currentQuiz.id,
            score: percentage,
            totalQuestions,
            completedAt: new Date()
          }],
          overallProgress: response.data.data.overallProgress
        };
        setUserProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  const isContentCompleted = (type, index, id) => {
    if (!userProgress) return false;
    
    if (type === 'lecture') {
      return userProgress.completedPages?.some(page => page.pageId === id);
    } else if (type === 'quiz') {
      return userProgress.completedQuizzes?.some(q => q.quizId === id);
    }
    return false;
  };

  const calculateOverallProgress = () => {
    if (!course || !userProgress) return 0;
    
    const totalContent = (course.lecturePages?.length || 0) + (course.quizzes?.length || 0);
    const completedContent = (userProgress.completedPages?.length || 0) + 
                           (userProgress.completedQuizzes?.length || 0);
    
    return totalContent > 0 ? Math.round((completedContent / totalContent) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="workspace-container">
        <div className="loading-state">
          <FiLoader className="spinning" size={48} />
          <p>Loading course workspace...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="workspace-container">
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

  const currentContent = getCurrentContent();
  const allContent = getAllContent();
  const currentGlobalIndex = allContent.findIndex(item => 
    item.type === currentPageType && item.index === currentPageIndex
  );

  return (
    <div className="workspace-container">
      {/* Sidebar */}
      <div className={`workspace-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <FiX /> : <FiBook />}
          </button>
          {sidebarOpen && (
            <div className="course-info">
              <h3>{course?.courseName}</h3>
              <div className="progress-indicator">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateOverallProgress()}%` }}
                  ></div>
                </div>
                <span>{calculateOverallProgress()}% Complete</span>
              </div>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="sidebar-content">
            <button 
              className="home-button"
              onClick={() => navigate('/')}
            >
              <FiHome /> Back to Courses
            </button>

            <div className="content-navigation">
              {/* Lecture Pages */}
              {course?.lecturePages?.length > 0 && (
                <div className="nav-section">
                  <h4><FiBook /> Lectures</h4>
                  {course.lecturePages.map((page, index) => (
                    <button
                      key={page.id}
                      className={`nav-item ${
                        currentPageType === 'lecture' && currentPageIndex === index ? 'active' : ''
                      } ${isContentCompleted('lecture', index, page.id) ? 'completed' : ''}`}
                      onClick={() => navigateToContent('lecture', index)}
                    >
                      <div className="nav-item-content">
                        <div className="nav-item-icon">
                          {isContentCompleted('lecture', index, page.id) ? 
                            <FiCheckCircle /> : <FiCircle />
                          }
                        </div>
                        <span>{page.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Quizzes */}
              {course?.quizzes?.length > 0 && (
                <div className="nav-section">
                  <h4><FiHelpCircle /> Quizzes</h4>
                  {course.quizzes.map((quiz, index) => (
                    <button
                      key={quiz.id}
                      className={`nav-item ${
                        currentPageType === 'quiz' && currentPageIndex === index ? 'active' : ''
                      } ${isContentCompleted('quiz', index, quiz.id) ? 'completed' : ''}`}
                      onClick={() => navigateToContent('quiz', index)}
                    >
                      <div className="nav-item-content">
                        <div className="nav-item-icon">
                          {isContentCompleted('quiz', index, quiz.id) ? 
                            <FiCheckCircle /> : <FiHelpCircle />
                          }
                        </div>
                        <span>{quiz.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="workspace-main">
        <div className="content-header">
          <div className="content-title">
            <h1>{currentContent?.title}</h1>
            <span className="content-type">
              {currentPageType === 'lecture' ? <FiBook /> : <FiHelpCircle />}
              {currentPageType === 'lecture' ? 'Lecture' : 'Quiz'} 
              {currentGlobalIndex + 1} of {allContent.length}
            </span>
          </div>
          
          <div className="content-navigation-buttons">
            <button 
              onClick={navigatePrevious}
              disabled={currentGlobalIndex === 0}
              className="nav-btn"
            >
              <FiChevronLeft /> Previous
            </button>
            <button 
              onClick={navigateNext}
              disabled={currentGlobalIndex === allContent.length - 1}
              className="nav-btn"
            >
              Next <FiChevronRight />
            </button>
          </div>
        </div>

        <div className="content-body">
          {currentPageType === 'lecture' && currentContent && (
            <div className="lecture-content">
              {currentContent.data.videoUrl && (
                // Normalize and embed YouTube video; fallback if invalid.
                <div className="video-wrapper">
                  {normalizeYouTubeUrl(currentContent.data.videoUrl) ? (
                    <div className="responsive-video">
                      <iframe
                        src={normalizeYouTubeUrl(currentContent.data.videoUrl)}
                        title={currentContent.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="invalid-video">
                      <p>⚠️ Invalid video URL provided. Please update the lecture page.</p>
                    </div>
                  )}
                </div>
              )}
              <MDEditor.Markdown 
                source={currentContent.data.content} 
                style={{ whiteSpace: 'pre-wrap' }}
                data-color-mode="light"
              />
              <div className="lecture-actions">
                <button 
                  onClick={() => updateUserProgress(currentPageIndex, 'lecture', true)}
                  className="btn-primary"
                  disabled={isContentCompleted('lecture', currentPageIndex, currentContent.id)}
                >
                  {isContentCompleted('lecture', currentPageIndex, currentContent.id) ? 
                    <><FiCheckCircle /> Completed</> : 
                    <><FiCheckCircle /> Mark as Complete</>
                  }
                </button>
              </div>
            </div>
          )}

          {currentPageType === 'quiz' && currentContent && (
            <div className="quiz-content">
              {!showQuizResults ? (
                <>
                  <div className="quiz-info">
                    <p>{currentContent.data.questions?.length} questions</p>
                  </div>
                  
                  <div className="quiz-questions">
                    {currentContent.data.questions?.map((question, qIndex) => (
                      <div key={qIndex} className="question-card">
                        <h3>Question {qIndex + 1}</h3>
                        <p>{question.question}</p>
                        
                        <div className="answer-options">
                          {question.options?.map((option, oIndex) => (
                            <label key={oIndex} className="answer-option">
                              <input
                                type="radio"
                                name={`question-${qIndex}`}
                                value={oIndex}
                                checked={quizAnswers[qIndex] === oIndex}
                                onChange={() => handleQuizAnswer(qIndex, oIndex)}
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="quiz-actions">
                    <button 
                      onClick={submitQuiz}
                      className="btn-primary"
                      disabled={Object.keys(quizAnswers).length !== currentContent.data.questions?.length}
                    >
                      Submit Quiz
                    </button>
                  </div>
                </>
              ) : (
                <div className="quiz-results">
                  <div className="results-header">
                    <FiAward className="results-icon" />
                    <h2>Quiz Results</h2>
                  </div>
                  
                  <div className="results-summary">
                    <div className="score-display">
                      <div className="score-circle">
                        <span className="score-percentage">{quizResults.score}%</span>
                      </div>
                      <p className={`score-status ${quizResults.passed ? 'passed' : 'failed'}`}>
                        {quizResults.passed ? 'Passed!' : 'Failed'}
                      </p>
                    </div>
                    
                    <div className="score-details">
                      <p>Correct Answers: {quizResults.correct} / {quizResults.total}</p>
                      <p>Passing Score: 60%</p>
                    </div>
                  </div>
                  
                  <div className="results-actions">
                    <button 
                      onClick={() => {
                        setShowQuizResults(false);
                        setQuizAnswers({});
                        setQuizResults(null);
                      }}
                      className="btn-secondary"
                    >
                      <FiRefreshCw /> Retake Quiz
                    </button>
                    
                    {currentGlobalIndex < allContent.length - 1 && (
                      <button 
                        onClick={navigateNext}
                        className="btn-primary"
                      >
                        Continue <FiChevronRight />
                      </button>
                    )}
                    
                    {currentGlobalIndex === allContent.length - 1 && (
                      <button 
                        onClick={() => {
                          // Navigate to dashboard for employees, otherwise go to home
                          if (user?.role === 'employee') {
                            navigate('/dashboard');
                          } else {
                            navigate('/');
                          }
                        }}
                        className="btn-primary"
                      >
                        <FiAward /> Course Complete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseWorkspace;