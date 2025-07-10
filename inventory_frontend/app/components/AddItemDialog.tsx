'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { itemsAPI } from '@/services/api';

interface AddItemDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Department {
  name: string;
}

export default function AddItemDialog({ open, onClose, onSuccess }: AddItemDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    englishDescription: '',
    code: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
    equipment: '',
    category: 'C' as 'A' | 'B' | 'C',
    department: '',
    weeklyData: '',
  });
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load departments when dialog opens
  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    try {
      const response = await itemsAPI.getDepartments();
      const data = response.data || response;
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'quantity' || field === 'minQuantity' ? 
        (value === '' ? 0 : Math.max(0, parseInt(value) || 0)) : value
    }));
  };

  const handleSelectChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSave = async () => {
    // Basic validation
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await itemsAPI.create(formData);
      setSuccess('Item created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        englishDescription: '',
        code: '',
        quantity: 0,
        minQuantity: 0,
        location: '',
        equipment: '',
        category: 'C',
        department: '',
        weeklyData: '',
      });

      if (onSuccess) {
        onSuccess();
      }
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error creating item:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      englishDescription: '',
      code: '',
      quantity: 0,
      minQuantity: 0,
      location: '',
      equipment: '',
      category: 'C',
      department: '',
      weeklyData: '',
    });
    setError(null);
    setSuccess(null);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <AddIcon />
          Add New Item
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={2}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                disabled={loading}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Code"
                value={formData.code}
                onChange={handleInputChange('code')}
                disabled={loading}
                helperText="Optional unique identifier"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={handleInputChange('description')}
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="English Description"
                value={formData.englishDescription}
                onChange={handleInputChange('englishDescription')}
                disabled={loading}
                multiline
                rows={2}
              />
            </Grid>

            {/* Quantity Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Quantity Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange('quantity')}
                disabled={loading}
                inputProps={{ min: 0 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Minimum Quantity"
                type="number"
                value={formData.minQuantity}
                onChange={handleInputChange('minQuantity')}
                disabled={loading}
                inputProps={{ min: 0 }}
                helperText="Threshold for low stock alerts"
              />
            </Grid>

            {/* Location and Classification */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Location & Classification
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={handleInputChange('location')}
                required
                disabled={loading}
                helperText="Storage location or room"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Equipment"
                value={formData.equipment}
                onChange={handleInputChange('equipment')}
                disabled={loading}
                helperText="Associated equipment (optional)"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  label="Category"
                  onChange={handleSelectChange('category')}
                >
                  <MenuItem value="A">Category A (High Priority)</MenuItem>
                  <MenuItem value="B">Category B (Medium Priority)</MenuItem>
                  <MenuItem value="C">Category C (Low Priority)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  label="Department"
                  onChange={handleSelectChange('department')}
                >
                  <MenuItem value="">Public (All Departments)</MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.name} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Additional Data */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Weekly Data (JSON)"
                value={formData.weeklyData}
                onChange={handleInputChange('weeklyData')}
                disabled={loading}
                multiline
                rows={2}
                helperText="Optional JSON data for weekly tracking"
                placeholder='{"week1": 10, "week2": 15, ...}'
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
        >
          {loading ? 'Creating...' : 'Create Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 