'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Zoom,
  Fade,
  keyframes,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Close as CloseIcon,
  VpnKey as KeyIcon,
  AutoAwesome as MagicIcon,
} from '@mui/icons-material';

interface PhantomAccessDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (key: string) => Promise<boolean>;
  attempts: number;
  maxAttempts: number;
}

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export default function PhantomAccessDialog({
  open,
  onClose,
  onSubmit,
  attempts,
  maxAttempts
}: PhantomAccessDialogProps) {
  const theme = useTheme();
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Floating particles effect
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  useEffect(() => {
    if (open) {
      // Generate floating particles
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
      }));
      setParticles(newParticles);
      
      // Reset form when dialog opens
      setAccessKey('');
      setError('');
      setSuccess(false);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!accessKey.trim()) {
      setError('Access key required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // Dramatic processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const isValid = await onSubmit(accessKey.trim());

    if (isValid) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setAccessKey('');
        setSuccess(false);
      }, 2000);
    } else {
      setError(`Invalid key. ${maxAttempts - attempts - 1} attempts remaining.`);
      setAccessKey('');
    }

    setIsSubmitting(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !isSubmitting) {
      handleSubmit();
    }
    if (event.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: `linear-gradient(135deg, 
            ${alpha('#0f0f23', 0.98)} 0%, 
            ${alpha('#1a1a2e', 0.98)} 30%, 
            ${alpha('#16213e', 0.98)} 70%, 
            ${alpha('#0f0f23', 0.98)} 100%)`,
          backdropFilter: 'blur(30px)',
          border: `2px solid ${alpha('#9d4edd', 0.4)}`,
          boxShadow: `0 0 60px ${alpha('#9d4edd', 0.3)}, 
                      inset 0 0 60px ${alpha('#e0aaff', 0.1)}`,
          color: '#e0aaff',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '500px',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 20px,
              ${alpha('#9d4edd', 0.03)} 20px,
              ${alpha('#9d4edd', 0.03)} 40px
            )`,
            pointerEvents: 'none',
            zIndex: 1
          }
        }
      }}
    >
      {/* Floating Particles Background */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        {particles.map((particle) => (
          <Box
            key={particle.id}
            sx={{
              position: 'absolute',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: '4px',
              height: '4px',
              background: `linear-gradient(45deg, #e0aaff, #c77dff)`,
              borderRadius: '50%',
              animation: `${float} 4s ease-in-out infinite, ${pulse} 2s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
              boxShadow: `0 0 10px ${alpha('#e0aaff', 0.6)}`
            }}
          />
        ))}
      </Box>

      <DialogTitle sx={{ position: 'relative', zIndex: 2, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{
              position: 'relative',
              animation: `${float} 3s ease-in-out infinite`
            }}>
              <MagicIcon sx={{ 
                fontSize: 48, 
                color: '#e0aaff',
                filter: 'drop-shadow(0 0 20px #e0aaff)',
                animation: `${pulse} 2s infinite`
              }} />
              <Box sx={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: `linear-gradient(45deg, #c77dff, #9d4edd)`,
                animation: `${pulse} 1s infinite`
              }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ 
                fontFamily: 'monospace',
                fontWeight: 800,
                color: '#e0aaff',
                textShadow: '0 0 20px #e0aaff',
                letterSpacing: '3px',
                background: `linear-gradient(45deg, #e0aaff, #c77dff, #9d4edd)`,
                backgroundSize: '200% 100%',
                animation: `${shimmer} 3s linear infinite`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                ◈ PHANTOM PROTOCOL ◈
              </Typography>
              <Typography variant="h6" sx={{ 
                color: alpha('#e0aaff', 0.8),
                fontFamily: 'monospace',
                letterSpacing: '2px',
                textShadow: '0 0 10px rgba(224, 170, 255, 0.5)'
              }}>
                ∿ ZOE'S DOMAIN ∿
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: '#c77dff',
              '&:hover': { 
                backgroundColor: alpha('#c77dff', 0.1),
                transform: 'scale(1.2) rotate(90deg)',
                transition: 'all 0.3s ease'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ position: 'relative', zIndex: 2, py: 4 }}>
        <Fade in timeout={1500}>
          <Box>
            {/* Status Indicators */}
            <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
              <Chip
                label={`◆ ATTEMPT ${attempts + 1}/${maxAttempts} ◆`}
                size="medium"
                sx={{
                  backgroundColor: alpha('#c77dff', 0.2),
                  color: '#c77dff',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: `2px solid ${alpha('#c77dff', 0.5)}`,
                  borderRadius: 3,
                  px: 2,
                  boxShadow: `0 0 15px ${alpha('#c77dff', 0.3)}`
                }}
              />
              <Chip
                label="◈ OMEGA CLEARANCE ◈"
                size="medium"
                sx={{
                  backgroundColor: alpha('#e0aaff', 0.2),
                  color: '#e0aaff',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  border: `2px solid ${alpha('#e0aaff', 0.5)}`,
                  borderRadius: 3,
                  px: 2,
                  boxShadow: `0 0 15px ${alpha('#e0aaff', 0.3)}`
                }}
              />
            </Box>

            {/* Mystical Terminal Display */}
            <Box sx={{ 
              mb: 4, 
              p: 4, 
              backgroundColor: alpha('#0f0f23', 0.7),
              border: `2px solid ${alpha('#9d4edd', 0.4)}`,
              borderRadius: 3,
              fontFamily: 'monospace',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: `linear-gradient(90deg, transparent, ${alpha('#e0aaff', 0.1)}, transparent)`,
                animation: `${shimmer} 4s linear infinite`
              }
            }}>
              <Typography variant="body1" sx={{ color: '#e0aaff', mb: 2, fontSize: '1.1rem' }}>
                {'>'} QUANTUM BREACH DETECTED
              </Typography>
              <Typography variant="body1" sx={{ color: alpha('#e0aaff', 0.9), mb: 2, fontSize: '1.1rem' }}>
                {'>'} DIMENSIONAL GATEWAY OPENING...
              </Typography>
              <Typography variant="body1" sx={{ color: '#c77dff', mb: 2, fontSize: '1.1rem' }}>
                {'>'} ZOE'S AUTHORIZATION REQUIRED
              </Typography>
              <Typography variant="body1" sx={{ 
                color: '#9d4edd', 
                fontSize: '1.1rem',
                animation: `${pulse} 1.5s infinite`
              }}>
                {'>'} ENTER THE SACRED KEY ∿∿∿
              </Typography>
            </Box>

            {/* Enhanced Access Key Input */}
            <Box sx={{ mb: 3, position: 'relative' }}>
              <TextField
                fullWidth
                label="◈ PHANTOM ACCESS KEY ◈"
                type={showKey ? 'text' : 'password'}
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSubmitting}
                autoFocus
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <KeyIcon sx={{ 
                      color: '#e0aaff', 
                      mr: 2, 
                      fontSize: 28,
                      filter: 'drop-shadow(0 0 10px #e0aaff)'
                    }} />
                  ),
                  endAdornment: (
                    <IconButton
                      onClick={() => setShowKey(!showKey)}
                      sx={{ 
                        color: '#c77dff',
                        '&:hover': {
                          color: '#e0aaff',
                          transform: 'scale(1.1)'
                        }
                      }}
                    >
                      {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: alpha('#0f0f23', 0.5),
                    borderColor: alpha('#9d4edd', 0.6),
                    color: '#e0aaff',
                    fontFamily: 'monospace',
                    fontSize: '1.3rem',
                    letterSpacing: '4px',
                    fontWeight: 700,
                    borderRadius: 3,
                    '&:hover': {
                      borderColor: '#c77dff',
                      boxShadow: `0 0 25px ${alpha('#c77dff', 0.4)}`
                    },
                    '&.Mui-focused': {
                      borderColor: '#e0aaff',
                      boxShadow: `0 0 35px ${alpha('#e0aaff', 0.6)}`,
                      '& fieldset': {
                        borderWidth: '3px'
                      }
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: alpha('#e0aaff', 0.8),
                    fontFamily: 'monospace',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    '&.Mui-focused': {
                      color: '#e0aaff',
                      textShadow: '0 0 10px #e0aaff'
                    }
                  }
                }}
              />
            </Box>

            {/* Enhanced Error Display */}
            {error && (
              <Zoom in>
                <Alert 
                  severity="error"
                  sx={{
                    mb: 3,
                    backgroundColor: alpha('#7209b7', 0.15),
                    border: `2px solid ${alpha('#7209b7', 0.6)}`,
                    color: '#e0aaff',
                    fontFamily: 'monospace',
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: 3,
                    '& .MuiAlert-icon': { 
                      color: '#c77dff',
                      fontSize: '1.5rem'
                    },
                    boxShadow: `0 0 20px ${alpha('#7209b7', 0.3)}`
                  }}
                >
                  ⚠ {error}
                </Alert>
              </Zoom>
            )}

            {/* Enhanced Success Display */}
            {success && (
              <Zoom in>
                <Alert 
                  severity="success"
                  sx={{
                    mb: 3,
                    backgroundColor: alpha('#e0aaff', 0.15),
                    border: `2px solid ${alpha('#e0aaff', 0.6)}`,
                    color: '#e0aaff',
                    fontFamily: 'monospace',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    borderRadius: 3,
                    '& .MuiAlert-icon': { 
                      color: '#e0aaff',
                      fontSize: '1.5rem'
                    },
                    boxShadow: `0 0 30px ${alpha('#e0aaff', 0.5)}`,
                    animation: `${pulse} 1s infinite`
                  }}
                >
                  👻 ◈ PHANTOM MODE ACTIVATED ◈ Welcome back, Zoe! ∿
                </Alert>
              </Zoom>
            )}

            {/* Mystical Hint */}
            <Typography variant="body2" sx={{ 
              color: alpha('#e0aaff', 0.6),
              fontFamily: 'monospace',
              display: 'block',
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '0.95rem',
              animation: `${pulse} 3s infinite`
            }}>
              ∿ The name that echoes through the digital realm... ∿
            </Typography>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ position: 'relative', zIndex: 2, p: 4, pt: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: alpha('#c77dff', 0.8),
            fontFamily: 'monospace',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '1px',
            px: 3,
            '&:hover': {
              backgroundColor: alpha('#c77dff', 0.1),
              color: '#c77dff',
              transform: 'translateY(-2px)'
            }
          }}
        >
          ◄ ABORT
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !accessKey.trim()}
          variant="outlined"
          sx={{
            borderColor: '#e0aaff',
            color: '#e0aaff',
            fontFamily: 'monospace',
            fontWeight: 800,
            letterSpacing: '2px',
            fontSize: '1rem',
            px: 4,
            py: 1.5,
            borderWidth: '2px',
            borderRadius: 3,
            '&:hover': {
              borderColor: '#e0aaff',
              backgroundColor: alpha('#e0aaff', 0.1),
              boxShadow: `0 0 25px ${alpha('#e0aaff', 0.4)}`,
              transform: 'translateY(-2px)',
              borderWidth: '2px'
            },
            '&:disabled': {
              borderColor: alpha('#e0aaff', 0.3),
              color: alpha('#e0aaff', 0.3)
            }
          }}
        >
          {isSubmitting ? '◈ AUTHENTICATING... ◈' : '◈ ENTER PHANTOM REALM ◈'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 