import React, { useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { FiPlus, FiTrash2, FiSave, FiBook, FiEdit3, FiHelpCircle, FiLoader } from 'react-icons/fi';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import './AddCourse.css';

const AddCourse = () => {
  // Course basic information
  const [courseData, setCourseData] = useState({
    courseName: '',
    courseDescription: '',
    duration: '',
    difficulty: 'beginner',
    category: ''
  });

  // Lecture notes state
  const [lecturePages, setLecturePages] = useState([
    {
      id: uuidv4(),
      title: 'Page 1',
      content: '# Welcome to your first lecture page\n\nStart writing your lecture content here...'
    }
  ]);

  // Quiz state
  const [quizzes, setQuizzes] = useState([
    {
      id: uuidv4(),
      title: 'Quiz 1',
      questions: [
        {
          id: uuidv4(),
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    }
  ]);

  // Active section state
  const [activeSection, setActiveSection] = useState('course-info');
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // API base URL
  const API_BASE_URL = 'http://localhost:5001/api';

  // Course information handlers
  const handleCourseInputChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Lecture page handlers
  const addLecturePage = () => {
    const newPage = {
      id: uuidv4(),
      title: `Page ${lecturePages.length + 1}`,
      content: `# Lecture Page ${lecturePages.length + 1}\n\nAdd your lecture content here...`
    };
    setLecturePages([...lecturePages, newPage]);
  };

  const updateLecturePage = (pageId, field, value) => {
    setLecturePages(pages =>
      pages.map(page =>
        page.id === pageId ? { ...page, [field]: value } : page
      )
    );
  };

  const deleteLecturePage = (pageId) => {
    if (lecturePages.length > 1) {
      setLecturePages(pages => pages.filter(page => page.id !== pageId));
    }
  };

  // Quiz handlers
  const addQuiz = () => {
    const newQuiz = {
      id: uuidv4(),
      title: `Quiz ${quizzes.length + 1}`,
      questions: [
        {
          id: uuidv4(),
          question: '',
          options: ['', '', '', ''],
          correctAnswer: 0
        }
      ]
    };
    setQuizzes([...quizzes, newQuiz]);
  };

  const updateQuizTitle = (quizId, title) => {
    setQuizzes(quizzes =>
      quizzes.map(quiz =>
        quiz.id === quizId ? { ...quiz, title } : quiz
      )
    );
  };

  const addQuestion = (quizId) => {
    const newQuestion = {
      id: uuidv4(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    };

    setQuizzes(quizzes =>
      quizzes.map(quiz =>
        quiz.id === quizId
          ? { ...quiz, questions: [...quiz.questions, newQuestion] }
          : quiz
      )
    );
  };

  const updateQuestion = (quizId, questionId, field, value) => {
    setQuizzes(quizzes =>
      quizzes.map(quiz =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map(q =>
                q.id === questionId ? { ...q, [field]: value } : q
              )
            }
          : quiz
      )
    );
  };

  const updateQuestionOption = (quizId, questionId, optionIndex, value) => {
    setQuizzes(quizzes =>
      quizzes.map(quiz =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.map(q =>
                q.id === questionId
                  ? {
                      ...q,
                      options: q.options.map((opt, idx) =>
                        idx === optionIndex ? value : opt
                      )
                    }
                  : q
              )
            }
          : quiz
      )
    );
  };

  const deleteQuestion = (quizId, questionId) => {
    setQuizzes(quizzes =>
      quizzes.map(quiz =>
        quiz.id === quizId
          ? {
              ...quiz,
              questions: quiz.questions.filter(q => q.id !== questionId)
            }
          : quiz
      )
    );
  };

  const deleteQuiz = (quizId) => {
    if (quizzes.length > 1) {
      setQuizzes(quizzes => quizzes.filter(quiz => quiz.id !== quizId));
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!courseData.courseName.trim()) {
      setError('Course name is required');
      setActiveSection('course-info');
      return;
    }
    
    if (lecturePages.some(page => !page.title.trim() || !page.content.trim())) {
      setError('All lecture pages must have a title and content');
      setActiveSection('lectures');
      return;
    }
    
    if (quizzes.some(quiz => !quiz.title.trim() || quiz.questions.some(q => !q.question.trim() || q.options.some(opt => !opt.trim())))) {
      setError('All quizzes must have titles and all questions must be complete');
      setActiveSection('quizzes');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const courseFormData = {
        ...courseData,
        lecturePages: lecturePages.map((page, index) => ({
          ...page,
          pageNumber: index + 1
        })),
        quizzes,
        createdAt: new Date().toISOString()
      };

      const response = await axios.post(`${API_BASE_URL}/courses`, courseFormData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setSuccess('Course created successfully! 🎉');
        
        // Reset form after successful submission
        setTimeout(() => {
          setCourseData({
            courseName: '',
            courseDescription: '',
            duration: '',
            difficulty: 'beginner',
            category: ''
          });
          setLecturePages([
            {
              id: uuidv4(),
              title: 'Page 1',
              content: '# Welcome to your first lecture page\n\nStart writing your lecture content here...'
            }
          ]);
          setQuizzes([
            {
              id: uuidv4(),
              title: 'Quiz 1',
              questions: [
                {
                  id: uuidv4(),
                  question: '',
                  options: ['', '', '', ''],
                  correctAnswer: 0
                }
              ]
            }
          ]);
          setActiveSection('course-info');
          setSuccess('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      
      if (error.response?.data?.errors) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        const errorMessages = validationErrors.map(err => err.message).join(', ');
        setError(`Validation failed: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please make sure the backend is running on port 5001.');
      } else {
        setError('An error occurred while creating the course. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-course-container">
      <div className="add-course-header">
        <h1><FiBook /> Create New Course</h1>
      </div>

      <div className="add-course-navigation">
        <button
          className={`nav-btn ${activeSection === 'course-info' ? 'active' : ''}`}
          onClick={() => setActiveSection('course-info')}
        >
          <FiBook /> Course Info
        </button>
        <button
          className={`nav-btn ${activeSection === 'lectures' ? 'active' : ''}`}
          onClick={() => setActiveSection('lectures')}
        >
          <FiEdit3 /> Lecture Notes
        </button>
        <button
          className={`nav-btn ${activeSection === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveSection('quizzes')}
        >
          <FiHelpCircle /> Quizzes
        </button>
      </div>

      <form onSubmit={handleSubmit} className="add-course-form">
        
        {/* Error and Success Messages */}
        {error && (
          <div className="alert alert-error">
            <span>❌ {error}</span>
            <button type="button" onClick={() => setError('')} className="alert-close">×</button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <span>✅ {success}</span>
          </div>
        )}
        
        {/* Course Information Section */}
        {activeSection === 'course-info' && (
          <div className="section course-info-section">
            <h2>Course Information</h2>
            
            <div className="form-group">
              <label htmlFor="courseName">Course Name *</label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                value={courseData.courseName}
                onChange={handleCourseInputChange}
                placeholder="Enter course name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="courseDescription">Course Description</label>
              <textarea
                id="courseDescription"
                name="courseDescription"
                value={courseData.courseDescription}
                onChange={handleCourseInputChange}
                placeholder="Describe what employees will learn..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="duration">Duration (hours)</label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={courseData.duration}
                  onChange={handleCourseInputChange}
                  placeholder="e.g., 20"
                />
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={courseData.difficulty}
                  onChange={handleCourseInputChange}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={courseData.category}
                  onChange={handleCourseInputChange}
                  placeholder="e.g., Programming, Design"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lecture Notes Section */}
        {activeSection === 'lectures' && (
          <div className="section lectures-section">
            <div className="section-header">
              <h2>Lecture Notes</h2>
              <button type="button" onClick={addLecturePage} className="add-btn">
                <FiPlus /> Add Page
              </button>
            </div>

            {lecturePages.map((page, index) => (
              <div key={page.id} className="lecture-page">
                <div className="page-header">
                  <input
                    type="text"
                    value={page.title}
                    onChange={(e) => updateLecturePage(page.id, 'title', e.target.value)}
                    className="page-title-input"
                    placeholder="Page title"
                  />
                  {lecturePages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteLecturePage(page.id)}
                      className="delete-btn"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                <div className="form-group">
                  <label>YouTube Video URL (optional)</label>
                  <input
                    type="url"
                    value={page.videoUrl || ''}
                    onChange={(e) => updateLecturePage(page.id, 'videoUrl', e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="video-url-input"
                  />
                  <small className="hint">Supports watch, youtu.be, shorts, or embed links. Leave blank if no video.</small>
                </div>

                <div className="editor-container">
                  <MDEditor
                    value={page.content}
                    onChange={(val) => updateLecturePage(page.id, 'content', val || '')}
                    preview="edit"
                    height={400}
                    data-color-mode="light"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quizzes Section */}
        {activeSection === 'quizzes' && (
          <div className="section quizzes-section">
            <div className="section-header">
              <h2>Quizzes</h2>
              <button type="button" onClick={addQuiz} className="add-btn">
                <FiPlus /> Add Quiz
              </button>
            </div>

            {quizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-container">
                <div className="quiz-header">
                  <input
                    type="text"
                    value={quiz.title}
                    onChange={(e) => updateQuizTitle(quiz.id, e.target.value)}
                    className="quiz-title-input"
                    placeholder="Quiz title"
                  />
                  {quizzes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteQuiz(quiz.id)}
                      className="delete-btn"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>

                {quiz.questions.map((question, qIndex) => (
                  <div key={question.id} className="question-container">
                    <div className="question-header">
                      <h4>Question {qIndex + 1}</h4>
                      {quiz.questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => deleteQuestion(quiz.id, question.id)}
                          className="delete-btn small"
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>

                    <div className="form-group">
                      <label>Question Text</label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(quiz.id, question.id, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        rows="3"
                      />
                    </div>

                    <div className="options-container">
                      <label>Answer Options</label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className="option-row">
                          <div className="option-input-group">
                            <span className="option-label">{String.fromCharCode(65 + optIndex)}.</span>
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateQuestionOption(quiz.id, question.id, optIndex, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            />
                            <label className="radio-label">
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctAnswer === optIndex}
                                onChange={() => updateQuestion(quiz.id, question.id, 'correctAnswer', optIndex)}
                              />
                              <span className="radio-text">Correct</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addQuestion(quiz.id)}
                  className="add-question-btn"
                >
                  <FiPlus /> Add Question
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <FiLoader className="spinning" /> Creating Course...
              </>
            ) : (
              <>
                <FiSave /> Create Course
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCourse;