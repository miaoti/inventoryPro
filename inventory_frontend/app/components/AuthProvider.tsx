'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import Cookies from 'js-cookie';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check for existing authentication on app startup
    const initializeAuth = async () => {
      const token = Cookies.get('token');
      
      if (token) {
        try {
          // TODO: Verify token with backend and get user data
          // For now, we'll need to decode the token or make an API call to get user info
          // This is a simplified version - in production you'd want to verify the token
          
          // You could decode the JWT token here to get user info
          // Or make an API call to /auth/me to get current user
          
          // For now, we'll just set the token and let the components handle the rest
          // The Layout component will handle authentication checks
          
          console.log('Found existing token, user should be authenticated');
        } catch (error) {
          console.error('Token validation failed:', error);
          Cookies.remove('token');
        }
      }
    };

    initializeAuth();
  }, [dispatch]);

  return <>{children}</>;
} 