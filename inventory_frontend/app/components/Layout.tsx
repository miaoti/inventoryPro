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
  const { isAuthenticated: authIsAuthenticated, token } = useSelector((state: RootState) => state.auth);

  // Check authentication status on component mount and when auth state changes
  useEffect(() => {
    const checkAuth = () => {
      const cookieToken = Cookies.get('token');
      
      if (cookieToken && !authIsAuthenticated) {
        // If we have a token but Redux doesn't know about it, set the auth state
        // This happens on page refresh
        // Note: In a production app, you'd want to verify this token with the backend
        dispatch(setCredentials({ 
          user: {
            id: 0, // You'd get this from token or API call
            username: 'user', // You'd get this from token or API call
            email: 'user@example.com', // You'd get this from token or API call
            fullName: 'User', // You'd get this from token or API call
            role: 'USER' as const // You'd get this from token or API call
          }, 
          token: cookieToken 
        }));
        setIsAuthenticated(true);
        return;
      }
      
      const hasToken = !!(cookieToken || token);
      const isAuthenticatedFromStore = authIsAuthenticated;
      
      // User is authenticated if they have a token AND the store says they're authenticated
      const authenticated = hasToken && isAuthenticatedFromStore;
      setIsAuthenticated(authenticated);
      
      // Only redirect to login for protected pages (not public pages like scanner)
      if (!authenticated && typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const publicPaths = ['/', '/login', '/register', '/scanner', '/barcode-scanner'];
        const protectedPaths = ['/dashboard', '/quick-stats', '/items', '/alerts', '/usage-reports', '/settings'];
        
        // Only redirect if user is trying to access a protected page
        if (protectedPaths.some(path => currentPath.startsWith(path))) {
          console.log('Trying to access protected page without authentication, redirecting to login...');
          router.push('/login');
        }
      }
    };

    checkAuth();
  }, [token, authIsAuthenticated, router, dispatch]);

  // Fetch alert counts periodically to keep sidebar badge updated
  useEffect(() => {
    const fetchAlertCounts = async () => {
      if (isAuthenticated) {
        try {
          const response = await alertsAPI.getCounts();
          dispatch(updateAlertCounts({
            unreadAlerts: response.data.unreadAlerts,
            activeAlerts: response.data.activeAlerts
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
    router.push('/login');
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
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  // If not authenticated, render children without the sidebar layout
  if (!isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', width: '100%' }}>
        <CssBaseline />
        <Box component="main" sx={{ flexGrow: 1, width: '100%' }}>
          {children}
        </Box>
      </Box>
    );
  }

  // Authenticated users get the full layout with sidebar
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Inventory Management
          </Typography>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
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
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
} 