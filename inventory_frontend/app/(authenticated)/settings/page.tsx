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
  Stack,
  InputAdornment,
  Tabs,
  Tab,
  Collapse,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Email as EmailIcon,
  Notifications as NotificationsIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  DisplaySettings as DisplayIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AdminPanelSettings as AdminIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
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

interface AlertThresholds {
  warningThreshold: number;
  criticalThreshold: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tabValue, setTabValue] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    notifications: true,
    adminDisplay: false,
    alertThresholds: false,
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    alertEmail: '',
    enableEmailAlerts: true,
    enableDailyDigest: false,
  });
  const [adminDisplaySettings, setAdminDisplaySettings] = useState<AdminDisplaySettings | null>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  
  // Alert threshold states
  const [alertThresholds, setAlertThresholds] = useState<AlertThresholds>({
    warningThreshold: 100,
    criticalThreshold: 50
  });
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  // Check user role for proper access control
  const isOwner = user?.role === 'OWNER';
  const isAdmin = user?.role === 'ADMIN';
  const isAdminOrOwner = isOwner || isAdmin;

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        alertEmail: user.email,
      }));
      
      loadUserSettings();
      
      // Load admin settings if user is admin or owner
      if (isAdminOrOwner) {
        loadAdminDisplaySettings();
        loadAlertThresholds();
      }
    }
  }, [user, isAdmin]);

  const loadUserSettings = async () => {
    try {
      const response = await userAPI.getSettings();
      const responseData = (response as any)?.data || response || {};
      setSettings({
        alertEmail: responseData.alertEmail || '',
        enableEmailAlerts: responseData.enableEmailAlerts || false,
        enableDailyDigest: responseData.enableDailyDigest || false,
      });
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError('Failed to load settings. Please try again.');
    }
  };

  const loadAdminDisplaySettings = async () => {
    try {
      const response = await adminAPI.getItemDisplaySettings();
      const responseData = (response as any)?.data || response || {};
      setAdminDisplaySettings(responseData);
      setSelectedFields(responseData.selectedFields || []);
    } catch (err) {
      console.error('Failed to load admin display settings:', err);
      setAdminError('Failed to load display settings.');
    }
  };

  const loadAlertThresholds = async () => {
    try {
      const response = await adminAPI.getAlertThresholds();
      const responseData = (response as any)?.data || response || {};
      setAlertThresholds({
        warningThreshold: responseData.warningThreshold || 100,
        criticalThreshold: responseData.criticalThreshold || 50,
      });
    } catch (err) {
      console.error('Failed to load alert thresholds:', err);
      setAdminError('Failed to load alert thresholds. Please try again.');
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

  const handleThresholdChange = (field: 'warningThreshold' | 'criticalThreshold', value: number) => {
    setAlertThresholds(prev => ({
      ...prev,
      [field]: Math.max(0, Math.min(200, value)) // Limit between 0-200%
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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

  const handleSaveAlertThresholds = async () => {
    try {
      setThresholdsLoading(true);
      setAdminError('');
      setAdminSuccess('');

      // Validation
      if (alertThresholds.criticalThreshold >= alertThresholds.warningThreshold) {
        setAdminError('Critical threshold must be lower than warning threshold');
        return;
      }

      await adminAPI.updateAlertThresholds(alertThresholds);
      setAdminSuccess('Alert thresholds saved successfully!');
      setTimeout(() => setAdminSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving alert thresholds:', error);
      setAdminError('Failed to save alert thresholds');
      setTimeout(() => setAdminError(''), 5000);
    } finally {
      setThresholdsLoading(false);
    }
  };

  if (!user) {
      return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
        <Alert severity="error">
          Please log in to access settings.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 } }}>
            <SettingsIcon />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant={{ xs: "h5", md: "h4" }} component="h1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Manage your account preferences and system configuration
            </Typography>
          </Box>
        </Box>
        
        {/* User Info Chip */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            icon={<PersonIcon />}
            label={`${user.fullName} (${user.username})`}
            variant="outlined"
            sx={{ fontWeight: 'medium' }}
          />
          <Chip 
            icon={isAdmin ? <AdminIcon /> : <SecurityIcon />}
            label={user.role}
            color={isAdmin ? 'error' : 'default'}
            variant={isAdmin ? 'filled' : 'outlined'}
          />
        </Box>
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

      {/* Main Content */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{ px: 3 }}
          >
            <Tab 
              icon={<NotificationsIcon />} 
              label="Notifications" 
              id="settings-tab-0"
              aria-controls="settings-tabpanel-0"
            />
            {isAdminOrOwner && (
              <Tab 
                icon={<AdminIcon />} 
                label="Admin Settings" 
                id="settings-tab-1"
                aria-controls="settings-tabpanel-1"
              />
            )}
          </Tabs>
        </Box>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8} lg={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                      <NotificationsIcon sx={{ mr: 1 }} />
                      Email Notifications
                    </Typography>
                    
                    <Stack spacing={3}>
                      <TextField
                        fullWidth
                        label="Alert Email Address"
                        value={settings.alertEmail}
                        onChange={handleInputChange('alertEmail')}
                        type="email"
                        helperText="Email address where inventory alerts will be sent"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      
                      <Box>
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
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                          Receive email notifications when inventory levels are low
                        </Typography>
                      </Box>
                      
                      <Box>
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
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mt: 0.5 }}>
                          Receive a daily summary of inventory activity
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Divider sx={{ my: 3 }} />
                    
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={loading || !settings.alertEmail}
                      startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                      size="large"
                      sx={{ minWidth: 140 }}
                    >
                      {loading ? 'Saving...' : 'Save Settings'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Admin Settings Tab - Only for Owner and Admin */}
        {isAdminOrOwner && (
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ px: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <AdminIcon sx={{ mr: 1 }} />
                Administrative Configuration
              </Typography>

              <Stack spacing={3}>
                {/* Alert Thresholds Section */}
                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleSection('alertThresholds')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <WarningIcon sx={{ mr: 1, color: 'warning.main' }} />
                        <Typography variant="h6">
                          Stock Alert Thresholds
                        </Typography>
                        <Chip 
                          label={`${alertThresholds.warningThreshold}% / ${alertThresholds.criticalThreshold}%`}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      <IconButton>
                        {expandedSections.alertThresholds ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    
                    <Collapse in={expandedSections.alertThresholds}>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Configure when warning and critical alerts should be triggered based on safety stock percentages
                        </Typography>

                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            <Stack spacing={2}>
                              {/* Warning Threshold */}
                              <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <WarningIcon fontSize="small" color="warning" />
                                  Warning Threshold
                                </Typography>
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={alertThresholds.warningThreshold}
                                  onChange={(e) => handleThresholdChange('warningThreshold', parseInt(e.target.value) || 0)}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">% of safety stock</InputAdornment>,
                                  }}
                                  helperText="Items below this percentage will show warning alerts"
                                  inputProps={{ min: 0, max: 200 }}
                                  size="small"
                                />
                              </Box>

                              {/* Critical Threshold */}
                              <Box>
                                <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ErrorIcon fontSize="small" color="error" />
                                  Critical Threshold
                                </Typography>
                                <TextField
                                  fullWidth
                                  type="number"
                                  value={alertThresholds.criticalThreshold}
                                  onChange={(e) => handleThresholdChange('criticalThreshold', parseInt(e.target.value) || 0)}
                                  InputProps={{
                                    endAdornment: <InputAdornment position="end">% of safety stock</InputAdornment>,
                                  }}
                                  helperText="Items below this percentage will show critical alerts"
                                  inputProps={{ min: 0, max: 200 }}
                                  error={alertThresholds.criticalThreshold >= alertThresholds.warningThreshold}
                                  size="small"
                                />
                              </Box>
                            </Stack>
                          </Grid>

                          <Grid item xs={12} md={6}>
                            {/* Examples */}
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', height: 'fit-content' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Examples:
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                • Item with 100 safety stock at {alertThresholds.warningThreshold}% = Warning when current ≤ {Math.round(100 * alertThresholds.warningThreshold / 100)}
                              </Typography>
                              <Typography variant="body2">
                                • Item with 100 safety stock at {alertThresholds.criticalThreshold}% = Critical when current ≤ {Math.round(100 * alertThresholds.criticalThreshold / 100)}
                              </Typography>
                            </Paper>
                          </Grid>
                        </Grid>

                        <Divider sx={{ my: 3 }} />

                        <Button
                          variant="contained"
                          onClick={handleSaveAlertThresholds}
                          disabled={thresholdsLoading || alertThresholds.criticalThreshold >= alertThresholds.warningThreshold}
                          startIcon={thresholdsLoading ? <CircularProgress size={20} /> : <SaveIcon />}
                          size="large"
                          sx={{ minWidth: 140 }}
                        >
                          {thresholdsLoading ? 'Saving...' : 'Save Thresholds'}
                        </Button>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>

                {/* Display Settings Section */}
                <Card variant="outlined">
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleSection('adminDisplay')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <DisplayIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6">
                          Item Display Configuration
                        </Typography>
                        <Chip 
                          label={`${selectedFields.length} fields selected`}
                          size="small"
                          color={selectedFields.length > 0 ? 'primary' : 'default'}
                          sx={{ ml: 2 }}
                        />
                      </Box>
                      <IconButton>
                        {expandedSections.adminDisplay ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Box>
                    
                    <Collapse in={expandedSections.adminDisplay}>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Select which item fields should be displayed in the Record Item Usage page when staff scan items.
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
                            <Paper sx={{ p: 2, bgcolor: 'grey.50', height: 'fit-content' }}>
                              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                                Selected Fields Preview
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
                                <Alert severity="warning" variant="outlined">
                                  No fields selected
                                </Alert>
                              )}
                              
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                                Note: Essential fields are always included.
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
                          size="large"
                          sx={{ minWidth: 140 }}
                        >
                          {adminLoading ? 'Saving...' : 'Save Display Settings'}
                        </Button>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Stack>
            </Box>
          </TabPanel>
        )}
      </Card>
    </Box>
  );
} 