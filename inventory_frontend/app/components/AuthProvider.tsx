'use client';

import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setCredentials, forceLogout } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import type { RootState } from '../store';
import Cookies from 'js-cookie';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Create a global loading state for auth initialization
let authInitialized = false;
let authInitializing = false;

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(true);
  const validateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationRef = useRef<number>(0);

  // Function to validate token with backend
  const validateToken = async () => {
    const currentTime = Date.now();
    // Only validate every 30 seconds to avoid too many requests
    if (currentTime - lastValidationRef.current < 30000) {
      return true;
    }

    lastValidationRef.current = currentTime;

    try {
      const result = await authAPI.validateToken();
      if (!result.valid) {
        console.log('Token validation failed, logging out user');
        dispatch(forceLogout({ reason: 'Session expired. Please log in again.' }));
        authAPI.clearAuthData();
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Token validation error:', error);
      
      // Handle concurrent session detection
      if (error.message?.includes('another location')) {
        console.log('Concurrent session detected');
        dispatch(forceLogout({ reason: 'You have been logged out because your account was accessed from another location.' }));
        if (window.location.pathname !== '/') {
          router.push('/?error=concurrent_session');
        }
        return false;
      }
      
      // Handle other authentication errors
      dispatch(forceLogout({ reason: 'Session expired. Please log in again.' }));
      authAPI.clearAuthData();
      return false;
    }
  };

  useEffect(() => {
    // Check for existing authentication on app startup
    const initializeAuth = async () => {
      // Prevent multiple simultaneous initializations
      if (authInitializing) return;
      authInitializing = true;

      const token = Cookies.get('token');
      const userCookie = Cookies.get('user');
      
      console.log('AuthProvider: Initializing auth, token present:', !!token);
      
      if (token && userCookie) {
        try {
          // First try to restore from cookies
          const parsedUser = JSON.parse(userCookie);
          dispatch(setCredentials({ user: parsedUser, token }));
          
          console.log('AuthProvider: Restored auth from cookies for user:', parsedUser.username);
          
          // Then validate with backend
          const isValid = await validateToken();
          if (!isValid) {
            console.log('AuthProvider: Token validation failed during init');
          }
        } catch (error) {
          console.error('AuthProvider: Failed to restore auth from cookies:', error);
          authAPI.clearAuthData();
        }
      } else {
        console.log('AuthProvider: No valid auth data found in cookies');
        if (token && !userCookie) {
          // Token exists but no user data - clear everything
          authAPI.clearAuthData();
        }
      }

      authInitialized = true;
      authInitializing = false;
      setLoading(false);
    };

    if (!authInitialized) {
      initializeAuth();
    } else {
      setLoading(false);
    }
  }, [dispatch]);

  // Set up periodic token validation for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('Setting up periodic token validation for user:', user.username);
      
      // Set up periodic token validation (every 5 minutes)
      validateIntervalRef.current = setInterval(validateToken, 5 * 60 * 1000);
      
      return () => {
        if (validateIntervalRef.current) {
          clearInterval(validateIntervalRef.current);
          validateIntervalRef.current = null;
        }
      };
    }
  }, [isAuthenticated, user]);

  // Listen for storage events (for multi-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout-event') {
        console.log('Logout event detected from another tab');
        dispatch(forceLogout({ reason: 'You have been logged out from another tab.' }));
        if (window.location.pathname !== '/') {
          router.push('/');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [dispatch, router]);

  // Handle beforeunload to clean up sessions
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Clear session ID when tab/window is closing
      sessionStorage.removeItem('session_id');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Show loading during auth initialization to prevent premature redirects
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e0e0e0',
          borderTop: '4px solid #1976d2',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '20px'
        }} />
        <div style={{ 
          fontSize: '18px',
          color: '#666',
          fontFamily: 'Arial, sans-serif'
        }}>
          Initializing...
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
} 