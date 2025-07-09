'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface QuickActionsManagerProps {
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface QuickActionConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTION_CONFIGS: Record<string, QuickActionConfig> = {
  view_items: {
    id: 'view_items',
    title: 'View Items',
    description: 'Browse and manage inventory items',
    icon: 'Inventory',
    color: '#1976d2',
    bgColor: '#e3f2fd',
  },
  add_item: {
    id: 'add_item',
    title: 'Add Item',
    description: 'Add new items to inventory',
    icon: 'Add',
    color: '#2e7d32',
    bgColor: '#e8f5e8',
  },
  scanner: {
    id: 'scanner',
    title: 'Barcode Scanner',
    description: 'Scan items for usage tracking',
    icon: 'QrCodeScanner',
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
  },
  view_alerts: {
    id: 'view_alerts',
    title: 'View Alerts',
    description: 'Check inventory alerts and notifications',
    icon: 'Notifications',
    color: '#f57c00',
    bgColor: '#fff3e0',
  },
  quick_stats: {
    id: 'quick_stats',
    title: 'Quick Stats',
    description: 'Overview of inventory metrics',
    icon: 'TrendingUp',
    color: '#00695c',
    bgColor: '#e0f2f1',
  },
  usage_reports: {
    id: 'usage_reports',
    title: 'Usage Reports',
    description: 'View detailed usage analytics',
    icon: 'Assessment',
    color: '#c62828',
    bgColor: '#ffebee',
  },
  purchase_orders: {
    id: 'purchase_orders',
    title: 'Purchase Orders',
    description: 'Manage purchase orders',
    icon: 'ShoppingCart',
    color: '#ff6f00',
    bgColor: '#fff8e1',
  },
  manage_users: {
    id: 'manage_users',
    title: 'Manage Users',
    description: 'Add, edit, and manage users',
    icon: 'People',
    color: '#1565c0',
    bgColor: '#e1f5fe',
  },
  manage_departments: {
    id: 'manage_departments',
    title: 'Manage Departments',
    description: 'Create and manage departments',
    icon: 'Business',
    color: '#6a1b9a',
    bgColor: '#f3e5f5',
  },
  admin_settings: {
    id: 'admin_settings',
    title: 'Admin Settings',
    description: 'Configure system settings',
    icon: 'Settings',
    color: '#424242',
    bgColor: '#f5f5f5',
  },
  export_data: {
    id: 'export_data',
    title: 'Export Data',
    description: 'Export inventory data',
    icon: 'GetApp',
    color: '#558b2f',
    bgColor: '#f1f8e9',
  },
  bulk_operations: {
    id: 'bulk_operations',
    title: 'Bulk Operations',
    description: 'Perform bulk item operations',
    icon: 'PlaylistAddCheck',
    color: '#d32f2f',
    bgColor: '#ffebee',
  },
  purchase_order_stats: {
    id: 'purchase_order_stats',
    title: 'PO Stats',
    description: 'Purchase order statistics',
    icon: 'BarChart',
    color: '#ff8f00',
    bgColor: '#fff3e0',
  },
  system_logs: {
    id: 'system_logs',
    title: 'System Logs',
    description: 'View system activity logs',
    icon: 'History',
    color: '#5d4037',
    bgColor: '#efebe9',
  },
};

export default function QuickActionsManager({ open, onClose, onUpdate }: QuickActionsManagerProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userActions, setUserActions] = useState<string[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      fetchQuickActions();
    }
  }, [open]);

  const fetchQuickActions = async () => {
    setLoading(true);
    setError(null);
    try {
          const response = await fetch('/api/user/quick-actions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch quick actions');
      }
      
      const data = await response.json();
      setUserActions(data.actions || []);
      setAvailableActions(data.availableActions || []);
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      setError('Failed to load quick actions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAction = (actionId: string) => {
    if (userActions.includes(actionId)) {
      setUserActions(userActions.filter(id => id !== actionId));
    } else {
      setUserActions([...userActions, actionId]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/user/quick-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actions: userActions }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save quick actions');
      }
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error saving quick actions:', error);
      setError(error instanceof Error ? error.message : 'Failed to save quick actions');
    } finally {
      setSaving(false);
    }
  };

  const enabledActionsSet = new Set(userActions);
  const disabledActions = availableActions.filter(id => !enabledActionsSet.has(id));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon />
          Customize Quick Actions
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select the quick actions you want to see on your dashboard. Actions are filtered based on your role: {user?.role}
            </Typography>

            {/* Enabled Actions */}
            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              Enabled Actions ({userActions.length})
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {userActions.map(actionId => {
                const config = QUICK_ACTION_CONFIGS[actionId];
                if (!config) return null;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={actionId}>
                    <Chip
                      label={config.title}
                      onDelete={() => handleToggleAction(actionId)}
                      deleteIcon={<RemoveIcon />}
                      sx={{
                        width: '100%',
                        justifyContent: 'space-between',
                        backgroundColor: config.bgColor,
                        color: config.color,
                        '& .MuiChip-deleteIcon': {
                          color: config.color,
                        },
                      }}
                    />
                  </Grid>
                );
              })}
              {userActions.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" style={{ fontStyle: 'italic' }}>
                    No actions enabled. Add some from the available actions below.
                  </Typography>
                </Grid>
              )}
            </Grid>

            {/* Available Actions */}
            <Typography variant="h6" sx={{ mb: 2, color: 'text.secondary' }}>
              Available Actions ({disabledActions.length})
            </Typography>
            <Grid container spacing={2}>
              {disabledActions.map(actionId => {
                const config = QUICK_ACTION_CONFIGS[actionId];
                if (!config) return null;
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={actionId}>
                    <Chip
                      label={config.title}
                      onClick={() => handleToggleAction(actionId)}
                      icon={<AddIcon />}
                      variant="outlined"
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        borderColor: config.color,
                        color: config.color,
                        '&:hover': {
                          backgroundColor: config.bgColor,
                        },
                      }}
                    />
                  </Grid>
                );
              })}
              {disabledActions.length === 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" style={{ fontStyle: 'italic' }}>
                    All available actions are enabled.
                  </Typography>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading || saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 