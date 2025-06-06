'use client';

import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import Cookies from 'js-cookie';

interface AuthProviderProps {
  children: React.ReactNode;
}

// Create a global loading state for auth initialization
let authInitialized = false;
let authInitializing = false;

export function AuthProvider({ children }: AuthProviderProps) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication on app startup
    const initializeAuth = async () => {
      // Prevent multiple simultaneous initializations
      if (authInitializing) return;
      authInitializing = true;

      const token = Cookies.get('token');
      
      console.log('AuthProvider: Initializing auth, token present:', !!token);
      
      if (token) {
        try {
          console.log('AuthProvider: Attempting to verify token...');
          
          // Verify token with backend
          const response = await fetch('/api/auth/me', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('AuthProvider: Auth/me response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            
            // Set the authentication state with real user data
            dispatch(setCredentials({
              user: data.user,
              token: data.token
            }));
            
            console.log('AuthProvider: User session restored successfully:', data.user.username);
          } else {
            const errorText = await response.text();
            console.log('AuthProvider: Token validation failed:', response.status, errorText);
            
            // Instead of immediately removing token, try a fallback approach
            if (response.status === 401) {
              console.log('AuthProvider: Token appears to be expired or invalid, removing...');
              Cookies.remove('token');
            } else {
              console.log('AuthProvider: Server error, keeping token for retry...');
              // Could implement retry logic here
            }
          }
        } catch (error) {
          console.error('AuthProvider: Token validation request failed:', error);
          // Don't remove token on network errors, just log the issue
          console.log('AuthProvider: Network error during auth check, will retry later');
        }
      } else {
        console.log('AuthProvider: No token found in cookies');
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