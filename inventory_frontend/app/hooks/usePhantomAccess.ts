'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';

interface PhantomAccessState {
  isPhantomModeActive: boolean;
  isPhantomUser: boolean;
  phantomToken: string | null;
  timeRemaining: number;
  showPhantomChallenge: boolean;
}

interface PhantomAccessHook extends PhantomAccessState {
  activatePhantomChallenge: () => void;
  submitAccessKey: (key: string) => Promise<boolean>;
  deactivatePhantomMode: () => void;
  formatTimeRemaining: () => string;
}

// Phantom configuration
const PHANTOM_CONFIG = {
  // Konami code sequence: ↑↑↓↓←→←→BA
  ACTIVATION_SEQUENCE: ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'],
  // The one true key
  ACCESS_KEY: 'ZOEISTHEONE',
  // Session duration in milliseconds (30 minutes)
  SESSION_DURATION: 30 * 60 * 1000,
  // Maximum attempts before cooldown
  MAX_ATTEMPTS: 3,
  // Cooldown period in milliseconds (5 minutes)
  COOLDOWN_PERIOD: 5 * 60 * 1000
};

export const usePhantomAccess = (): PhantomAccessHook => {
  const dispatch = useDispatch();
  
  const [state, setState] = useState<PhantomAccessState>({
    isPhantomModeActive: false,
    isPhantomUser: false,
    phantomToken: null,
    timeRemaining: 0,
    showPhantomChallenge: false
  });

  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [cooldownEndTime, setCooldownEndTime] = useState(0);

  // Generate phantom session token
  const generatePhantomToken = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `phantom_${timestamp}_${random}`;
  }, []);

  // Create phantom user profile
  const createPhantomUser = useCallback(() => {
    return {
      id: 999999,
      username: 'ZOE_PHANTOM',
      fullName: 'Zoe (Phantom Mode)',
      email: 'zoe@phantom.void',
      role: 'OWNER' as const,
      department: 'PHANTOM_OPERATIONS',
      isPhantomUser: true
    };
  }, []);

  // Handle key press for activation sequence
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    // Only listen when not in phantom mode and not in an input field
    if (state.isPhantomModeActive || 
        event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    setKeySequence(prev => {
      const newSequence = [...prev, event.code];
      
      // Keep only the last N keys equal to sequence length
      if (newSequence.length > PHANTOM_CONFIG.ACTIVATION_SEQUENCE.length) {
        newSequence.shift();
      }
      
      // Check if sequence matches
      if (newSequence.length === PHANTOM_CONFIG.ACTIVATION_SEQUENCE.length) {
        const matches = newSequence.every((key, index) => 
          key === PHANTOM_CONFIG.ACTIVATION_SEQUENCE[index]
        );
        
        if (matches) {
          // Check cooldown
          if (Date.now() < cooldownEndTime) {
            console.warn('Phantom access is in cooldown period');
            return [];
          }
          
          setState(prev => ({ ...prev, showPhantomChallenge: true }));
          return [];
        }
      }
      
      return newSequence;
    });
  }, [state.isPhantomModeActive, cooldownEndTime]);

  // Activate phantom challenge dialog
  const activatePhantomChallenge = useCallback(() => {
    setState(prev => ({ ...prev, showPhantomChallenge: true }));
  }, []);

  // Submit access key
  const submitAccessKey = useCallback(async (key: string): Promise<boolean> => {
    // Check cooldown
    if (Date.now() < cooldownEndTime) {
      return false;
    }

    const isValidKey = key.toUpperCase() === PHANTOM_CONFIG.ACCESS_KEY;
    
    if (isValidKey) {
      try {
        // Call backend phantom authentication endpoint
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${API_URL}/auth/phantom`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessKey: key }),
        });

        if (!response.ok) {
          console.error('Phantom authentication failed:', response.status, response.statusText);
          return false;
        }

        const data = await response.json();
        const { token, user } = data;
        
        // Update state
        setState({
          isPhantomModeActive: true,
          isPhantomUser: true,
          phantomToken: token,
          timeRemaining: PHANTOM_CONFIG.SESSION_DURATION,
          showPhantomChallenge: false
        });
        
        // Set user in Redux store with special phantom flag
        dispatch(setCredentials({ 
          user: user, 
          token: token,
          isPhantomSession: true 
        }));
        
        // Store expiration time
        const expirationTime = Date.now() + PHANTOM_CONFIG.SESSION_DURATION;
        sessionStorage.setItem('phantomExpirationTime', expirationTime.toString());
        sessionStorage.setItem('phantomToken', token);
        
        // Reset attempts
        setAttempts(0);
        
        // Add visual indicator to page
        document.body.classList.add('phantom-mode-active');
        
        console.log('👻 Phantom mode activated! Welcome, Zoe.');
        return true;
      } catch (error) {
        console.error('Phantom authentication error:', error);
        return false;
      }
    } else {
      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= PHANTOM_CONFIG.MAX_ATTEMPTS) {
        // Trigger cooldown
        setCooldownEndTime(Date.now() + PHANTOM_CONFIG.COOLDOWN_PERIOD);
        setState(prev => ({ ...prev, showPhantomChallenge: false }));
        console.warn('Too many failed attempts. Phantom access locked for 5 minutes.');
      }
      
      return false;
    }
  }, [attempts, cooldownEndTime, dispatch]);

  // Deactivate phantom mode
  const deactivatePhantomMode = useCallback(() => {
    setState({
      isPhantomModeActive: false,
      isPhantomUser: false,
      phantomToken: null,
      timeRemaining: 0,
      showPhantomChallenge: false
    });
    
    // Clear session storage
    sessionStorage.removeItem('phantomExpirationTime');
    sessionStorage.removeItem('phantomToken');
    
    // Remove visual indicator
    document.body.classList.remove('phantom-mode-active');
    
    // Note: Don't dispatch logout here as we want to return to previous state
    console.log('👻 Phantom mode deactivated.');
  }, []);

  // Format time remaining for display
  const formatTimeRemaining = useCallback(() => {
    const totalSeconds = Math.floor(state.timeRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [state.timeRemaining]);

  // Timer effect for session countdown
  useEffect(() => {
    if (!state.isPhantomModeActive) return;
    
    const interval = setInterval(() => {
      const expirationTime = parseInt(sessionStorage.getItem('phantomExpirationTime') || '0');
      const currentTime = Date.now();
      const remaining = expirationTime - currentTime;
      
      if (remaining <= 0) {
        deactivatePhantomMode();
      } else {
        setState(prev => ({ ...prev, timeRemaining: remaining }));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state.isPhantomModeActive, deactivatePhantomMode]);

  // Restore phantom session on page refresh
  useEffect(() => {
    const phantomToken = sessionStorage.getItem('phantomToken');
    const expirationTime = parseInt(sessionStorage.getItem('phantomExpirationTime') || '0');
    
    if (phantomToken && Date.now() < expirationTime) {
      const phantomUser = createPhantomUser();
      const remaining = expirationTime - Date.now();
      
      setState({
        isPhantomModeActive: true,
        isPhantomUser: true,
        phantomToken,
        timeRemaining: remaining,
        showPhantomChallenge: false
      });
      
      dispatch(setCredentials({ 
        user: phantomUser, 
        token: phantomToken,
        isPhantomSession: true 
      }));
      
      document.body.classList.add('phantom-mode-active');
    }
  }, [createPhantomUser, dispatch]);

  // Keyboard event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Add phantom mode CSS when active
  useEffect(() => {
    if (state.isPhantomModeActive) {
      const style = document.createElement('style');
      style.textContent = `
        .phantom-mode-active {
          position: relative;
        }
        .phantom-mode-active::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #9d4edd, #e0aaff, #c77dff, #7209b7, #9d4edd);
          background-size: 200% 100%;
          animation: phantomGlow 3s ease-in-out infinite;
          z-index: 9999;
          pointer-events: none;
        }
        .phantom-mode-active::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(157, 78, 221, 0.05) 0%, transparent 70%);
          z-index: -1;
          pointer-events: none;
          animation: phantomAura 4s ease-in-out infinite alternate;
        }
        @keyframes phantomGlow {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes phantomAura {
          0% { opacity: 0.3; }
          100% { opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [state.isPhantomModeActive]);

  return {
    ...state,
    activatePhantomChallenge,
    submitAccessKey,
    deactivatePhantomMode,
    formatTimeRemaining
  };
}; 