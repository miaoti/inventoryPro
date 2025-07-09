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
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

export default function ProfilePage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
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
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      // Fetch profile data
      const profileResponse = await profileAPI.get();
      const profileData = profileResponse.data || profileResponse;
      
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
      console.error('Error fetching profile data:', error);
      setSnackbar({ 
        open: true, 
        message: 'Failed to load profile data', 
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
    
    // Only include password fields if they're filled
    if (!updateRequest.currentPassword || !updateRequest.newPassword) {
      delete updateRequest.currentPassword;
      delete updateRequest.newPassword;
    }

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
      // Clear password fields
      setProfileForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: ''
      }));
      
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
      <Container maxWidth="md">
        {/* Simplified Header */}
        <Fade in timeout={600}>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2,
                background: getRoleGradient(user.role),
                fontSize: '2rem',
                boxShadow: 4
              }}
            >
              {user.fullName?.charAt(0)?.toUpperCase() || user.username?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              {user.fullName}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              @{user.username}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Chip 
                icon={getRoleIcon(user.role)}
                label={user.role} 
                color={getRoleColor(user.role) as any}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              {user.department && (
                <Chip 
                  icon={<BusinessIcon />}
                  label={user.department} 
                  color="info"
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Fade>

        {/* Main Profile Card */}
        <Slide direction="up" in timeout={800}>
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
                          fetchProfileData(); // Reset form
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

              {/* Access Control Notice */}
              {!canEditUsername && (
                <Alert 
                  severity="info" 
                  icon={<LockIcon />}
                  sx={{ borderRadius: 2, mb: 3 }}
                >
                  <Typography variant="body2">
                    <strong>Username Restriction:</strong> As an {user?.role}, you cannot change your username. 
                    Only the Owner has permission to modify usernames.
                  </Typography>
                </Alert>
              )}

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
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Email Address"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    fullWidth
                    disabled={!isEditing}
                    helperText="Used for account access and all notifications"
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

                {/* Password Fields - Only show when editing */}
                {isEditing && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Current Password"
                        type={showPassword ? 'text' : 'password'}
                        value={profileForm.currentPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, currentPassword: e.target.value })}
                        fullWidth
                        helperText="Required to change password"
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="New Password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={profileForm.newPassword}
                        onChange={(e) => setProfileForm({ ...profileForm, newPassword: e.target.value })}
                        fullWidth
                        helperText="Leave blank to keep current password"
                        InputProps={{
                          startAdornment: <LockIcon sx={{ mr: 1, color: 'action.active' }} />,
                          endAdornment: (
                            <IconButton
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              edge="end"
                            >
                              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>

              {/* Additional Information */}
              <Divider sx={{ my: 4 }} />
              
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InfoIcon color="primary" />
                  Account Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
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
                  <Grid item xs={12} sm={4}>
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
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ 
                      p: 2, 
                      bgcolor: alpha(theme.palette.warning.main, 0.05),
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
                    }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {user.department || 'None Assigned'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Slide>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
} 