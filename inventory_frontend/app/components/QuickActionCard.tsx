'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Box,
  Typography,
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
import BulkOperationsDialog from './BulkOperationsDialog';
import AddItemDialog from './AddItemDialog';
import DepartmentManagementDialog from './DepartmentManagementDialog';
import SystemLogsDialog from './SystemLogsDialog';

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
  
  // Dialog states
  const [bulkOperationsOpen, setBulkOperationsOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [departmentManagementOpen, setDepartmentManagementOpen] = useState(false);
  const [systemLogsOpen, setSystemLogsOpen] = useState(false);

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
        setAddItemOpen(true);
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
        setDepartmentManagementOpen(true);
        break;
      
      case 'admin_settings':
        router.push('/settings');
        break;
      
      case 'export_data':
        handleExportData();
        break;
      
      case 'bulk_operations':
        setBulkOperationsOpen(true);
        break;
      
      case 'purchase_order_stats':
        router.push('/owner/logs');
        break;
      
      case 'system_logs':
        // Only OWNER users can access system logs
        if (user?.role === 'OWNER') {
          setSystemLogsOpen(true);
        } else {
          console.warn('System logs access denied - OWNER role required');
        }
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

  const handleSuccess = () => {
    // Optional: Refresh data or show success message
    console.log('Action completed successfully');
  };

  return (
    <>
      <Card 
        onClick={handleActionClick}
        sx={{
          cursor: 'pointer',
          height: '100%',
          backgroundColor: bgColor,
          '&:hover': {
            backgroundColor: `${bgColor}dd`,
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
          transition: 'all 0.3s ease',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ color: color, mb: 2 }}>
            {getIconForAction(actionId)}
          </Box>
          <Typography variant="h6" component="h2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <BulkOperationsDialog
        open={bulkOperationsOpen}
        onClose={() => setBulkOperationsOpen(false)}
        onSuccess={handleSuccess}
      />
      
      <AddItemDialog
        open={addItemOpen}
        onClose={() => setAddItemOpen(false)}
        onSuccess={handleSuccess}
      />
      
      <DepartmentManagementDialog
        open={departmentManagementOpen}
        onClose={() => setDepartmentManagementOpen(false)}
        onSuccess={handleSuccess}
      />
      
      <SystemLogsDialog
        open={systemLogsOpen}
        onClose={() => setSystemLogsOpen(false)}
      />
    </>
  );
} 