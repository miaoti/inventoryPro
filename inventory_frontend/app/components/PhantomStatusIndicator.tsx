'use client';

import { useState } from 'react';
import {
  Box,
  Fab,
  Tooltip,
  Typography,
  IconButton,
  Collapse,
  Chip,
  useTheme,
  alpha,
  Zoom,
  keyframes,
} from '@mui/material';
import {
  AutoAwesome as MagicIcon,
  ExpandLess as ExpandLessIcon,
  ExitToApp as ExitIcon,
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  WbTwilight as PhantomIcon,
} from '@mui/icons-material';

interface PhantomStatusIndicatorProps {
  isActive: boolean;
  timeRemaining: string;
  onDeactivate: () => void;
}

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33% { transform: translateY(-8px) rotate(2deg); }
  66% { transform: translateY(8px) rotate(-2deg); }
`;

const phantomPulse = keyframes`
  0%, 100% { 
    box-shadow: 0 0 40px rgba(157, 78, 221, 0.6), 
                0 0 80px rgba(224, 170, 255, 0.3),
                0 0 120px rgba(199, 125, 255, 0.2);
  }
  50% { 
    box-shadow: 0 0 60px rgba(157, 78, 221, 0.8), 
                0 0 120px rgba(224, 170, 255, 0.5),
                0 0 160px rgba(199, 125, 255, 0.3);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const orbitate = keyframes`
  0% { transform: rotate(0deg) translateX(25px) rotate(0deg); }
  100% { transform: rotate(360deg) translateX(25px) rotate(-360deg); }
`;

export default function PhantomStatusIndicator({
  isActive,
  timeRemaining,
  onDeactivate
}: PhantomStatusIndicatorProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!isActive) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1
      }}
    >
      {/* Enhanced Floating Action Button */}
      <Zoom in timeout={800}>
        <Tooltip 
          title={expanded ? "Collapse Phantom Status" : "Phantom Mode Active - Zoe's Realm"}
          arrow
          placement="left"
        >
          <Box sx={{ position: 'relative' }}>
            {/* Orbiting particles */}
            {[...Array(3)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: `linear-gradient(45deg, #e0aaff, #c77dff)`,
                  animation: `${orbitate} ${3 + i}s linear infinite`,
                  animationDelay: `${i * 0.5}s`,
                  filter: 'blur(0.5px)',
                  zIndex: -1
                }}
              />
            ))}
            
            <Fab
              onClick={() => setExpanded(!expanded)}
              sx={{
                background: `linear-gradient(135deg, #9d4edd 0%, #c77dff 30%, #e0aaff 70%, #9d4edd 100%)`,
                backgroundSize: '200% 200%',
                color: 'white',
                width: 72,
                height: 72,
                animation: `${phantomPulse} 3s ease-in-out infinite, ${float} 4s ease-in-out infinite, ${shimmer} 4s linear infinite`,
                border: `2px solid ${alpha('#e0aaff', 0.8)}`,
                '&:hover': {
                  background: `linear-gradient(135deg, #7209b7 0%, #9d4edd 30%, #c77dff 70%, #e0aaff 100%)`,
                  transform: 'scale(1.15)',
                  transition: 'all 0.3s ease'
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -2,
                  left: -2,
                  right: -2,
                  bottom: -2,
                  borderRadius: '50%',
                  background: `conic-gradient(from 0deg, #9d4edd, #c77dff, #e0aaff, #9d4edd)`,
                  zIndex: -1,
                  animation: `${orbitate} 6s linear infinite`
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <MagicIcon sx={{ fontSize: 36 }} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: -12,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: `linear-gradient(45deg, #e0aaff, #c77dff)`,
                    animation: `${float} 2s infinite`,
                    boxShadow: `0 0 15px ${alpha('#e0aaff', 0.8)}`
                  }}
                />
              </Box>
            </Fab>
          </Box>
        </Tooltip>
      </Zoom>

      {/* Enhanced Expanded Controls Panel */}
      <Collapse in={expanded} timeout={500}>
        <Box
          sx={{
            background: `linear-gradient(135deg, 
              ${alpha('#0f0f23', 0.95)} 0%, 
              ${alpha('#1a1a2e', 0.95)} 30%, 
              ${alpha('#16213e', 0.95)} 70%, 
              ${alpha('#0f0f23', 0.95)} 100%)`,
            backdropFilter: 'blur(25px)',
            border: `3px solid ${alpha('#9d4edd', 0.4)}`,
            borderRadius: 4,
            p: 3,
            minWidth: 320,
            maxWidth: 400,
            boxShadow: `0 0 40px ${alpha('#9d4edd', 0.3)}, 
                        inset 0 0 40px ${alpha('#e0aaff', 0.05)}`,
            position: 'relative',
            overflow: 'hidden',
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
                transparent 15px,
                ${alpha('#9d4edd', 0.04)} 15px,
                ${alpha('#9d4edd', 0.04)} 30px
              )`,
              pointerEvents: 'none',
              borderRadius: 'inherit'
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha('#e0aaff', 0.1)}, transparent)`,
              animation: `${shimmer} 6s linear infinite`,
              pointerEvents: 'none'
            }
          }}
        >
          {/* Enhanced Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 3,
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <PhantomIcon sx={{ 
                color: '#e0aaff', 
                fontSize: 28,
                filter: 'drop-shadow(0 0 10px #e0aaff)',
                animation: `${float} 3s infinite`
              }} />
              <Box>
                <Typography variant="h6" sx={{ 
                  color: '#e0aaff',
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  fontSize: '1.1rem',
                  textShadow: '0 0 10px rgba(224, 170, 255, 0.5)'
                }}>
                  ◈ PHANTOM MODE ◈
                </Typography>
                <Typography variant="caption" sx={{ 
                  color: alpha('#e0aaff', 0.7),
                  fontFamily: 'monospace',
                  letterSpacing: '1px',
                  fontSize: '0.8rem'
                }}>
                  ZOE'S DIMENSION
                </Typography>
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={() => setExpanded(false)}
              sx={{ 
                color: alpha('#c77dff', 0.8),
                '&:hover': { 
                  color: '#e0aaff',
                  transform: 'scale(1.2) rotate(180deg)',
                  transition: 'all 0.3s ease'
                }
              }}
            >
              <ExpandLessIcon />
            </IconButton>
          </Box>

          {/* Enhanced Status Chips */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
            <Chip
              label="◆ OMEGA ∞ ◆"
              size="small"
              sx={{
                backgroundColor: alpha('#c77dff', 0.25),
                color: '#c77dff',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: `2px solid ${alpha('#c77dff', 0.6)}`,
                borderRadius: 3,
                boxShadow: `0 0 15px ${alpha('#c77dff', 0.4)}`,
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 20px ${alpha('#c77dff', 0.6)}`
                }
              }}
            />
            <Chip
              label="◈ ZOE PHANTOM ◈"
              size="small"
              sx={{
                backgroundColor: alpha('#9d4edd', 0.25),
                color: '#9d4edd',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: `2px solid ${alpha('#9d4edd', 0.6)}`,
                borderRadius: 3,
                boxShadow: `0 0 15px ${alpha('#9d4edd', 0.4)}`,
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 20px ${alpha('#9d4edd', 0.6)}`
                }
              }}
            />
            <Chip
              label="◇ ETHEREAL ◇"
              size="small"
              sx={{
                backgroundColor: alpha('#e0aaff', 0.25),
                color: '#e0aaff',
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                fontWeight: 800,
                border: `2px solid ${alpha('#e0aaff', 0.6)}`,
                borderRadius: 3,
                boxShadow: `0 0 15px ${alpha('#e0aaff', 0.4)}`,
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: `0 0 20px ${alpha('#e0aaff', 0.6)}`
                }
              }}
            />
          </Box>

          {/* Enhanced Timer Display */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3,
            p: 2.5,
            backgroundColor: alpha('#0f0f23', 0.8),
            border: `2px solid ${alpha('#e0aaff', 0.4)}`,
            borderRadius: 3,
            position: 'relative',
            zIndex: 1,
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(45deg, ${alpha('#e0aaff', 0.05)}, ${alpha('#c77dff', 0.05)})`,
              animation: `${shimmer} 3s linear infinite`
            }
          }}>
            <TimerIcon sx={{ 
              color: '#e0aaff', 
              fontSize: 24,
              filter: 'drop-shadow(0 0 8px #e0aaff)',
              animation: `${float} 2s infinite`
            }} />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="body2" sx={{ 
                color: alpha('#e0aaff', 0.8),
                fontFamily: 'monospace',
                fontWeight: 600,
                fontSize: '0.8rem',
                letterSpacing: '1px'
              }}>
                SESSION REMAINING
              </Typography>
              <Typography variant="h6" sx={{ 
                color: '#e0aaff',
                fontFamily: 'monospace',
                fontWeight: 800,
                letterSpacing: '3px',
                fontSize: '1.3rem',
                textShadow: '0 0 10px rgba(224, 170, 255, 0.8)'
              }}>
                ◈ {timeRemaining} ◈
              </Typography>
            </Box>
          </Box>

          {/* Enhanced Warning */}
          <Box sx={{
            mb: 3,
            p: 2,
            backgroundColor: alpha('#7209b7', 0.15),
            border: `2px solid ${alpha('#7209b7', 0.4)}`,
            borderRadius: 3,
            position: 'relative',
            zIndex: 1
          }}>
            <Typography variant="body2" sx={{ 
              color: alpha('#e0aaff', 0.9),
              fontFamily: 'monospace',
              display: 'block',
              textAlign: 'center',
              fontStyle: 'italic',
              fontSize: '0.9rem',
              fontWeight: 600,
              letterSpacing: '1px'
            }}>
              ⚠ ∿ Actions in Phantom Realm leave no trace ∿ ⚠
            </Typography>
          </Box>

          {/* Enhanced Deactivate Button */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Tooltip title="Exit Phantom Realm">
              <Box
                onClick={onDeactivate}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1.5,
                  backgroundColor: alpha('#7209b7', 0.15),
                  border: `2px solid ${alpha('#7209b7', 0.4)}`,
                  borderRadius: 3,
                  color: '#c77dff',
                  fontFamily: 'monospace',
                  py: 2,
                  px: 3,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    backgroundColor: alpha('#7209b7', 0.25),
                    borderColor: '#c77dff',
                    boxShadow: `0 0 25px ${alpha('#c77dff', 0.4)}`,
                    transform: 'translateY(-2px)',
                    '&::before': {
                      opacity: 1
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha('#c77dff', 0.2)}, transparent)`,
                    transition: 'opacity 0.3s ease',
                    opacity: 0
                  }
                }}
              >
                <ExitIcon sx={{ 
                  fontSize: 20,
                  filter: 'drop-shadow(0 0 5px #c77dff)'
                }} />
                <Typography variant="body1" sx={{ 
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  fontSize: '1rem',
                  position: 'relative',
                  zIndex: 1
                }}>
                  ◄ EXIT PHANTOM REALM ►
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
} 