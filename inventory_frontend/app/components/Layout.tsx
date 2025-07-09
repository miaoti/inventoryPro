'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { logout, setCredentials } from '../store/slices/authSlice';
import { setAlerts, updateAlertCounts } from '../store/slices/alertsSlice';
import type { RootState } from '../store';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  Badge,
  Avatar,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  QrCodeScanner as ScannerIcon,
  Warning as AlertIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  SupervisorAccount as OwnerIcon,
  People as UsersIcon,
  ShoppingCart as POStatsIcon,
  AccountCircle as ProfileIcon,
} from '@mui/icons-material';
import Cookies from 'js-cookie';
import { alertsAPI } from '../services/api';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const dispatch = useDispatch();
  const { unreadAlerts } = useSelector((state: RootState) => state.alerts);
  const { isAuthenticated: authIsAuthenticated, token, user } = useSelector((state: RootState) => state.auth);

  // Check authentication status on component mount and when auth state changes
  useEffect(() => {
    const checkAuth = () => {
      const cookieToken = Cookies.get('token');
      const hasToken = !!(cookieToken || token);
      const isAuthenticatedFromStore = authIsAuthenticated;
      
      // If we have a token but the store isn't authenticated yet, wait a bit
      // This allows AuthProvider time to restore the session
      if (hasToken && !isAuthenticatedFromStore) {
        console.log('Layout: Found token but store not authenticated yet, waiting for AuthProvider...');
        // Don't redirect immediately, give AuthProvider time to work
        const timeout = setTimeout(() => {
          // Recheck after a delay
          const stillNotAuthenticated = !authIsAuthenticated;
          if (stillNotAuthenticated) {
            console.log('Layout: Still not authenticated after delay, user may need to login again');
            // Only redirect if we're on a protected page
            if (typeof window !== 'undefined') {
              const currentPath = window.location.pathname;
              const protectedPaths = ['/dashboard', '/quick-stats', '/items', '/alerts', '/usage-reports', '/settings', '/admin', '/profile'];
              
              if (protectedPaths.some(path => currentPath.startsWith(path))) {
                console.log('Layout: Redirecting to login after auth timeout');
                router.push('/login');
              }
            }
          }
        }, 2000); // Wait 2 seconds for AuthProvider to complete
        
        return () => clearTimeout(timeout);
      }
      
      // User is authenticated if they have a token AND the store says they're authenticated
      const authenticated = hasToken && isAuthenticatedFromStore;
      setIsAuthenticated(authenticated);
      
      // Only redirect to login for protected pages if definitely not authenticated
      if (!hasToken && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const publicPaths = ['/', '/login', '/register', '/scanner', '/scan', '/barcode-scanner'];
        const protectedPaths = ['/dashboard', '/quick-stats', '/items', '/alerts', '/usage-reports', '/settings', '/admin', '/profile'];
        
        const isPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/qr-usage');
        
        // Only redirect if user is trying to access a protected page and has no token at all
        if (protectedPaths.some(path => currentPath.startsWith(path))) {
          console.log('Layout: No token found, redirecting to login for protected page');
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [token, authIsAuthenticated, router]);

  // Fetch alert counts periodically to keep sidebar badge updated
  useEffect(() => {
    const fetchAlertCounts = async () => {
      if (isAuthenticated) {
        try {
          const response: any = await alertsAPI.getCounts();
          dispatch(updateAlertCounts({
            unreadAlerts: response.data.unreadAlerts || 0,
            activeAlerts: response.data.activeAlerts || 0
          }));
        } catch (error) {
          console.error('Error fetching alert counts:', error);
        }
      }
    };

    // Fetch immediately when authenticated
    if (isAuthenticated) {
      fetchAlertCounts();
      
      // Reduce frequency to 60 seconds to avoid conflicts with user actions
      const interval = setInterval(fetchAlertCounts, 60000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, dispatch]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    Cookies.remove('token');
    // Clear all possible authentication-related storage
    localStorage.clear();
    sessionStorage.clear();
    // Force reload to ensure all state is cleared
    window.location.href = '/login';
  };

  // Modern drawer with enhanced styling
  const drawer = (
    <Box sx={{ 
      height: '100%',
      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo/Brand Section */}
      <Box sx={{ 
        p: 3, 
        display: 'flex', 
        alignItems: 'center',
        background: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <Avatar sx={{ 
          bgcolor: 'rgba(255,255,255,0.2)', 
          mr: 2,
          width: 48,
          height: 48
        }}>
          <InventoryIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
        </Avatar>
        <Box>
          <Typography variant="h6" sx={{ 
            fontWeight: 700,
            fontSize: '1.1rem',
            lineHeight: 1.2,
            mb: 0.5
          }}>
            Inventory
          </Typography>
          <Typography variant="caption" sx={{ 
            opacity: 0.8,
            fontSize: '0.75rem'
          }}>
            Management System
          </Typography>
        </Box>
      </Box>

      {/* User Info Section */}
      {user && (
        <Box sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          background: 'rgba(255,255,255,0.05)',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Avatar sx={{ 
            bgcolor: 'rgba(255,255,255,0.15)', 
            mr: 2,
            width: 40,
            height: 40,
            fontSize: '1rem',
            fontWeight: 600
          }}>
            {user.fullName?.charAt(0) || user.username?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ 
              fontWeight: 600,
              fontSize: '0.875rem',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.fullName || user.username}
            </Typography>
            <Chip 
              label={user.role} 
              size="small"
              sx={{ 
                mt: 0.5,
                height: 20,
                fontSize: '0.65rem',
                bgcolor: user.role === 'OWNER' ? 'rgba(255,193,7,0.3)' : 
                         user.role === 'ADMIN' ? 'rgba(33,150,243,0.3)' : 'rgba(76,175,80,0.3)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            />
          </Box>
        </Box>
      )}

      {/* Navigation List */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.1)'
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.3)',
          borderRadius: '3px',
          '&:hover': {
            background: 'rgba(255,255,255,0.5)'
          }
        }
      }}>
        <List sx={{ py: 1 }}>
        {/* Main Navigation */}
        <ListItem 
          button 
          onClick={() => handleNavigation('/dashboard')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>

        <ListItem 
          button 
          onClick={() => handleNavigation('/quick-stats')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Quick Stats" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>

        <ListItem 
          button 
          onClick={() => handleNavigation('/items')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Items" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>

        <ListItem 
          button 
          onClick={() => handleNavigation('/alerts')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <Badge badgeContent={unreadAlerts} color="error">
              <AlertIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText 
            primary="Alerts" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>

        <ListItem 
          button 
          onClick={() => handleNavigation('/usage-reports')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <ReportsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Usage Reports" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>

        <ListItem 
          button 
          onClick={() => handleNavigation('/scanner')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <ScannerIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Barcode Scanner" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>

        <ListItem 
          button 
          onClick={() => handleNavigation('/settings')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Settings" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>
        
        {/* Owner-only section */}
        {user?.role === 'OWNER' && (
          <>
            <Divider sx={{ 
              my: 2, 
              mx: 2, 
              borderColor: 'rgba(255,255,255,0.2)' 
            }} />
            
            <Typography variant="overline" sx={{ 
              px: 2, 
              mb: 1, 
              fontSize: '0.7rem',
              fontWeight: 600,
              opacity: 0.7,
              letterSpacing: 1
            }}>
              OWNER
            </Typography>

            <ListItem 
              button 
              onClick={() => handleNavigation('/admin/users')}
              sx={{ 
                mx: 1, 
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText 
                primary="User Management" 
                primaryTypographyProps={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500 
                }} 
              />
            </ListItem>

            <ListItem 
              button 
              onClick={() => handleNavigation('/admin/purchase-orders')}
              sx={{ 
                mx: 1, 
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease'
                }
              }}
            >
              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                <POStatsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="PO Statistics" 
                primaryTypographyProps={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500 
                }} 
              />
            </ListItem>
          </>
        )}
        </List>
      </Box>

      {/* Bottom section */}
      <Box sx={{ mt: 'auto' }}>
        <Divider sx={{ 
          mb: 2, 
          mx: 2, 
          borderColor: 'rgba(255,255,255,0.2)' 
        }} />
        
        <ListItem 
          button 
          onClick={() => handleNavigation('/profile')}
          sx={{ 
            mx: 1, 
            mb: 0.5,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <ProfileIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Profile" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>
        
        <ListItem 
          button 
          onClick={handleLogout}
          sx={{ 
            mx: 1, 
            mb: 2,
            borderRadius: 2,
            '&:hover': {
              backgroundColor: 'rgba(244,67,54,0.2)',
              transform: 'translateX(4px)',
              transition: 'all 0.2s ease'
            }
          }}
        >
          <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{ 
              fontSize: '0.875rem', 
              fontWeight: 500 
            }} 
          />
        </ListItem>
      </Box>
    </Box>
  );

  // Use conditional rendering instead of early returns to avoid hooks issues
  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100%', 
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <CssBaseline />
      
      {/* Only render AppBar and Drawer for authenticated users */}
      {isAuthenticated && (
        <>
          <AppBar
            position="fixed"
            elevation={0}
            sx={{
              width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
              maxWidth: '100vw',
              overflow: 'hidden',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              color: '#1a202c',
              display: { xs: 'block', sm: 'none' } // Only show on mobile for hamburger menu
            }}
          >
            <Toolbar sx={{ 
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden',
              minHeight: 56,
              px: 2,
              justifyContent: 'flex-start'
            }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ 
                  bgcolor: 'rgba(103,126,234,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(103,126,234,0.2)',
                    transform: 'scale(1.05)',
                    transition: 'all 0.2s ease'
                  }
                }}
              >
                <MenuIcon sx={{ color: '#667eea' }} />
              </IconButton>
            </Toolbar>
          </AppBar>
          
          <Box
            component="nav"
            sx={{ 
              width: { sm: drawerWidth }, 
              flexShrink: { sm: 0 },
              maxWidth: { xs: '100vw', sm: drawerWidth }
            }}
          >
            <Drawer
              variant={isMobile ? 'temporary' : 'permanent'}
              open={mobileOpen}
              onClose={handleDrawerToggle}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
              sx={{
                '& .MuiDrawer-paper': {
                  boxSizing: 'border-box',
                  width: drawerWidth,
                  maxWidth: '100vw',
                  overflow: 'hidden',
                  border: 'none',
                  boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
                  '&::-webkit-scrollbar': {
                    width: '6px'
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(255,255,255,0.1)'
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '3px',
                    '&:hover': {
                      background: 'rgba(255,255,255,0.5)'
                    }
                  }
                },
              }}
            >
              {drawer}
            </Drawer>
          </Box>
        </>
      )}
      
      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0, // Remove padding here since each page handles its own
          width: isAuthenticated ? { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` } : '100%',
          maxWidth: '100vw',
          overflow: 'hidden',
          minWidth: 0
        }}
      >
        {/* Only add Toolbar spacer on mobile where AppBar is visible */}
        {isAuthenticated && <Toolbar sx={{ display: { xs: 'block', sm: 'none' } }} />}
        {children}
      </Box>
    </Box>
  );
} 