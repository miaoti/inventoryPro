'use client';

import { useSelector } from 'react-redux';
import { ThemeProvider, createTheme, alpha, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';
import type { RootState } from '../store';

interface PhantomThemeProviderProps {
  children: React.ReactNode;
}

const phantomGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px rgba(157, 78, 221, 0.3),
                0 0 40px rgba(224, 170, 255, 0.2);
  }
  50% { 
    box-shadow: 0 0 40px rgba(157, 78, 221, 0.5),
                0 0 80px rgba(224, 170, 255, 0.3);
  }
`;

const phantomPulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
`;

const floatParticles = keyframes`
  0%, 100% { transform: translateY(0px) translateX(0px); }
  25% { transform: translateY(-10px) translateX(5px); }
  50% { transform: translateY(0px) translateX(10px); }
  75% { transform: translateY(10px) translateX(5px); }
`;

export default function PhantomThemeProvider({ children }: PhantomThemeProviderProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const isPhantomUser = user?.isPhantomUser || false;

  // Create enhanced phantom theme
  const phantomTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#9d4edd',
        light: '#c77dff',
        dark: '#7209b7',
      },
      secondary: {
        main: '#e0aaff',
        light: '#f0d0ff',
        dark: '#c77dff',
      },
      background: {
        default: '#0f0f23',
        paper: alpha('#1a1a2e', 0.9),
      },
      text: {
        primary: '#e0aaff',
        secondary: '#c77dff',
      },
      success: {
        main: '#c77dff',
      },
      warning: {
        main: '#e0aaff',
      },
      error: {
        main: '#9d4edd',
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            background: `linear-gradient(135deg, ${alpha('#1a1a2e', 0.9)} 0%, ${alpha('#16213e', 0.9)} 100%)`,
            border: `1px solid ${alpha('#9d4edd', 0.3)}`,
            boxShadow: `0 4px 20px ${alpha('#9d4edd', 0.2)}`,
            backdropFilter: 'blur(10px)',
            '&:hover': {
              boxShadow: `0 8px 30px ${alpha('#9d4edd', 0.3)}`,
              transform: 'translateY(-2px)',
              transition: 'all 0.3s ease'
            }
          }
        }
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontFamily: 'monospace',
            fontWeight: 600,
            letterSpacing: '1px',
            borderRadius: 8,
            '&.MuiButton-contained': {
              background: `linear-gradient(135deg, #9d4edd 0%, #c77dff 100%)`,
              boxShadow: `0 4px 15px ${alpha('#9d4edd', 0.4)}`,
              '&:hover': {
                background: `linear-gradient(135deg, #7209b7 0%, #9d4edd 100%)`,
                boxShadow: `0 6px 20px ${alpha('#9d4edd', 0.6)}`,
                transform: 'translateY(-1px)'
              }
            },
            '&.MuiButton-outlined': {
              borderColor: '#c77dff',
              color: '#c77dff',
              borderWidth: '2px',
              '&:hover': {
                borderColor: '#e0aaff',
                color: '#e0aaff',
                backgroundColor: alpha('#c77dff', 0.1),
                borderWidth: '2px'
              }
            }
          }
        }
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: alpha('#0f0f23', 0.7),
              borderColor: alpha('#9d4edd', 0.5),
              '&:hover': {
                borderColor: '#c77dff',
                boxShadow: `0 0 15px ${alpha('#c77dff', 0.3)}`
              },
              '&.Mui-focused': {
                borderColor: '#e0aaff',
                boxShadow: `0 0 20px ${alpha('#e0aaff', 0.4)}`
              }
            },
            '& .MuiInputLabel-root': {
              color: alpha('#e0aaff', 0.7),
              '&.Mui-focused': {
                color: '#e0aaff'
              }
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: `linear-gradient(135deg, ${alpha('#0f0f23', 0.95)} 0%, ${alpha('#1a1a2e', 0.95)} 100%)`,
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${alpha('#9d4edd', 0.3)}`,
            boxShadow: `0 2px 20px ${alpha('#9d4edd', 0.2)}`
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: `linear-gradient(180deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)`,
            borderRight: `2px solid ${alpha('#9d4edd', 0.3)}`,
            boxShadow: `4px 0 20px ${alpha('#9d4edd', 0.2)}`
          }
        }
      }
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { color: '#e0aaff', fontWeight: 700 },
      h2: { color: '#e0aaff', fontWeight: 700 },
      h3: { color: '#e0aaff', fontWeight: 600 },
      h4: { color: '#e0aaff', fontWeight: 600 },
      h5: { color: '#e0aaff', fontWeight: 600 },
      h6: { color: '#e0aaff', fontWeight: 600 },
    }
  });

  // Regular theme (existing light theme)
  const regularTheme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
    },
  });

  const theme = isPhantomUser ? phantomTheme : regularTheme;

  if (!isPhantomUser) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          position: 'relative',
          minHeight: '100vh',
          background: `radial-gradient(ellipse at center, ${alpha('#1a1a2e', 0.8)} 0%, ${alpha('#0f0f23', 0.9)} 70%, #000 100%)`,
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 80%, ${alpha('#9d4edd', 0.1)} 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, ${alpha('#c77dff', 0.1)} 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, ${alpha('#e0aaff', 0.05)} 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -2
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 100px,
              ${alpha('#9d4edd', 0.02)} 100px,
              ${alpha('#9d4edd', 0.02)} 101px
            ),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 100px,
              ${alpha('#c77dff', 0.02)} 100px,
              ${alpha('#c77dff', 0.02)} 101px
            )`,
            pointerEvents: 'none',
            zIndex: -1
          }
        }}
      >
        {/* Floating Particles Effect */}
        {[...Array(15)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'fixed',
              width: '4px',
              height: '4px',
              background: `linear-gradient(45deg, #e0aaff, #c77dff)`,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `${floatParticles} ${4 + Math.random() * 4}s ease-in-out infinite, ${phantomPulse} ${2 + Math.random() * 2}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
              pointerEvents: 'none',
              zIndex: -1,
              filter: 'blur(0.5px)',
              boxShadow: `0 0 10px ${alpha('#e0aaff', 0.6)}`
            }}
          />
        ))}

        {/* Enhanced Content */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            '& .MuiCard-root': {
              animation: `${phantomGlow} 4s ease-in-out infinite`,
              transition: 'all 0.3s ease'
            },
            '& .MuiButton-root': {
              '&:hover': {
                animation: `${phantomPulse} 1s ease-in-out infinite`
              }
            },
            '& .MuiAppBar-root': {
              backdropFilter: 'blur(20px) saturate(180%)',
              background: `linear-gradient(135deg, ${alpha('#0f0f23', 0.9)} 0%, ${alpha('#1a1a2e', 0.9)} 100%)`
            }
          }}
        >
          {children}
        </Box>
      </Box>
    </ThemeProvider>
  );
} 