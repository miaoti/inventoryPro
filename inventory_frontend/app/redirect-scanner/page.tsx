'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { RootState } from '../store';
import Cookies from 'js-cookie';

export default function ScannerRedirectPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const checkAuthAndRedirect = () => {
      const token = Cookies.get('token');
      const userCookie = Cookies.get('user');
      
      // Check if user is authenticated (either from Redux or cookies)
      const hasAuth = isAuthenticated || (token && userCookie);
      
      if (hasAuth) {
        // User is authenticated, redirect to authenticated scanner
        console.log('User is authenticated, redirecting to authenticated scanner');
        router.replace('/dashboard'); // Redirect to dashboard where they can access the authenticated scanner
      } else {
        // User is not authenticated, redirect to public scanner
        console.log('User is not authenticated, redirecting to public scanner');
        router.replace('/barcode-scanner');
      }
    };

    // Add a small delay to allow auth state to initialize
    const timeoutId = setTimeout(checkAuthAndRedirect, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isAuthenticated, router]);

  // Show loading while redirecting
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}
    >
      <CircularProgress size={40} sx={{ mb: 2 }} />
      <Typography variant="h6" color="text.secondary">
        Redirecting to scanner...
      </Typography>
    </Box>
  );
} 