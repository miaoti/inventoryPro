'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { setCredentials } from '../../store/slices/authSlice';
import { profileAPI } from '../../services/api';
import Cookies from 'js-cookie';
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
  Stack,
  LinearProgress,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Container,
  Fade,
  Slide,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  SupervisorAccount as OwnerIcon,
  AdminPanelSettings as AdminIcon,
  AccountBox as AccountIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Badge as BadgeIcon,
  Business as BusinessIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
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
      const response: any = await profileAPI.get();
      const profileData = response.data || response;
      setProfileForm({
        username: profileData.username,
        email: profileData.email,
        fullName: profileData.name,
        currentPassword: '',
        newPassword: '',
      });
      
      // Update Redux store with department information if it's different
      if (user && profileData.department !== user.department) {
        const token = Cookies.get('token') || '';
        dispatch(setCredentials({
          user: {
            ...user,
            department: profileData.department || undefined,
          },
          token: token
        }));
      }
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
    const updateRequest = { ...profileForm };
    
    // Only allow username changes for Owner
    if (!canEditUsername) {
      updateRequest.username = user?.username;
    }
    
    // Remove password fields since password change is not allowed
    delete updateRequest.currentPassword;
    delete updateRequest.newPassword;

    try {
      setLoading(true);
      const response: any = await profileAPI.update(updateRequest);
      
      // Update Redux store with new user info
      if (user) {
        const token = Cookies.get('token') || '';
        dispatch(setCredentials({
          user: {
            ...user,
            username: profileForm.username || user.username,
            email: profileForm.email || user.email,
            fullName: profileForm.fullName || user.fullName,
          },
          token: token
        }));
      }

      const responseData = response.data || response;
      setSnackbar({ 
        open: true, 
        message: responseData.message || 'Profile updated successfully', 
        severity: 'success' 
      });
      
      setIsEditing(false);
      
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
        return <OwnerIcon sx={{ fontSize: 28 }} />;
      case 'ADMIN':
        return <AdminIcon sx={{ fontSize: 28 }} />;
      default:
        return <PersonIcon sx={{ fontSize: 28 }} />;
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

  const getRoleGradient = (role?: string) => {
    switch (role) {
      case 'OWNER':
        return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'ADMIN':
        return 'linear-gradient(135deg, #ffa726 0%, #f57c00 100%)';
      default:
        return 'linear-gradient(135deg, #42a5f5 0%, #1e88e5 100%)';
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          User not found. Please log in again.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'grey.50',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Fade in timeout={600}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 3, 
              flexWrap: 'wrap', 
              gap: 2 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 3, 
                  background: getRoleGradient(user.role), 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 3
                }}>
                  <SettingsIcon sx={{ fontSize: { xs: 28, md: 32 } }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h4" 
                    component="h1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 0.5,
                      fontSize: { xs: '1.75rem', md: '2.125rem' }
                    }}
                  >
                    Profile Settings
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Manage your account information and preferences
                  </Typography>
                </Box>
              </Box>
              
              {/* Status Indicators */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<CheckCircleIcon />}
                  label="Active Account" 
                  color="success"
                  variant="outlined"
                  size="small"
                />
                <Chip 
                  icon={getRoleIcon(user.role)}
                  label={user.role} 
                  color={getRoleColor(user.role) as any}
                  size="small"
                  sx={{ fontWeight: 'bold' }}
                />
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Content Grid */}
        <Grid container spacing={3}>
          {/* Profile Overview Card */}
          <Grid item xs={12} lg={4}>
            <Slide direction="right" in timeout={800}>
              <Card sx={{ 
                height: 'fit-content',
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Avatar and Basic Info */}
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar 
                      sx={{ 
                        width: 100, 
                        height: 100, 
                        mx: 'auto', 
                        mb: 2,
                        background: getRoleGradient(user.role),
                        fontSize: '2.5rem',
                        boxShadow: 4
                      }}
                    >
                      {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
                    </Avatar>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {user.fullName}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      @{user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      fontFamily: 'monospace',
                      bgcolor: alpha(theme.palette.grey[500], 0.1),
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontSize: '0.875rem'
                    }}>
                      {user.email}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Role and Department Info */}
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Role & Permissions
                      </Typography>
                      <Chip 
                        icon={getRoleIcon(user.role)}
                        label={user.role} 
                        color={getRoleColor(user.role) as any}
                        size="medium"
                        sx={{ fontWeight: 'bold', width: '100%' }}
                      />
                    </Box>

                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Department Access
                      </Typography>
                      {user.department ? (
                        <Chip 
                          icon={<BusinessIcon />}
                          label={user.department} 
                          color="info"
                          size="medium"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      ) : user.role === 'OWNER' ? (
                        <Chip 
                          icon={<BusinessIcon />}
                          label="All Departments" 
                          color="success"
                          size="medium"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      ) : (
                        <Chip 
                          icon={<InfoIcon />}
                          label="No Department" 
                          color="warning"
                          size="medium"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Slide>
          </Grid>

          {/* Account Information Card */}
          <Grid item xs={12} lg={8}>
            <Slide direction="left" in timeout={800}>
              <Card sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                overflow: 'hidden'
              }}>
                <CardHeader 
                  title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <AccountIcon color="primary" />
                      <Typography variant="h6">Account Information</Typography>
                    </Box>
                  }
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!isEditing ? (
                        <Button
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => setIsEditing(true)}
                          size="small"
                        >
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setIsEditing(false);
                              fetchProfile(); // Reset form
                            }}
                            size="small"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={loading ? undefined : <SaveIcon />}
                            onClick={handleUpdateProfile}
                            disabled={loading}
                            size="small"
                          >
                            {loading ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </>
                      )}
                    </Box>
                  }
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                />
                <CardContent sx={{ p: 4 }}>
                  {/* Loading Progress */}
                  {loading && (
                    <Box sx={{ width: '100%', mb: 3 }}>
                      <LinearProgress color="primary" />
                    </Box>
                  )}

                  {/* Access Control Notices */}
                  <Stack spacing={2} sx={{ mb: 4 }}>
                    {!canEditUsername && (
                      <Alert 
                        severity="info" 
                        icon={<LockIcon />}
                        sx={{ borderRadius: 2 }}
                      >
                        <Typography variant="body2">
                          <strong>Username Restriction:</strong> As an {user?.role}, you cannot change your username. 
                          Only the Owner has permission to modify usernames.
                        </Typography>
                      </Alert>
                    )}

                    <Alert 
                      severity="info" 
                      icon={<InfoIcon />}
                      sx={{ borderRadius: 2 }}
                    >
                      <Typography variant="body2">
                        <strong>Email Notifications:</strong> To configure email alerts and notification preferences, 
                        please visit the <a href="/settings" style={{ textDecoration: 'underline', color: 'inherit' }}>Settings page</a>.
                      </Typography>
                    </Alert>
                  </Stack>

                  {/* Form Fields */}
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Username"
                        value={profileForm.username}
                        onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                        fullWidth
                        disabled={!canEditUsername || !isEditing}
                        helperText={!canEditUsername ? "Only the Owner can change usernames" : "Username for system login"}
                        InputProps={{
                          startAdornment: <AccountIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: isEditing ? 'background.paper' : alpha(theme.palette.grey[500], 0.05),
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Full Name"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        fullWidth
                        disabled={!isEditing}
                        InputProps={{
                          startAdornment: <PersonIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: isEditing ? 'background.paper' : alpha(theme.palette.grey[500], 0.05),
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Email Address"
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        fullWidth
                        disabled={!isEditing}
                        helperText="Primary email address for your account and notifications"
                        InputProps={{
                          startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: isEditing ? 'background.paper' : alpha(theme.palette.grey[500], 0.05),
                          }
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Additional Information */}
                  <Divider sx={{ my: 4 }} />
                  
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InfoIcon color="primary" />
                      Account Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: alpha(theme.palette.info.main, 0.05),
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                        }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Account Type
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            {user.role} User
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ 
                          p: 2, 
                          bgcolor: alpha(theme.palette.success.main, 0.05),
                          borderRadius: 2,
                          border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                        }}>
                          <Typography variant="subtitle2" color="text.secondary">
                            Account Status
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            Active
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Slide>
          </Grid>
        </Grid>

        {/* Quick Links */}
        <Fade in timeout={1000}>
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  borderRadius: 2
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <SettingsIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Configure notifications and preferences
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  borderRadius: 2
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <BadgeIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Dashboard
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      View your activity and statistics
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  borderRadius: 2
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <BusinessIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Items
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage inventory items
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4
                  },
                  borderRadius: 2
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <PaletteIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Alerts
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Check inventory alerts
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Fade>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={snackbar.severity} 
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
} 