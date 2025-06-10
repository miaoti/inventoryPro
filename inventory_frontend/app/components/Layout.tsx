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
  BugReport as LogsIcon,
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
        const publicPaths = ['/', '/login', '/register', '/scanner', '/barcode-scanner'];
        const protectedPaths = ['/dashboard', '/quick-stats', '/items', '/alerts', '/usage-reports', '/settings', '/admin', '/profile'];
        
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
            unreadAlerts: response.unreadAlerts || 0,
            activeAlerts: response.activeAlerts || 0
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

  // Don't render the drawer if not authenticated
  const drawer = (
    <div>
      <Toolbar />
      <List>
        <ListItem button onClick={() => handleNavigation('/dashboard')}>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/quick-stats')}>
          <ListItemIcon>
            <AnalyticsIcon />
          </ListItemIcon>
          <ListItemText primary="Quick Stats" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/items')}>
          <ListItemIcon>
            <InventoryIcon />
          </ListItemIcon>
          <ListItemText primary="Items" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/alerts')}>
          <ListItemIcon>
            <Badge badgeContent={unreadAlerts} color="error">
              <AlertIcon />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Alerts" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/usage-reports')}>
          <ListItemIcon>
            <ReportsIcon />
          </ListItemIcon>
          <ListItemText primary="Usage Reports" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/scanner')}>
          <ListItemIcon>
            <ScannerIcon />
          </ListItemIcon>
          <ListItemText primary="Barcode Scanner" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/settings')}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        
        {/* Remove admin/settings navigation - settings moved to main /settings page */}
        
        {/* Owner-only menu items */}
        {user?.role === 'OWNER' && (
          <>
            <ListItem button onClick={() => handleNavigation('/admin/users')}>
              <ListItemIcon>
                <UsersIcon />
              </ListItemIcon>
              <ListItemText primary="User Management" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/admin/purchase-orders')}>
              <ListItemIcon>
                <POStatsIcon />
              </ListItemIcon>
              <ListItemText primary="PO Statistics" />
            </ListItem>
            <ListItem button onClick={() => handleNavigation('/owner-logs')}>
              <ListItemIcon>
                <LogsIcon sx={{ color: '#f44336' }} />
              </ListItemIcon>
              <ListItemText primary="System Logs" />
            </ListItem>
          </>
        )}
        
        <ListItem button onClick={() => handleNavigation('/profile')}>
          <ListItemIcon>
            <ProfileIcon />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
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
            sx={{
              width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` },
              ml: { sm: `${drawerWidth}px` },
              maxWidth: '100vw',
              overflow: 'hidden'
            }}
          >
            <Toolbar sx={{ 
              minWidth: 0,
              width: '100%',
              maxWidth: '100%',
              overflow: 'hidden'
            }}>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { sm: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Typography 
                variant="h6" 
                noWrap 
                component="div" 
                sx={{ 
                  flexGrow: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                Inventory Management
              </Typography>
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
                  overflow: 'hidden'
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
        {isAuthenticated && <Toolbar />}
        {children}
      </Box>
    </Box>
  );
} 