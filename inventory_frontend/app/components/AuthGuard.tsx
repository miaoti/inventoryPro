'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { authAPI } from '../services/api';
import type { RootState } from '../store';
import Cookies from 'js-cookie';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthGuard({ children, requireAuth = false }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Simple authentication check
  useEffect(() => {
    console.log('AuthGuard: Checking auth requirement');
    console.log('Current auth state:', { isAuthenticated, user: user?.username, requireAuth });
    console.log('Current path:', window.location.pathname);

    // Check for auth requirement
    if (requireAuth) {
      const token = Cookies.get('token');
      const userCookie = Cookies.get('user');
      
      // If we require auth but have no valid token/user, redirect to login
      if (!isAuthenticated && (!token || !userCookie)) {
        console.log('Auth required but not authenticated, redirecting to login');
        router.push('/');
        return;
      }
    }
  }, [requireAuth, isAuthenticated, user, router]);

  return <>{children}</>;
} 