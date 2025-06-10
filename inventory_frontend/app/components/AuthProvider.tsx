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
      // Use a simpler endpoint that already exists to validate token
      // Try to fetch user profile which requires authentication
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${Cookies.get('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Token validation successful');
        return true;
      } else if (response.status === 401) {
        console.log('Token validation failed - 401 Unauthorized');
        dispatch(forceLogout({ reason: 'Session expired. Please log in again.' }));
        authAPI.clearAuthData();
        return false;
      } else {
        console.log('Token validation failed with status:', response.status);
        return true; // Don't logout on server errors, just log the issue
      }
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
      
      // Don't logout on network errors, just log them
      console.log('Network error during token validation, keeping user logged in');
      return true;
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
          
          // Don't validate token during initialization to avoid blocking access
          // Token validation will happen periodically once user is authenticated
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
      
      // Start validation after a delay to avoid conflicts during initialization
      const timeoutId = setTimeout(() => {
        // Set up periodic token validation (every 10 minutes to reduce frequency)
        validateIntervalRef.current = setInterval(validateToken, 10 * 60 * 1000);
      }, 5000); // Wait 5 seconds before starting validation
      
      return () => {
        clearTimeout(timeoutId);
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