import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Ensure Axios sends HTTP-Only cookies with every request
axios.defaults.withCredentials = true;

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSession();

    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          setUser(null);
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogleToken = async (idToken) => {
    try {
      setError(null);
      const res = await axios.post('/api/v1/auth/google', { idToken });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Google Login failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const devLoginSwitch = async (role, email) => {
    try {
      setError(null);
      const res = await axios.post('/api/v1/auth/dev-switch', { role, email });
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Dev Auth switch failed.';
      setError(msg);
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/v1/auth/logout');
    } catch (e) {
      console.warn('Logout error:', e);
    } finally {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('klu_new_project_draft_')) {
          localStorage.removeItem(key);
        }
      });
      setUser(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/api/v1/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        return { success: true };
      }
    } catch (err) {
      console.warn('Update profile error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        loginWithGoogleToken,
        devLoginSwitch,
        logout,
        fetchSession,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
