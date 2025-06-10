'use client';

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { setCredentials, forceLogout } from '../store/slices/authSlice';
import { authAPI } from '../services/api';
import type { RootState } from '../store';
import { CircularProgress, Box, Typography } from '@mui/material';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isValidating, setIsValidating] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Define public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/scanner'];
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    const validateAuth = async () => {
      console.log('AuthProvider: Starting authentication validation');
      
      try {
        // Check if we have a token
        const token = Cookies.get('token');
        const userCookie = Cookies.get('user');
        
        if (!token) {
          console.log('AuthProvider: No token found');
          // Clear any stale auth data
          authAPI.clearAuthData();
          
          // Only redirect if trying to access protected route
          if (!isPublicRoute) {
            console.log('AuthProvider: Redirecting to login - no token for protected route');
            router.push('/login?error=authentication_required');
          }
          setAuthChecked(true);
          setIsValidating(false);
          return;
        }

        // Check if we have user data
        if (!userCookie) {
          console.log('AuthProvider: Token exists but no user data');
          authAPI.clearAuthData();
          if (!isPublicRoute) {
            router.push('/login?error=invalid_session');
          }
          setAuthChecked(true);
          setIsValidating(false);
          return;
        }

        try {
          const user = JSON.parse(userCookie);
          
          // Validate token with server
          const validationResult: any = await authAPI.validateToken();
          
          if (validationResult.valid) {
            console.log('AuthProvider: Token validation successful');
            // Set auth state if not already set
            if (!isAuthenticated) {
              dispatch(setCredentials({ user, token }));
            }
          } else {
            console.log('AuthProvider: Token validation failed');
            dispatch(forceLogout({ reason: 'Session expired' }));
            if (!isPublicRoute) {
              router.push('/login?error=session_expired');
            }
          }
        } catch (userParseError) {
          console.error('AuthProvider: Error parsing user data:', userParseError);
          authAPI.clearAuthData();
          if (!isPublicRoute) {
            router.push('/login?error=invalid_session');
          }
        }

      } catch (error) {
        console.error('AuthProvider: Error during auth validation:', error);
        
        // Clear auth on any validation error
        authAPI.clearAuthData();
        dispatch(forceLogout({ reason: 'Authentication error' }));
        
        if (!isPublicRoute) {
          router.push('/login?error=authentication_error');
        }
      } finally {
        setAuthChecked(true);
        setIsValidating(false);
      }
    };

    // Only validate if we haven't checked yet
    if (!authChecked) {
      validateAuth();
    }
  }, [dispatch, router, pathname, isPublicRoute, isAuthenticated, authChecked]);

  // Set up token expiration monitoring
  useEffect(() => {
    if (!isAuthenticated || isPublicRoute) return;

    const checkTokenExpiry = () => {
      const token = Cookies.get('token');
      if (!token) {
        console.log('AuthProvider: Token disappeared during session');
        dispatch(forceLogout({ reason: 'Session lost' }));
        router.push('/login?error=session_lost');
        return;
      }

      // Check if token is expired
      if (!authAPI.checkAuth()) {
        console.log('AuthProvider: Token expired during session');
        dispatch(forceLogout({ reason: 'Session expired' }));
        router.push('/login?error=session_expired');
      }
    };

    // Check token every 30 seconds
    const interval = setInterval(checkTokenExpiry, 30000);
    
    // Also check when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkTokenExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, dispatch, router, isPublicRoute]);

  // Show loading while validating
  if (isValidating && !isPublicRoute) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary">
          Validating authentication...
        </Typography>
      </Box>
    );
  }

  // For public routes, render immediately
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // For protected routes, only render if authenticated and validation is complete
  if (authChecked && isAuthenticated) {
    return <>{children}</>;
  }

  // Show loading for protected routes while auth is being validated
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: 2
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" color="text.secondary">
        Loading...
      </Typography>
    </Box>
  );
} 