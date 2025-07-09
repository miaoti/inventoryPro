'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Grid,
  Box,
  Paper,
  Container,
  Chip,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import QuickActionsManager from '@/components/QuickActionsManager';
import QuickActionCard from '@/components/QuickActionCard';

interface QuickActionConfig {
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const QUICK_ACTION_CONFIGS: Record<string, QuickActionConfig> = {
  view_items: {
    id: 'view_items',
    title: 'View Items',
    description: 'Browse and manage inventory items',
    color: '#1976d2',
    bgColor: '#e3f2fd',
  },
  add_item: {
    id: 'add_item',
    title: 'Add Item',
    description: 'Add new items to inventory',
    color: '#2e7d32',
    bgColor: '#e8f5e8',
  },
  scanner: {
    id: 'scanner',
    title: 'Barcode Scanner',
    description: 'Scan items for usage tracking',
    color: '#7b1fa2',
    bgColor: '#f3e5f5',
  },
  view_alerts: {
    id: 'view_alerts',
    title: 'View Alerts',
    description: 'Check inventory alerts and notifications',
    color: '#f57c00',
    bgColor: '#fff3e0',
  },
  quick_stats: {
    id: 'quick_stats',
    title: 'Quick Stats',
    description: 'Overview of inventory metrics',
    color: '#00695c',
    bgColor: '#e0f2f1',
  },
  usage_reports: {
    id: 'usage_reports',
    title: 'Usage Reports',
    description: 'View detailed usage analytics',
    color: '#c62828',
    bgColor: '#ffebee',
  },
  purchase_orders: {
    id: 'purchase_orders',
    title: 'Purchase Orders',
    description: 'Manage purchase orders',
    color: '#ff6f00',
    bgColor: '#fff8e1',
  },
  manage_users: {
    id: 'manage_users',
    title: 'Manage Users',
    description: 'Add, edit, and manage users',
    color: '#1565c0',
    bgColor: '#e1f5fe',
  },
  manage_departments: {
    id: 'manage_departments',
    title: 'Manage Departments',
    description: 'Create and manage departments',
    color: '#6a1b9a',
    bgColor: '#f3e5f5',
  },
  admin_settings: {
    id: 'admin_settings',
    title: 'Admin Settings',
    description: 'Configure system settings',
    color: '#424242',
    bgColor: '#f5f5f5',
  },
  export_data: {
    id: 'export_data',
    title: 'Export Data',
    description: 'Export inventory data',
    color: '#558b2f',
    bgColor: '#f1f8e9',
  },
  bulk_operations: {
    id: 'bulk_operations',
    title: 'Bulk Operations',
    description: 'Perform bulk item operations',
    color: '#d32f2f',
    bgColor: '#ffebee',
  },
  purchase_order_stats: {
    id: 'purchase_order_stats',
    title: 'PO Stats',
    description: 'Purchase order statistics',
    color: '#ff8f00',
    bgColor: '#fff3e0',
  },
  system_logs: {
    id: 'system_logs',
    title: 'System Logs',
    description: 'View system activity logs',
    color: '#5d4037',
    bgColor: '#efebe9',
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [quickActions, setQuickActions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [managerOpen, setManagerOpen] = useState(false);

  useEffect(() => {
    fetchQuickActions();
  }, []);

  const fetchQuickActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/user/quick-actions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quick actions');
      }
      
      const data = await response.json();
      setQuickActions(data.actions || []);
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      setError('Failed to load quick actions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 6 }}>
        <Paper 
          sx={{ 
            p: 4, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            mb: 4
          }}
        >
          <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
            Welcome, {user?.username}!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 3 }}>
            Manage your inventory efficiently with customizable quick actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip 
              label={`Role: ${user?.role}`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
            <Chip 
              label="Real-time Tracking" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
            <Chip 
              label="Smart Alerts" 
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
            {user?.department && (
              <Chip 
                label={`Department: ${user.department}`}
                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Quick Actions Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchQuickActions}
              disabled={loading}
              variant="outlined"
              size="small"
            >
              Refresh
            </Button>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setManagerOpen(true)}
              variant="contained"
              size="small"
            >
              Customize
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {quickActions.map((actionId) => {
              const config = QUICK_ACTION_CONFIGS[actionId];
              if (!config) return null;
              
              return (
                <Grid item xs={12} sm={6} lg={4} key={actionId}>
                  <QuickActionCard
                    actionId={config.id}
                    title={config.title}
                    description={config.description}
                    color={config.color}
                    bgColor={config.bgColor}
                  />
                </Grid>
              );
            })}
            {quickActions.length === 0 && (
              <Grid item xs={12}>
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Quick Actions Configured
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Click "Customize" to add quick actions to your dashboard.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<SettingsIcon />}
                    onClick={() => setManagerOpen(true)}
                  >
                    Add Quick Actions
                  </Button>
                </Paper>
              </Grid>
            )}
          </Grid>
        )}
      </Box>

      {/* Quick Actions Manager Dialog */}
      <QuickActionsManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        onUpdate={fetchQuickActions}
      />

      {/* Floating Action Button for Quick Settings */}
      <Fab
        color="primary"
        aria-label="customize quick actions"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => setManagerOpen(true)}
      >
        <SettingsIcon />
      </Fab>
    </Container>
  );
} 