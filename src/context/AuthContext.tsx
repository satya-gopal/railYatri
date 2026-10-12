import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { User } from '../types';
import {
  getCurrentUser,
  login as apiLogin,
  signup as apiSignup,
  logout as apiLogout,
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
} from '../services/authService';
import { initializeSeedData } from '../services/seed';
import { clearAllAppData } from '../services/storage';
import {
  LoginFormData,
  SignupFormData,
  ProfileFormData,
  ChangePasswordFormData,
} from '../schemas';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginFormData) => Promise<boolean>;
  signup: (data: SignupFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileFormData) => Promise<boolean>;
  changePassword: (data: ChangePasswordFormData) => Promise<boolean>;
  refreshUser: () => Promise<void>;
  resetDemoData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize seed data and load session
  const init = useCallback(async () => {
    try {
      initializeSeedData();
      const res = await getCurrentUser();
      if (res.success && res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    init();
  }, [init]);

  const login = async (data: LoginFormData): Promise<boolean> => {
    const toastId = toast.loading('Authenticating...');
    const res = await apiLogin(data);
    if (res.success && res.data) {
      setUser(res.data);
      toast.success(`Welcome back, ${res.data.name}!`, { id: toastId });
      return true;
    } else {
      toast.error(res.error || 'Login failed', { id: toastId });
      return false;
    }
  };

  const signup = async (data: SignupFormData): Promise<boolean> => {
    const toastId = toast.loading('Creating your account...');
    const res = await apiSignup(data);
    if (res.success && res.data) {
      setUser(res.data);
      toast.success('Registration successful!', { id: toastId });
      return true;
    } else {
      toast.error(res.error || 'Signup failed', { id: toastId });
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    await apiLogout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (data: ProfileFormData): Promise<boolean> => {
    const toastId = toast.loading('Updating profile...');
    const res = await apiUpdateProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
      toast.success('Profile updated successfully', { id: toastId });
      return true;
    } else {
      toast.error(res.error || 'Failed to update profile', { id: toastId });
      return false;
    }
  };

  const changePassword = async (data: ChangePasswordFormData): Promise<boolean> => {
    const toastId = toast.loading('Updating password...');
    const res = await apiChangePassword(data);
    if (res.success) {
      toast.success('Password changed successfully', { id: toastId });
      return true;
    } else {
      toast.error(res.error || 'Failed to change password', { id: toastId });
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    const res = await getCurrentUser();
    if (res.success) {
      setUser(res.data || null);
    }
  };

  const resetDemoData = async (): Promise<void> => {
    const toastId = toast.loading('Resetting simulation data...');
    clearAllAppData();
    initializeSeedData(true);
    setUser(null);
    await init();
    toast.success('Data reset to original factory demo state', { id: toastId });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
        resetDemoData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
