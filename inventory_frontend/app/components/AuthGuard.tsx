'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { authAPI } from '../services/api';
import { forceLogout, setCredentials } from '../store/slices/authSlice';
import type { RootState } from '../store';
import Cookies from 'js-cookie';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const validateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValidationRef = useRef<number>(0);

  // Function to validate token
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
        
        // Clear everything and redirect
        authAPI.clearAuthData();
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          router.push('/?error=session_expired');
        }
        return false;
      }
      return true;
    } catch (error: any) {
      console.error('Token validation error:', error);
      
      // Handle concurrent session or authentication errors
      if (error.message?.includes('another location')) {
        dispatch(forceLogout({ reason: 'You have been logged out because your account was accessed from another location.' }));
        router.push('/?error=concurrent_session');
        return false;
      }
      
      // Handle other authentication errors
      dispatch(forceLogout({ reason: 'Session expired. Please log in again.' }));
      authAPI.clearAuthData();
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        router.push('/?error=session_expired');
      }
      return false;
    }
  };

  // Function to check and restore auth state from cookies
  const restoreAuthState = () => {
    const tokenCookie = Cookies.get('token');
    const userCookie = Cookies.get('user');

    if (tokenCookie && userCookie && !isAuthenticated) {
      try {
        const parsedUser = JSON.parse(userCookie);
        console.log('Restoring auth state from cookies');
        dispatch(setCredentials({ user: parsedUser, token: tokenCookie }));
        return true;
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        authAPI.clearAuthData();
        return false;
      }
    }

    return isAuthenticated;
  };

  // Initialize and validate authentication
  useEffect(() => {
    console.log('AuthGuard: Initializing auth state check');
    console.log('Current auth state:', { isAuthenticated, user: user?.username, requireAuth });
    console.log('Current path:', window.location.pathname);

    // First, try to restore auth state from cookies
    const hasAuth = restoreAuthState();

    // If we need auth but don't have it, redirect to login
    if (requireAuth && !hasAuth) {
      console.log('Auth required but not authenticated, redirecting to login');
      authAPI.clearAuthData();
      router.push('/');
      return;
    }

    // If we have auth, validate the token
    if (hasAuth) {
      console.log('User is authenticated, starting token validation');
      validateToken();
      
      // Set up periodic token validation (every 5 minutes)
      validateIntervalRef.current = setInterval(validateToken, 5 * 60 * 1000);
    }

    // Cleanup on unmount
    return () => {
      if (validateIntervalRef.current) {
        clearInterval(validateIntervalRef.current);
      }
    };
  }, [requireAuth, isAuthenticated, dispatch, router]);

  // Listen for storage events (for multi-tab logout)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'logout-event') {
        console.log('Logout event detected from another tab');
        dispatch(forceLogout({ reason: 'You have been logged out from another tab.' }));
        router.push('/');
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

  return <>{children}</>;
} 