'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  QrCodeScanner as ScannerIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as ReportsIcon,
  ShoppingCart as ShoppingCartIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  GetApp as GetAppIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  BarChart as BarChartIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface QuickActionCardProps {
  actionId: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const iconMap: Record<string, React.ReactNode> = {
  Inventory: <InventoryIcon sx={{ fontSize: 48 }} />,
  Add: <AddIcon sx={{ fontSize: 48 }} />,
  QrCodeScanner: <ScannerIcon sx={{ fontSize: 48 }} />,
  Notifications: <NotificationsIcon sx={{ fontSize: 48 }} />,
  TrendingUp: <TrendingUpIcon sx={{ fontSize: 48 }} />,
  Assessment: <ReportsIcon sx={{ fontSize: 48 }} />,
  ShoppingCart: <ShoppingCartIcon sx={{ fontSize: 48 }} />,
  People: <PeopleIcon sx={{ fontSize: 48 }} />,
  Business: <BusinessIcon sx={{ fontSize: 48 }} />,
  Settings: <SettingsIcon sx={{ fontSize: 48 }} />,
  GetApp: <GetAppIcon sx={{ fontSize: 48 }} />,
  PlaylistAddCheck: <PlaylistAddCheckIcon sx={{ fontSize: 48 }} />,
  BarChart: <BarChartIcon sx={{ fontSize: 48 }} />,
  History: <HistoryIcon sx={{ fontSize: 48 }} />,
};

export default function QuickActionCard({ actionId, title, description, color, bgColor }: QuickActionCardProps) {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIconForAction = (actionId: string): React.ReactNode => {
    const iconMappings: Record<string, string> = {
      view_items: 'Inventory',
      add_item: 'Add',
      scanner: 'QrCodeScanner',
      view_alerts: 'Notifications',
      quick_stats: 'TrendingUp',
      usage_reports: 'Assessment',
      purchase_orders: 'ShoppingCart',
      manage_users: 'People',
      manage_departments: 'Business',
      admin_settings: 'Settings',
      export_data: 'GetApp',
      bulk_operations: 'PlaylistAddCheck',
      purchase_order_stats: 'BarChart',
      system_logs: 'History',
    };
    
    const iconKey = iconMappings[actionId] || 'Settings';
    return iconMap[iconKey] || iconMap.Settings;
  };

  const handleActionClick = async () => {
    switch (actionId) {
      case 'view_items':
        router.push('/items');
        break;
      
      case 'add_item':
        router.push('/items');
        // Could add a query parameter to auto-open the add dialog
        break;
      
      case 'scanner':
        router.push('/scanner');
        break;
      
      case 'view_alerts':
        router.push('/alerts');
        break;
      
      case 'quick_stats':
        router.push('/quick-stats');
        break;
      
      case 'usage_reports':
        router.push('/usage-reports');
        break;
      
      case 'purchase_orders':
        router.push('/admin/purchase-orders');
        break;
      
      case 'manage_users':
        router.push('/admin/users');
        break;
      
      case 'manage_departments':
        setDialogOpen(true);
        break;
      
      case 'admin_settings':
        router.push('/admin-settings');
        break;
      
      case 'export_data':
        handleExportData();
        break;
      
      case 'bulk_operations':
        router.push('/items?bulk=true');
        break;
      
      case 'purchase_order_stats':
        router.push('/owner/logs');
        break;
      
      case 'system_logs':
        router.push('/owner/logs');
        break;
      
      default:
        console.log('Action not implemented:', actionId);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/items/export-barcodes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'inventory-export.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleCreateDepartment = async () => {
    if (!departmentName.trim()) {
      setError('Department name is required');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/items/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: departmentName.trim() }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create department');
      }
      
      setDepartmentName('');
      setDialogOpen(false);
      // Could add a success notification here
      router.push('/admin/users'); // Redirect to user management to see the new department
    } catch (error) {
      console.error('Error creating department:', error);
      setError(error instanceof Error ? error.message : 'Failed to create department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          height: '100%',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          borderRadius: 3,
          border: '1px solid',
          borderColor: 'transparent',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
            borderColor: color,
          },
        }}
        onClick={handleActionClick}
      >
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Box 
            sx={{ 
              mb: 3,
              p: 2,
              borderRadius: '50%',
              bgcolor: bgColor,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 80,
              height: 80,
            }}
          >
            <Box sx={{ color }}>
              {getIconForAction(actionId)}
            </Box>
          </Box>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ fontWeight: 'bold', color: 'text.primary' }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        </CardContent>
      </Card>

      {/* Department Creation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Department</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateDepartment();
              }
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateDepartment}
            variant="contained"
            disabled={loading || !departmentName.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Creating...' : 'Create Department'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
} 