'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from './store';
import Cookies from 'js-cookie';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Fade,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  QrCodeScanner as ScannerIcon,
  Analytics as AnalyticsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon,
  CloudSync as CloudIcon,
  CheckCircle as CheckIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  NotificationsActive as AlertIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Business as BusinessIcon,
  Support as SupportIcon,
  Close as CloseIcon,
  Dashboard as DashboardIcon,
  AccountCircle as AccountIcon,
  Login as LoginIcon,
} from '@mui/icons-material';

export default function LandingPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  // Get auth state from Redux
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Check authentication status and URL parameters
  useEffect(() => {
    const validateAuthenticationStatus = async () => {
      // Check for error parameters in URL
      const urlParams = new URLSearchParams(window.location.search);
      const errorParam = urlParams.get('error');
      
      if (errorParam) {
        switch (errorParam) {
          case 'session_expired':
            setAuthError('Your session has expired. Please log in again.');
            break;
          case 'concurrent_session':
            setAuthError('You have been logged out because your account was accessed from another location.');
            break;
          case 'invalid_token':
            setAuthError('Your session is invalid. Please log in again.');
            break;
          case 'token_expired':
            setAuthError('Your login session has expired. Please log in again.');
            break;
          default:
            setAuthError('Please log in to continue.');
        }
        
        // Clear the error parameter from URL
        router.replace('/', undefined);
        setIsLoggedIn(false);
        setCurrentUser(null);
        return;
      }

      const token = Cookies.get('token');
      const userData = Cookies.get('user');
      
      if (token && userData) {
        try {
          // Import authAPI dynamically to avoid module loading issues
          const { authAPI } = await import('./services/api');
          
          // Check if token is expired using the API service
          const isValidAuth = authAPI.checkAuth();
          
          if (isValidAuth) {
            // Token is valid, proceed with login
            const parsedUser = JSON.parse(userData);
            setIsLoggedIn(true);
            setCurrentUser(parsedUser);
            setAuthError(null);
          } else {
            // Token is expired or invalid
            console.log('Token validation failed - clearing auth state');
            setAuthError('Your session has expired. Please log in again to continue.');
            setIsLoggedIn(false);
            setCurrentUser(null);
            
            // Clear the expired token data
            authAPI.clearAuthData();
          }
        } catch (error) {
          console.error('Error validating authentication:', error);
          setAuthError('Authentication error. Please log in again.');
          setIsLoggedIn(false);
          setCurrentUser(null);
          
          // Clear potentially corrupted auth data
          Cookies.remove('token');
          Cookies.remove('user');
        }
      } else if (isAuthenticated && user) {
        // Use Redux state if available
        setIsLoggedIn(true);
        setCurrentUser(user);
        setAuthError(null);
      } else {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    };

    validateAuthenticationStatus();
  }, [isAuthenticated, user, router]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');

    try {
      // Send contact form to Spring Boot backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/contact/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          message: formData.message,
          subject: 'New Contact Form Submission - Smart Inventory Pro'
        }),
      });

      // Check if response has JSON content before parsing
      let result;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // Handle non-JSON responses (like 403 errors)
        result = { message: `Server returned ${response.status}: ${response.statusText}` };
      }

      if (response.ok) {
        setFormSuccess(true);
        setFormData({ name: '', email: '', company: '', phone: '', message: '' });
        setTimeout(() => {
          setShowContactForm(false);
          setFormSuccess(false);
        }, 3000);
      } else {
        throw new Error(result.message || `Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to send message. Please try again or contact us directly at miaotingshuo@gmail.com';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage = 'Network error. Please check that the backend server is running and try again.';
        } else if (error.message.includes('Forbidden') || error.message.includes('403')) {
          errorMessage = 'Access denied. Please try again or contact us directly at miaotingshuo@gmail.com';
        } else if (error.message.includes('json')) {
          errorMessage = 'Server response error. Please try again or contact us directly at miaotingshuo@gmail.com';
        } else if (error.message && error.message !== 'Failed to send message') {
          errorMessage = error.message;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setFormSubmitting(false);
    }
  };

  const features = [
    {
      icon: <InventoryIcon sx={{ fontSize: 40 }} />,
      title: "Smart Inventory Management",
      description: "Track your inventory in real-time with automated stock level monitoring and intelligent reorder alerts.",
      color: "primary"
    },
    {
      icon: <ScannerIcon sx={{ fontSize: 40 }} />,
      title: "Barcode Scanning",
      description: "Scan barcodes with your camera or manually enter codes for quick item lookup and usage tracking.",
      color: "secondary"
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
      title: "Usage Analytics",
      description: "Get detailed reports on item usage, user activity, and inventory trends to make informed decisions.",
      color: "success"
    },
    {
      icon: <AlertIcon sx={{ fontSize: 40 }} />,
      title: "Smart Alerts",
      description: "Receive automatic notifications when items are running low or need attention.",
      color: "warning"
    }
  ];

  const benefits = [
    "Real-time inventory tracking",
    "User-specific usage monitoring",
    "Automated low-stock alerts",
    "Comprehensive reporting dashboard",
    "Mobile-friendly barcode scanning",
    "Admin and user role management"
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8
      }}>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
          {/* Auth Error Alert */}
          {authError && (
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
              <Alert 
                severity="warning" 
                onClose={() => setAuthError(null)}
                sx={{ 
                  maxWidth: '600px',
                  bgcolor: 'rgba(255, 193, 7, 0.9)',
                  color: 'black',
                  fontWeight: 'bold',
                  '& .MuiAlert-icon': {
                    color: 'black'
                  }
                }}
              >
                {authError}
              </Alert>
            </Box>
          )}
          
          <Fade in timeout={1000}>
            <Box textAlign="center" sx={{ mb: 8 }}>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'white',
                  textShadow: '3px 3px 6px rgba(0,0,0,0.5)',
                  mb: 3
                }}
              >
                {isLoggedIn && currentUser ? 
                  `Welcome back, ${currentUser.username}!` : 
                  'Smart Inventory Management'
                }
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  mb: 6, 
                  color: 'white',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                  maxWidth: '800px',
                  mx: 'auto',
                  lineHeight: 1.6,
                  fontWeight: 500
                }}
              >
                {isLoggedIn && currentUser ? 
                  'Ready to manage your inventory? Access your dashboard to track items, scan barcodes, and view analytics.' :
                  'Streamline your inventory operations with intelligent tracking, barcode scanning, and real-time analytics. Perfect for warehouses, offices, and any organization that needs to track item usage.'
                }
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                {isLoggedIn && currentUser ? (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={async () => {
                        try {
                          // Validate token before navigation
                          const { authAPI } = await import('./services/api');
                          const isValidAuth = authAPI.checkAuth();
                          
                          if (isValidAuth) {
                            router.push('/dashboard');
                          } else {
                            // Token is expired, clear auth and show error
                            authAPI.clearAuthData();
                            setAuthError('Your session has expired. Please log in again to access the dashboard.');
                            setIsLoggedIn(false);
                            setCurrentUser(null);
                          }
                        } catch (error) {
                          console.error('Error validating token for dashboard access:', error);
                          setAuthError('Authentication error. Please log in again.');
                          setIsLoggedIn(false);
                          setCurrentUser(null);
                        }
                      }}
                      sx={{
                        bgcolor: '#4CAF50',
                        '&:hover': { bgcolor: '#45a049' },
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                      }}
                      startIcon={<DashboardIcon />}
                    >
                      Go to Dashboard
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={async () => {
                        try {
                          // Validate token before navigation
                          const { authAPI } = await import('./services/api');
                          const isValidAuth = authAPI.checkAuth();
                          
                          if (isValidAuth) {
                            router.push('/scanner');
                          } else {
                            // Token is expired, clear auth and show error
                            authAPI.clearAuthData();
                            setAuthError('Your session has expired. Please log in again to access the scanner.');
                            setIsLoggedIn(false);
                            setCurrentUser(null);
                          }
                        } catch (error) {
                          console.error('Error validating token for scanner access:', error);
                          setAuthError('Authentication error. Please log in again.');
                          setIsLoggedIn(false);
                          setCurrentUser(null);
                        }
                      }}
                      sx={{
                        bgcolor: '#2196F3',
                        '&:hover': { bgcolor: '#1976D2' },
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                      }}
                      startIcon={<ScannerIcon />}
                    >
                      Scan Items
                    </Button>
                  </>
                ) : (
                <Button
                  variant="contained"
                  size="large"
                    onClick={() => router.push('/login')}
                  sx={{
                    bgcolor: '#4CAF50',
                    '&:hover': { bgcolor: '#45a049' },
                      px: 6,
                      py: 2,
                    borderRadius: 3,
                    textTransform: 'none',
                      fontSize: '1.2rem',
                    fontWeight: 'bold',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)'
                  }}
                    startIcon={<LoginIcon />}
                >
                    Login to Get Started
                </Button>
                )}
              </Box>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Contact Form Dialog */}
      <Dialog 
        open={showContactForm} 
        onClose={() => setShowContactForm(false)} 
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#667eea', color: 'white', textAlign: 'center' }}>
          Contact Us
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ p: 3 }}>
            {formSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Thank you! Your message has been sent successfully. We'll get back to you soon.
              </Alert>
            )}
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  required
                  disabled={formSubmitting}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email *"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  required
                  disabled={formSubmitting}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={formData.company}
                  onChange={handleFormChange}
                  disabled={formSubmitting}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  disabled={formSubmitting}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tell us about your inventory management needs"
                  name="message"
                  value={formData.message}
                  onChange={handleFormChange}
                  multiline
                  rows={4}
                  disabled={formSubmitting}
                  placeholder="e.g., Number of items, team size, specific requirements..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={() => setShowContactForm(false)} 
              disabled={formSubmitting}
              sx={{ mr: 1 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={formSubmitting || !formData.name || !formData.email}
              startIcon={formSubmitting ? <CircularProgress size={20} /> : <EmailIcon />}
              sx={{
                bgcolor: '#4CAF50',
                '&:hover': { bgcolor: '#45a049' },
                px: 3
              }}
            >
              {formSubmitting ? 'Sending...' : 'Send Message'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Features Section */}
      <Box id="features" sx={{ bgcolor: 'rgba(255,255,255,0.95)', py: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            textAlign="center" 
            gutterBottom 
            sx={{ fontWeight: 'bold', color: '#333', mb: 6 }}
          >
            Powerful Features
          </Typography>
          
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    transition: 'all 0.3s ease',
                    transform: hoveredCard === index ? 'translateY(-5px)' : 'translateY(0)',
                    boxShadow: hoveredCard === index ? '0 10px 30px rgba(0,0,0,0.2)' : '0 2px 10px rgba(0,0,0,0.1)',
                    '&:hover': {
                      cursor: 'pointer'
                    }
                  }}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                      <Box 
                        sx={{ 
                          p: 2, 
                          borderRadius: 2, 
                          bgcolor: `${feature.color}.light`,
                          mr: 2
                        }}
                      >
                        {feature.icon}
                      </Box>
                      <Typography variant="h5" component="h3" sx={{ fontWeight: 'bold' }}>
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.95)', py: 8 }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom 
                sx={{ fontWeight: 'bold', color: '#333', mb: 4 }}
              >
                About Smart Inventory Pro
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ mb: 3, color: '#555', lineHeight: 1.6 }}
              >
                Founded in 2024, Smart Inventory Pro is dedicated to revolutionizing how businesses manage their inventory. 
                Our team of experienced developers and industry experts have created a solution that combines cutting-edge 
                technology with practical functionality.
              </Typography>
              <List>
                {benefits.map((benefit, index) => (
                  <ListItem key={index} sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#4CAF50' }} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={benefit} 
                      primaryTypographyProps={{
                        color: '#333',
                        fontSize: '1.1rem'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'white',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <CloudIcon sx={{ fontSize: 80, color: '#2196F3', mb: 3 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
                  Cloud-Ready Architecture
                </Typography>
                <Typography variant="body1" sx={{ color: '#555', mb: 3, lineHeight: 1.6 }}>
                  Built with modern technologies for scalability, security, and performance. 
                  Access your inventory data from anywhere, anytime.
                </Typography>
                <Chip 
                  label="Enterprise Ready" 
                  sx={{ 
                    bgcolor: '#4CAF50', 
                    color: 'white',
                    fontWeight: 'bold'
                  }} 
                />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.95)', py: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            textAlign="center" 
            gutterBottom 
            sx={{ fontWeight: 'bold', color: '#333', mb: 6 }}
          >
            Get In Touch
          </Typography>
          
          <Grid container spacing={6} justifyContent="center">
            <Grid item xs={12} md={8}>
                <Paper 
                  sx={{ 
                  p: 6, 
                    borderRadius: 3,
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
                  Contact Information
                  </Typography>
                <Grid container spacing={4}>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <EmailIcon sx={{ fontSize: 50, mb: 2, color: 'rgba(255,255,255,0.9)' }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Email
                  </Typography>
                      <Typography variant="body1">
                        miaotingshuo@gmail.com
                  </Typography>
                    </Box>
              </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <SupportIcon sx={{ fontSize: 50, mb: 2, color: 'rgba(255,255,255,0.9)' }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Support Hours
          </Typography>
                      <Typography variant="body1" sx={{ textAlign: 'center' }}>
                        Monday - Friday<br />9:00 AM - 6:00 PM EST
              </Typography>
                    </Box>
            </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <BusinessIcon sx={{ fontSize: 50, mb: 2, color: 'rgba(255,255,255,0.9)' }} />
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Business Inquiries
                </Typography>
                      <Typography variant="body1" sx={{ textAlign: 'center' }}>
                        Enterprise solutions<br />& partnerships
                      </Typography>
                    </Box>
            </Grid>
          </Grid>
                <Box sx={{ mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowContactForm(true)}
              sx={{
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                      px: 4,
                      py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                      fontSize: '1.1rem',
                fontWeight: 'bold',
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.3)'
              }}
                    startIcon={<EmailIcon />}
            >
                    Send Message
            </Button>
          </Box>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.7)', py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <InventoryIcon sx={{ mr: 2, color: 'white' }} />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Smart Inventory Pro
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                The most advanced inventory management solution for modern businesses. 
                Streamline your operations with intelligent tracking and analytics.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Quick Links
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button 
                  color="inherit" 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.7)' }}
                >
                  Features
                </Button>
                <Button 
                  color="inherit" 
                  onClick={() => router.push('/login')}
                  sx={{ justifyContent: 'flex-start', color: 'rgba(255,255,255,0.7)' }}
                >
                  Login
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', mb: 2 }}>
                Contact Us
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EmailIcon sx={{ mr: 1, color: 'rgba(255,255,255,0.7)', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  miaotingshuo@gmail.com
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Professional support available Monday - Friday
              </Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 4, bgcolor: 'rgba(255,255,255,0.2)' }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography 
              variant="body2" 
              sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}
            >
              © 2024 Smart Inventory Pro. All rights reserved.
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Built with modern technology for modern businesses. Transforming inventory management worldwide.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
} 