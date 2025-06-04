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
  FormControl,
  FormGroup,
  Checkbox,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  DisplaySettings as DisplayIcon,
} from '@mui/icons-material';
import { userAPI } from '../../services/api';
import { adminAPI } from '../../services/api';

interface UserSettings {
  alertEmail: string;
  enableEmailAlerts: boolean;
  enableDailyDigest: boolean;
}

interface AdminDisplaySettings {
  selectedFields: string[];
  availableFields: { [key: string]: string };
}

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [settings, setSettings] = useState<UserSettings>({
    alertEmail: '',
    enableEmailAlerts: true,
    enableDailyDigest: false,
  });
  const [adminDisplaySettings, setAdminDisplaySettings] = useState<AdminDisplaySettings | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  // Check if user is admin
  const isAdmin = user?.role === 'ADMIN' || user?.username?.toLowerCase() === 'admin';

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        alertEmail: user.email,
      }));
      
      loadUserSettings();
      
      // Load admin settings if user is admin
      if (isAdmin) {
        loadAdminDisplaySettings();
      }
    }
  }, [user, isAdmin]);

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

  const loadAdminDisplaySettings = async () => {
    try {
      const response = await adminAPI.getItemDisplaySettings();
      setAdminDisplaySettings(response.data);
      setSelectedFields(response.data.selectedFields || []);
    } catch (err) {
      console.error('Failed to load admin display settings:', err);
      setAdminError('Failed to load display settings.');
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

  const handleFieldChange = (field: string, checked: boolean) => {
    if (checked) {
      setSelectedFields([...selectedFields, field]);
    } else {
      setSelectedFields(selectedFields.filter(f => f !== field));
    }
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

  const handleSaveAdminSettings = async () => {
    if (selectedFields.length === 0) {
      setAdminError('Please select at least one field to display');
      return;
    }

    try {
      setAdminLoading(true);
      setAdminError('');
      setAdminSuccess('');
      
      await adminAPI.updateItemDisplaySettings(selectedFields);
      setAdminSuccess('Display settings saved successfully!');
      
      // Update local state
      if (adminDisplaySettings) {
        setAdminDisplaySettings({
          ...adminDisplaySettings,
          selectedFields
        });
      }
      
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving admin settings:', error);
      setAdminError('Failed to save display settings. Please try again.');
      setTimeout(() => setAdminError(''), 5000);
    } finally {
      setAdminLoading(false);
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
      {adminSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {adminSuccess}
        </Alert>
      )}
      {adminError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {adminError}
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

        {/* Admin Display Settings */}
        {isAdmin && (
          <Grid item xs={12}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
                  <DisplayIcon sx={{ mr: 1 }} />
                  Item Display Configuration
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Select which item fields should be displayed in the Record Item Usage page when staff scan items. 
                  This customizes what information is shown during the usage recording process.
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} md={8}>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Available Fields
                    </Typography>
                    
                    {adminDisplaySettings && (
                      <FormControl component="fieldset">
                        <FormGroup>
                          <Grid container spacing={1}>
                            {Object.entries(adminDisplaySettings.availableFields).map(([field, label]) => (
                              <Grid item xs={12} sm={6} md={4} key={field}>
                                <FormControlLabel
                                  control={
                                    <Checkbox
                                      checked={selectedFields.includes(field)}
                                      onChange={(e) => handleFieldChange(field, e.target.checked)}
                                      name={field}
                                    />
                                  }
                                  label={label}
                                />
                              </Grid>
                            ))}
                          </Grid>
                        </FormGroup>
                      </FormControl>
                    )}
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                        Selected Fields Preview
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        These fields will be shown when scanning items:
                      </Typography>
                      
                      {selectedFields.length > 0 ? (
                        <Box component="ul" sx={{ pl: 2, m: 0 }}>
                          {selectedFields.map(field => (
                            <Typography component="li" variant="body2" key={field} sx={{ py: 0.5 }}>
                              {adminDisplaySettings?.availableFields[field] || field}
                            </Typography>
                          ))}
                        </Box>
                      ) : (
                        <Alert severity="warning" variant="outlined" size="small">
                          No fields selected
                        </Alert>
                      )}
                      
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                        Note: Essential fields (ID, Available Quantity) are always included.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 3 }} />
                
                <Button
                  variant="contained"
                  onClick={handleSaveAdminSettings}
                  disabled={adminLoading || selectedFields.length === 0}
                  startIcon={adminLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{
                    bgcolor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.dark' },
                    px: 3,
                    py: 1.5,
                  }}
                >
                  {adminLoading ? 'Saving...' : 'Save Display Settings'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
} 