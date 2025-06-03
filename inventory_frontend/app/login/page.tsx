'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { login } from '../store/slices/authSlice';
import type { AppDispatch } from '../store';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  InputAdornment,
  Link,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await dispatch(login(formData));
      
      if (login.fulfilled.match(result)) {
        router.push('/dashboard');
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left side - Login Form */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={24}
              sx={{ 
                p: 6, 
                borderRadius: 4,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <IconButton
                  onClick={() => router.push('/')}
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    left: 16,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.1)' }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      p: 2, 
                      borderRadius: '50%', 
                      bgcolor: 'primary.light',
                      display: 'inline-flex'
                    }}
                  >
                    <InventoryIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                  </Box>
                </Box>
                
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sign in to Smart Inventory Pro
                </Typography>
              </Box>

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
                    }
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>

              {/* Quick Access */}
              <Divider sx={{ my: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Quick Access
                </Typography>
              </Divider>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => router.push('/scanner')}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a6fd8',
                    bgcolor: 'rgba(102, 126, 234, 0.1)'
                  }
                }}
              >
                Go to Barcode Scanner (No Login Required)
              </Button>
            </Paper>
          </Grid>

          {/* Right side - Demo Credentials & Features */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white' }}>
              <Typography variant="h3" component="h2" sx={{ fontWeight: 'bold', mb: 4 }}>
                Smart Inventory Management
              </Typography>
              
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, lineHeight: 1.6 }}>
                Efficiently track your inventory, monitor usage, and generate comprehensive reports 
                with our advanced barcode scanning technology.
              </Typography>

              {/* Features List */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Key Features:
                </Typography>
                <Box component="ul" sx={{ pl: 2, color: 'rgba(255,255,255,0.9)' }}>
                  <Typography component="li" sx={{ mb: 1 }}>📱 Mobile-friendly barcode scanning</Typography>
                  <Typography component="li" sx={{ mb: 1 }}>📊 Real-time inventory tracking</Typography>
                  <Typography component="li" sx={{ mb: 1 }}>👥 Multi-user access control</Typography>
                  <Typography component="li" sx={{ mb: 1 }}>📈 Comprehensive usage analytics</Typography>
                  <Typography component="li" sx={{ mb: 1 }}>🔔 Automated low-stock alerts</Typography>
                  <Typography component="li" sx={{ mb: 1 }}>💾 Secure data management</Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  onClick={() => router.push('/')}
                  sx={{
                    color: 'white',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    '&:hover': { color: 'rgba(255,255,255,0.8)' }
                  }}
                >
                  ← Back to Homepage
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
} 