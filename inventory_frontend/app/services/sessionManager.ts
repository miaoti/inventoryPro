import { authAPI } from './api';
import Cookies from 'js-cookie';

export class SessionManager {
  private static instance: SessionManager;
  private checkInterval: NodeJS.Timeout | null = null;
  private sessionCheckIntervalMs = 30000; // Check every 30 seconds
  private lastSessionCheck = 0;
  private isChecking = false;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  startSessionMonitoring(): void {
    // Clear any existing interval
    this.stopSessionMonitoring();
    
    console.log('Starting session monitoring...');
    
    // Initial session check
    this.checkSession();
    
    // Set up periodic session checking
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, this.sessionCheckIntervalMs);
    
    // Also check on page focus (when user switches back to tab)
    window.addEventListener('focus', () => {
      const now = Date.now();
      // Only check if it's been more than 10 seconds since last check
      if (now - this.lastSessionCheck > 10000) {
        this.checkSession();
      }
    });
  }

  stopSessionMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    console.log('Session monitoring stopped');
  }

  private async checkSession(): Promise<void> {
    // Prevent concurrent checks
    if (this.isChecking) return;
    
    const token = Cookies.get('token');
    if (!token) {
      console.log('No token found, stopping session monitoring');
      this.stopSessionMonitoring();
      return;
    }

    this.isChecking = true;
    this.lastSessionCheck = Date.now();

    try {
      console.log('Checking session validity...');
      await authAPI.checkSession();
      console.log('Session is valid');
    } catch (error: any) {
      console.error('Session check failed:', error);
      
      if (error.response?.status === 401) {
        console.log('Session expired or invalidated by another login');
        this.handleSessionInvalid();
      } else if (error.response?.status === 409) {
        // 409 Conflict - User logged in elsewhere
        console.log('User logged in from another device');
        this.handleLoggedInElsewhere();
      } else {
        console.log('Session check failed with other error, retrying later');
      }
    } finally {
      this.isChecking = false;
    }
  }

  private handleSessionInvalid(): void {
    console.log('Handling invalid session - logging out');
    this.stopSessionMonitoring();
    
    // Show alert to user
    alert('Your session has expired. Please log in again.');
    
    // Clear auth data and redirect
    authAPI.clearAuth();
  }

  private handleLoggedInElsewhere(): void {
    console.log('Handling login from another device');
    this.stopSessionMonitoring();
    
    // Show specific message for multi-device login
    alert('You have been logged in from another device. This session will be terminated.');
    
    // Clear auth data and redirect
    authAPI.clearAuth();
  }

  // Store session ID when user logs in
  setSessionId(sessionId: string): void {
    localStorage.setItem('sessionId', sessionId);
  }

  // Get current session ID
  getSessionId(): string | null {
    return localStorage.getItem('sessionId');
  }

  // Clear session data
  clearSession(): void {
    localStorage.removeItem('sessionId');
    this.stopSessionMonitoring();
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance(); 