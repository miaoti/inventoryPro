'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  InputAdornment,
  Paper,
  Stack,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Percent as PercentIcon,
} from '@mui/icons-material';
import { adminAPI, userAPI } from '../../services/api';

export default function AdminSettingsPage() {
  const [scanFields, setScanFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  // Alert threshold states
  const [alertThresholds, setAlertThresholds] = useState({
    warningThreshold: 120,
    criticalThreshold: 50
  });
  const [thresholdsLoading, setThresholdsLoading] = useState(false);
  const [thresholdsSaving, setThresholdsSaving] = useState(false);

  // Input states for better number input handling
  const [warningThresholdInput, setWarningThresholdInput] = useState('120');
  const [criticalThresholdInput, setCriticalThresholdInput] = useState('50');

  useEffect(() => {
    fetchSettings();
    fetchAlertThresholds();
  }, []);

  const availableFields = [
    { id: 'name', label: 'Item Name' },
    { id: 'code', label: 'Item Code' },
    { id: 'description', label: 'Description' },
    { id: 'englishDescription', label: 'English Description' },
    { id: 'location', label: 'Location' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'quantity', label: 'Current Quantity' },
    { id: 'minQuantity', label: 'Minimum Quantity' },
    { id: 'pendingPO', label: 'Pending PO' },
    { id: 'category', label: 'Category' },
    { id: 'barcode', label: 'Barcode' },
  ];

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getItemDisplaySettings();
      const responseData = (response as any)?.data || response || [];
      setScanFields(Array.isArray(responseData) ? responseData : []);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load display settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlertThresholds = async () => {
    try {
      setThresholdsLoading(true);
      const response = await userAPI.getSettings();
      const responseData = (response as any)?.data || response || {};
      const thresholds = {
        warningThreshold: responseData.warningThreshold || 100,
        criticalThreshold: responseData.criticalThreshold || 50,
      };
      setAlertThresholds(thresholds);
      setWarningThresholdInput(thresholds.warningThreshold.toString());
      setCriticalThresholdInput(thresholds.criticalThreshold.toString());
    } catch (err) {
      console.error('Failed to load your alert thresholds:', err);
      setError('Failed to load your alert thresholds. Please try again.');
    } finally {
      setThresholdsLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, checked: boolean) => {
    if (checked) {
      setScanFields([...scanFields, fieldId]);
    } else {
      setScanFields(scanFields.filter(f => f !== fieldId));
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');
      
      await adminAPI.updateItemDisplaySettings(scanFields);
      setMessage('Scanner display settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Helper function for better number input handling
  const handleNumberInputChange = (value: string, setter: (val: number) => void, inputSetter: (val: string) => void, min: number = 0, max: number = 200) => {
    // Allow empty string or partial numbers during typing
    inputSetter(value);
    
    // Only parse and validate if it's a complete number
    if (value === '') {
      setter(min);
    } else {
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        const finalValue = Math.max(min, Math.min(max, parsed));
        setter(finalValue);
      }
    }
  };

  const handleThresholdChange = (field: 'warningThreshold' | 'criticalThreshold', value: string) => {
    if (field === 'warningThreshold') {
      handleNumberInputChange(value, 
        (val) => setAlertThresholds(prev => ({ ...prev, warningThreshold: val })), 
        setWarningThresholdInput, 
        0, 
        200
      );
    } else {
      handleNumberInputChange(value, 
        (val) => setAlertThresholds(prev => ({ ...prev, criticalThreshold: val })), 
        setCriticalThresholdInput, 
        0, 
        200
      );
    }
  };

  const handleSaveThresholds = async () => {
    try {
      setThresholdsSaving(true);
      setMessage('');
      setError('');

      // Validation
      if (alertThresholds.criticalThreshold >= alertThresholds.warningThreshold) {
        setError('Critical threshold must be lower than warning threshold');
        return;
      }

      await userAPI.updateSettings({
        warningThreshold: alertThresholds.warningThreshold,
        criticalThreshold: alertThresholds.criticalThreshold
      });
      setMessage('Your alert thresholds saved successfully');
    } catch (error) {
      console.error('Error saving your alert thresholds:', error);
      setError('Failed to save your alert thresholds');
    } finally {
      setThresholdsSaving(false);
    }
  };

  if (loading && thresholdsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <SettingsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Admin Settings
      </Typography>

      {message && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Scanner Display Fields Settings */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Scanner Display Fields
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select which fields should be displayed when scanning items
              </Typography>

              <FormControl component="fieldset">
                <FormGroup>
                  {availableFields.map((field) => (
                    <FormControlLabel
                      key={field.id}
                      control={
                        <Checkbox
                          checked={scanFields.includes(field.id)}
                          onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                        />
                      }
                      label={field.label}
                    />
                  ))}
                </FormGroup>
              </FormControl>

              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSaveSettings}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Display Settings'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Alert Threshold Settings */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Stock Alert Thresholds
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure your personal alert thresholds for when warning and critical alerts should be triggered based on safety stock percentages
              </Typography>

              <Stack spacing={3}>
                {/* Warning Threshold */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" color="warning" />
                    Warning Threshold
                  </Typography>
                  <TextField
                    fullWidth
                    type="number"
                    value={warningThresholdInput}
                    onChange={(e) => handleThresholdChange('warningThreshold', e.target.value)}
                    onBlur={(e) => {
                      // Ensure valid value on blur
                      const val = parseInt(e.target.value) || 0;
                      const finalValue = Math.max(0, Math.min(200, val));
                      setAlertThresholds(prev => ({ ...prev, warningThreshold: finalValue }));
                      setWarningThresholdInput(finalValue.toString());
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">% of safety stock</InputAdornment>,
                    }}
                    helperText="Items below this percentage of safety stock will show warning alerts"
                    inputProps={{ min: 0, max: 200 }}
                    placeholder="Enter warning threshold"
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
                    value={criticalThresholdInput}
                    onChange={(e) => handleThresholdChange('criticalThreshold', e.target.value)}
                    onBlur={(e) => {
                      // Ensure valid value on blur
                      const val = parseInt(e.target.value) || 0;
                      const finalValue = Math.max(0, Math.min(200, val));
                      setAlertThresholds(prev => ({ ...prev, criticalThreshold: finalValue }));
                      setCriticalThresholdInput(finalValue.toString());
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">% of safety stock</InputAdornment>,
                    }}
                    helperText="Items below this percentage will show critical alerts"
                    inputProps={{ min: 0, max: 200 }}
                    error={alertThresholds.criticalThreshold >= alertThresholds.warningThreshold}
                    placeholder="Enter critical threshold"
                  />
                </Box>

                {/* Threshold Examples */}
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
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

                <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Button
                    variant="contained"
                    startIcon={thresholdsSaving ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSaveThresholds}
                    disabled={thresholdsSaving || alertThresholds.criticalThreshold >= alertThresholds.warningThreshold}
                    color="primary"
                    fullWidth
                  >
                    {thresholdsSaving ? 'Saving...' : 'Save Alert Thresholds'}
                  </Button>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Settings Summary */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Settings Summary
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Scanner Display Fields ({scanFields.length} selected):
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {scanFields.map(fieldId => {
                      const field = availableFields.find(f => f.id === fieldId);
                      return field ? (
                        <Typography key={fieldId} variant="body2" component="span" sx={{ 
                          px: 1, 
                          py: 0.5, 
                          bgcolor: 'primary.light', 
                          color: 'primary.contrastText',
                          borderRadius: 1,
                          fontSize: '0.75rem'
                        }}>
                          {field.label}
                        </Typography>
                      ) : null;
                    })}
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alert Thresholds:
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WarningIcon fontSize="small" color="warning" />
                      <Typography variant="body2">
                        Warning: {alertThresholds.warningThreshold}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon fontSize="small" color="error" />
                      <Typography variant="body2">
                        Critical: {alertThresholds.criticalThreshold}%
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 