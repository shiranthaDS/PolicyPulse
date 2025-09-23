import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_BASE_URL = 'http://localhost:5001/api';

  // Set up axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE_URL}/users/profile`);
          if (response.data.success) {
            setUser(response.data.data);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token: newToken, ...userData } = response.data.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (name, email, password, role = 'employee') => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, {
        name,
        email,
        password,
        role
      });

      if (response.data.success) {
        const { token: newToken, ...userData } = response.data.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
        errors: error.response?.data?.errors
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const enrollInCourse = async (courseId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/enroll/${courseId}`);
      if (response.data.success) {
        // Refresh user data
        const userResponse = await axios.get(`${API_BASE_URL}/users/profile`);
        if (userResponse.data.success) {
          setUser(userResponse.data.data);
        }
        return { success: true, message: response.data.message };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Enrollment failed'
      };
    }
  };

  const updateProgress = async (courseId, pageId, action = 'complete_page') => {
    try {
      const response = await axios.put(`${API_BASE_URL}/users/progress/${courseId}`, {
        pageId,
        action
      });
      return response.data;
    } catch (error) {
      console.error('Progress update failed:', error);
      return { success: false };
    }
  };

  const submitQuiz = async (courseId, quizId, answers) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/quiz/${courseId}/${quizId}`, {
        answers
      });
      return response.data;
    } catch (error) {
      console.error('Quiz submission failed:', error);
      return { success: false };
    }
  };

  const getCourseProgress = async (courseId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/progress/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get course progress:', error);
      return { success: false };
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    enrollInCourse,
    updateProgress,
    submitQuiz,
    getCourseProgress
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;