import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('stockflow_token'));
  const [isLoading, setIsLoading] = useState(true);

  // Initialize and verify session on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stockflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (response?.data) {
          setUser(response.data.user);
          setOrganization(response.data.organization);
        }
      } catch (error) {
        console.error('Session validation error:', error);
        localStorage.removeItem('stockflow_token');
        setToken(null);
        setUser(null);
        setOrganization(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const { token: newToken, user: newUser, organization: newOrg } = res.data;

    localStorage.setItem('stockflow_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);
    toast.success(`Welcome back, ${newUser.name}!`);
    return res;
  };

  const signup = async (data) => {
    const res = await authApi.signup(data);
    const { token: newToken, user: newUser, organization: newOrg } = res.data;

    localStorage.setItem('stockflow_token', newToken);
    setToken(newToken);
    setUser(newUser);
    setOrganization(newOrg);
    toast.success(`Organization ${newOrg.name} created successfully!`);
    return res;
  };

  const logout = () => {
    localStorage.removeItem('stockflow_token');
    setToken(null);
    setUser(null);
    setOrganization(null);
    toast.success('Logged out successfully.');
  };

  const updateOrganizationState = (updatedOrg) => {
    setOrganization((prev) => ({ ...prev, ...updatedOrg }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        updateOrganizationState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

