'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setCredentials } from '../../store/slices/authSlice';
import { profileAPI } from '../../services/api';
import { ProfileUpdateRequest } from '../../types/user';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Snackbar,
  Divider,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  SupervisorAccount as OwnerIcon,
  AdminPanelSettings as AdminIcon,
  AccountBox as AccountIcon,
} from '@mui/icons-material';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  
  // Role-based access control
  const isOwner = user?.role === 'OWNER';
  const canEditUsername = isOwner; // Only Owner can edit usernames
  const [profileForm, setProfileForm] = useState<ProfileUpdateRequest>({
    username: '',
    email: '',
    fullName: '',
    currentPassword: '',
    newPassword: '',
  });
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const profile = await profileAPI.get();
      setProfileForm({
        username: profile.username,
        email: profile.email,
        fullName: profile.name,
        currentPassword: '',
        newPassword: '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to load profile', 
        severity: 'error' 
      });
    }
  };

  const handleUpdateProfile = async () => {
    // Create update request with role-based restrictions
    const updateRequest = { ...profileForm };
    
    // Only allow username changes for Owner
    if (!canEditUsername) {
      updateRequest.username = user?.username; // Keep original username
    }
    
    // Remove password fields since password change is not allowed
    delete updateRequest.currentPassword;
    delete updateRequest.newPassword;

    try {
      setLoading(true);
      const response = await profileAPI.update(updateRequest);
      
      // Update Redux store with new user info
      if (user) {
        dispatch(setCredentials({
          user: {
            ...user,
            username: profileForm.username || user.username,
            email: profileForm.email || user.email,
            fullName: profileForm.fullName || user.fullName,
          },
          token: user ? localStorage.getItem('token') || '' : ''
        }));
      }

      setSnackbar({ 
        open: true, 
        message: response.message, 
        severity: 'success' 
      });
      
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = error.response?.data?.message || 'Failed to update profile';
      setSnackbar({ 
        open: true, 
        message, 
        severity: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return <OwnerIcon sx={{ color: '#f44336', fontSize: 40 }} />;
      case 'ADMIN':
        return <AdminIcon sx={{ color: '#ff9800', fontSize: 40 }} />;
      default:
        return <PersonIcon sx={{ color: '#2196f3', fontSize: 40 }} />;
    }
  };

  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return 'error';
      case 'ADMIN':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          User not found. Please log in again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SettingsIcon />
        Profile Settings
      </Typography>

      {/* Role-based access notice */}
      {!canEditUsername && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> As an {user?.role}, you cannot change your username. Only the Owner can modify usernames for all users.
          </Typography>
        </Alert>
      )}

      {/* Email alerts configuration notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Email Notifications:</strong> To configure email alerts and notification preferences, please visit the{' '}
          <a href="/settings" style={{ textDecoration: 'underline' }}>Settings page</a>.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {/* Profile Overview */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader 
              title="Profile Overview"
              avatar={
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  {getRoleIcon(user.role)}
                </Avatar>
              }
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="h6">{user.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    @{user.username}
                  </Typography>
                </Box>
                <Box>
                  <Chip 
                    label={user.role} 
                    color={getRoleColor(user.role) as any}
                    size="small"
                    icon={getRoleIcon(user.role)}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Settings */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Account Information" />
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Username"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                    fullWidth
                    disabled={!canEditUsername}
                    helperText={!canEditUsername ? "Only the Owner can change usernames" : "Username for system login"}
                    InputProps={{
                      startAdornment: <AccountIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Full Name"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    fullWidth
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    fullWidth
                    helperText="Primary email address for your account"
                    InputProps={{
                      startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Button
                variant="contained"
                onClick={handleUpdateProfile}
                disabled={loading}
                size="large"
                sx={{ minWidth: 140 }}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 