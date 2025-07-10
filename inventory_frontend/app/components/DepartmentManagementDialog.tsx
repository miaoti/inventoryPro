'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
  Fab,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { itemsAPI } from '@/services/api';

interface DepartmentManagementDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Department {
  name: string;
  itemCount?: number;
}

export default function DepartmentManagementDialog({ open, onClose, onSuccess }: DepartmentManagementDialogProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Create department state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  
  // Edit department state
  const [editingDepartment, setEditingDepartment] = useState<string | null>(null);
  const [editDepartmentName, setEditDepartmentName] = useState('');

  useEffect(() => {
    if (open) {
      fetchDepartments();
    }
  }, [open]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await itemsAPI.getDepartments();
      const data = response.data || response;
      setDepartments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setError('Department name is required');
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      await itemsAPI.createDepartment(newDepartmentName.trim());
      setSuccess(`Department "${newDepartmentName}" created successfully!`);
      setNewDepartmentName('');
      setShowCreateForm(false);
      await fetchDepartments();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error creating department:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create department');
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (department: Department) => {
    setEditingDepartment(department.name);
    setEditDepartmentName(department.name);
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingDepartment(null);
    setEditDepartmentName('');
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!editDepartmentName.trim()) {
      setError('Department name is required');
      return;
    }

    if (editDepartmentName === editingDepartment) {
      setEditingDepartment(null);
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      // Note: This would require a backend endpoint for updating department names
      // For now, we'll show that editing is not supported
      setError('Department editing is not currently supported. Please create a new department and migrate items if needed.');
    } catch (err: any) {
      console.error('Error updating department:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update department');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteDepartment = async (departmentName: string) => {
    if (!confirm(`Are you sure you want to delete the department "${departmentName}"? This action cannot be undone.`)) {
      return;
    }

    setCreating(true);
    setError(null);
    
    try {
      await itemsAPI.deleteDepartment(departmentName);
      setSuccess(`Department "${departmentName}" deleted successfully!`);
      await fetchDepartments();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Error deleting department:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete department');
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setShowCreateForm(false);
    setNewDepartmentName('');
    setEditingDepartment(null);
    setEditDepartmentName('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <BusinessIcon />
          Department Management
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

          {/* Create Department Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Create New Department
                </Typography>
                {!showCreateForm && (
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => setShowCreateForm(true)}
                    disabled={loading || creating}
                  >
                    Add Department
                  </Button>
                )}
              </Box>

              {showCreateForm && (
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      label="Department Name"
                      value={newDepartmentName}
                      onChange={(e) => setNewDepartmentName(e.target.value)}
                      disabled={creating}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateDepartment();
                        }
                      }}
                      placeholder="Enter department name"
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box display="flex" gap={1}>
                      <Button
                        startIcon={creating ? <CircularProgress size={20} /> : <SaveIcon />}
                        variant="contained"
                        onClick={handleCreateDepartment}
                        disabled={creating || !newDepartmentName.trim()}
                        size="small"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        variant="outlined"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewDepartmentName('');
                          setError(null);
                        }}
                        disabled={creating}
                        size="small"
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Existing Departments Section */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Existing Departments
              </Typography>

              {loading ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : departments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No departments found. Create your first department above.
                </Typography>
              ) : (
                <List>
                  {departments.map((department, index) => (
                    <React.Fragment key={department.name}>
                      <ListItem>
                        {editingDepartment === department.name ? (
                          <Box display="flex" alignItems="center" gap={2} width="100%">
                            <TextField
                              fullWidth
                              value={editDepartmentName}
                              onChange={(e) => setEditDepartmentName(e.target.value)}
                              disabled={creating}
                              size="small"
                            />
                            <Box display="flex" gap={1}>
                              <IconButton
                                onClick={handleSaveEdit}
                                disabled={creating}
                                color="primary"
                                size="small"
                              >
                                <SaveIcon />
                              </IconButton>
                              <IconButton
                                onClick={handleCancelEdit}
                                disabled={creating}
                                size="small"
                              >
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ) : (
                          <>
                            <ListItemText
                              primary={department.name}
                              secondary={
                                department.itemCount !== undefined 
                                  ? `${department.itemCount} items` 
                                  : 'Department'
                              }
                            />
                            <ListItemSecondaryAction>
                              <Box display="flex" gap={1}>
                                <IconButton
                                  edge="end"
                                  onClick={() => handleStartEdit(department)}
                                  disabled={creating}
                                  size="small"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  edge="end"
                                  onClick={() => handleDeleteDepartment(department.name)}
                                  disabled={creating}
                                  color="error"
                                  size="small"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </ListItemSecondaryAction>
                          </>
                        )}
                      </ListItem>
                      {index < departments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>

          {/* Information Card */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Department Management Tips:
            </Typography>
            <Typography variant="body2" component="div">
              • Departments help organize items by organizational units
              <br />
              • Items without a department are considered "Public" and visible to all users
              <br />
              • Deleting a department will make its items public
              <br />
              • Users can only see items from their assigned department (plus public items)
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 