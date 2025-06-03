'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Paper,
  Divider,
  Switch,
  FormControlLabel,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { userAPI } from '../../services/api';

interface UserSettings {
  alertEmail: string;
  enableEmailAlerts: boolean;
  enableDailyDigest: boolean;
}

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [settings, setSettings] = useState<UserSettings>({
    alertEmail: '',
    enableEmailAlerts: true,
    enableDailyDigest: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      // Initialize with user's email as default
      setSettings(prev => ({
        ...prev,
        alertEmail: user.email,
      }));
      
      // TODO: Load actual user settings from backend
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    try {
      const response = await userAPI.getSettings();
      setSettings({
        alertEmail: response.data.alertEmail,
        enableEmailAlerts: response.data.enableEmailAlerts,
        enableDailyDigest: response.data.enableDailyDigest,
      });
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError('Failed to load settings. Please try again.');
    }
  };

  const handleInputChange = (field: keyof UserSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await userAPI.updateSettings(settings);
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save settings. Please try again.');
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Please log in to access settings.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          <SettingsIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account preferences and notification settings
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1 }} />
                Profile Information
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Full Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {user.fullName}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Username
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {user.username}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Email
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {user.email}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Role
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', textTransform: 'capitalize' }}>
                  {user.role.toLowerCase()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1 }} />
                Notification Settings
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Alert Email Address"
                  value={settings.alertEmail}
                  onChange={handleInputChange('alertEmail')}
                  type="email"
                  helperText="Email address where inventory alerts will be sent"
                  InputProps={{
                    startAdornment: (
                      <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    ),
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableEmailAlerts}
                      onChange={handleInputChange('enableEmailAlerts')}
                      color="primary"
                    />
                  }
                  label="Enable Email Alerts"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Receive email notifications when inventory levels are low
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableDailyDigest}
                      onChange={handleInputChange('enableDailyDigest')}
                      color="primary"
                    />
                  }
                  label="Daily Digest"
                />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                  Receive a daily summary of inventory activity
                </Typography>
              </Box>
              
              <Divider sx={{ my: 3 }} />
              
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading || !settings.alertEmail}
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                sx={{
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  px: 3,
                  py: 1.5,
                }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 