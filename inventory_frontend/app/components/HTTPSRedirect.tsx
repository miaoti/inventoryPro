'use client';

import { useEffect, useState } from 'react';
import { Box, Alert, Button, Typography, LinearProgress } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';

interface HTTPSRedirectProps {
  requireHTTPS?: boolean;
  message?: string;
  autoRedirect?: boolean;
}

export default function HTTPSRedirect({ 
  requireHTTPS = false, 
  message = "HTTPS is required for camera functionality on mobile devices.",
  autoRedirect = false
}: HTTPSRedirectProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      const isHTTPS = window.location.protocol === 'https:';
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Show warning if not HTTPS and either mobile OR requireHTTPS is true
      if (!isHTTPS && !isLocalhost && (isMobile || requireHTTPS)) {
        setShowWarning(true);
        
        // Auto-redirect for camera functionality
        if (autoRedirect) {
          setIsRedirecting(true);
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                handleRedirectToHTTPS();
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        }
      }
    }
  }, [requireHTTPS, autoRedirect]);

  if (!isClient || !showWarning) {
    return null;
  }

  const handleRedirectToHTTPS = () => {
    if (typeof window !== 'undefined') {
      const httpsUrl = window.location.href.replace('http:', 'https:');
      console.log('Redirecting to HTTPS:', httpsUrl);
      window.location.href = httpsUrl;
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert 
        severity={isRedirecting ? "info" : "warning"}
        icon={<SecurityIcon />}
        action={
          !isRedirecting && (
            <Button
              color="inherit"
              size="small"
              onClick={handleRedirectToHTTPS}
              sx={{ fontWeight: 'bold' }}
            >
              Switch to HTTPS
            </Button>
          )
        }
      >
        <Typography variant="body2" component="div">
          <strong>{isRedirecting ? "Redirecting to Secure Connection..." : "Secure Connection Required"}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        {isRedirecting ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Redirecting to HTTPS in {countdown} seconds...
            </Typography>
            <LinearProgress sx={{ mt: 1 }} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Click "Switch to HTTPS" above or manually change the URL to use <code>https://</code> instead of <code>http://</code>
          </Typography>
        )}
      </Alert>
    </Box>
  );
} 