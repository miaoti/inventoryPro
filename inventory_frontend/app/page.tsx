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
  AppBar,
  Toolbar,
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

  // Get auth state from Redux
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // Check authentication status
  useEffect(() => {
    const token = Cookies.get('token');
    const userData = Cookies.get('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setIsLoggedIn(true);
        setCurrentUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    } else if (isAuthenticated && user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
    } else {
      setIsLoggedIn(false);
      setCurrentUser(null);
    }
  }, [isAuthenticated, user]);

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

  const pricingPlans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 100 items",
        "Basic barcode scanning",
        "2 user accounts",
        "Email support"
      ],
      highlighted: false
    },
    {
      name: "Professional",
      price: "$29/month",
      description: "Ideal for growing businesses",
      features: [
        "Unlimited items",
        "Advanced analytics",
        "Up to 20 users",
        "Priority support",
        "Custom reports",
        "API access"
      ],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Contact Us",
      description: "For large organizations",
      features: [
        "Everything in Professional",
        "Unlimited users",
        "Custom integrations",
        "Dedicated support",
        "On-premise deployment",
        "SLA guarantee"
      ],
      highlighted: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechCorp Solutions",
      rating: 5,
      comment: "Smart Inventory Pro transformed our warehouse operations. The barcode scanning feature saved us hours of manual work every day."
    },
    {
      name: "Michael Chen",
      company: "Manufacturing Plus",
      rating: 5,
      comment: "The real-time alerts have prevented countless stockouts. Our efficiency has improved by 40% since implementing this system."
    },
    {
      name: "Emily Rodriguez",
      company: "Retail Dynamics",
      rating: 5,
      comment: "Easy to use, powerful features, and excellent customer support. Highly recommended for any business managing inventory."
    }
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Navigation */}
      <AppBar position="static" sx={{ bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <InventoryIcon sx={{ mr: 2, color: 'white' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white', fontWeight: 'bold' }}>
            Smart Inventory Pro
          </Typography>
          
          {isLoggedIn && currentUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                  <AccountIcon />
                </Avatar>
                <Typography variant="body1" sx={{ color: 'white', fontWeight: 'bold' }}>
                  Welcome, {currentUser.username}!
                </Typography>
              </Box>
              <Button 
                variant="contained"
                startIcon={<DashboardIcon />}
                onClick={() => router.push('/dashboard')}
                sx={{ 
                  bgcolor: 'primary.main', 
                  '&:hover': { bgcolor: 'primary.dark' },
                  borderRadius: 2,
                  px: 3,
                  fontWeight: 'bold'
                }}
              >
                Dashboard
              </Button>
            </Box>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => router.push('/login')}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                borderRadius: 2,
                px: 3,
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              Login
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 8
      }}>
        <Container maxWidth="lg" sx={{ pt: 8, pb: 6 }}>
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
                  mb: 4, 
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
                      onClick={() => router.push('/dashboard')}
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
                      onClick={() => router.push('/scanner')}
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
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={() => setShowContactForm(true)}
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
                      startIcon={<SecurityIcon />}
                    >
                      Get Started Free
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                      sx={{
                        borderColor: 'white',
                        color: 'white',
                        borderWidth: 2,
                        '&:hover': { 
                          borderColor: 'white', 
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderWidth: 2
                        },
                        px: 4,
                        py: 1.5,
                        borderRadius: 3,
                        textTransform: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                      }}
                    >
                      Learn More
                    </Button>
                  </>
                )}
              </Box>
            </Box>
          </Fade>

          {/* Stats Section */}
          <Grid container spacing={4} sx={{ mb: 8 }}>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 50, color: '#4CAF50', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                  Real-Time
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Inventory Tracking
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <PeopleIcon sx={{ fontSize: 50, color: '#2196F3', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                  Multi-User
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Access Control
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper 
                sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.3)'
                }}
              >
                <SpeedIcon sx={{ fontSize: 50, color: '#FF9800', mb: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#333' }}>
                  Lightning
                </Typography>
                <Typography variant="body1" sx={{ color: '#666' }}>
                  Fast & Efficient
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Contact Form Dialog */}
      <Dialog 
        open={showContactForm} 
        onClose={() => setShowContactForm(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
              Get Started with Smart Inventory Pro
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Fill out the form below and we'll get back to you within 24 hours
            </Typography>
          </Box>
          <Button 
            onClick={() => setShowContactForm(false)}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <CloseIcon />
          </Button>
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent sx={{ pt: 2 }}>
            {formSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Thank you for your interest! We'll contact you within 24 hours at {formData.email}
              </Alert>
            )}
            {formError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name *"
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
                  label="Email Address *"
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
                  label="Company Name"
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

      
      {/* <Box sx={{ bgcolor: 'rgba(255,255,255,0.95)', py: 8 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h2" 
            textAlign="center" 
            gutterBottom 
            sx={{ fontWeight: 'bold', color: '#333', mb: 6 }}
          >
            What Our Customers Say
          </Typography>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    height: '100%',
                    bgcolor: 'white',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    borderRadius: 3,
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}
                >
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} sx={{ color: '#FFD700', fontSize: 20 }} />
                    ))}
                  </Box>
                  <Typography variant="body1" sx={{ color: '#333', mb: 3, fontStyle: 'italic', lineHeight: 1.6 }}>
                    "{testimonial.comment}"
                  </Typography>
                  <Typography variant="subtitle1" sx={{ color: '#333', fontWeight: 'bold' }}>
                    {testimonial.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>
                    {testimonial.company}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box> */}

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
          
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                Contact Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Email"
                    secondary="miaotingshuo@gmail.com"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <SupportIcon sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Support Hours"
                    secondary="Monday - Friday, 9:00 AM - 6:00 PM EST"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BusinessIcon sx={{ color: '#4CAF50' }} />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Business Inquiries"
                    secondary="For enterprise solutions and partnerships"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Why Choose Us?
                </Typography>
                <List>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#4CAF50' }} />
                    </ListItemIcon>
                    <ListItemText primary="24/7 Customer Support" />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#4CAF50' }} />
                    </ListItemIcon>
                    <ListItemText primary="99.9% Uptime Guarantee" />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#4CAF50' }} />
                    </ListItemIcon>
                    <ListItemText primary="Free Migration Support" />
                  </ListItem>
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon>
                      <CheckIcon sx={{ color: '#4CAF50' }} />
                    </ListItemIcon>
                    <ListItemText primary="Regular Updates & New Features" />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ bgcolor: 'rgba(0,0,0,0.3)', py: 6 }}>
        <Container maxWidth="md">
          <Box textAlign="center">
            <Typography 
              variant="h4" 
              component="h2" 
              gutterBottom 
              sx={{ fontWeight: 'bold', color: 'white', mb: 3 }}
            >
              Ready to Transform Your Inventory Management?
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ mb: 4, color: 'rgba(255,255,255,0.9)' }}
            >
              Join thousands of organizations using Smart Inventory Pro to streamline their operations.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowContactForm(true)}
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
            >
              Start Your Free Trial Today
            </Button>
          </Box>
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