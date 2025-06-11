'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { setAlerts, resolveAlert as resolveAlertAction, markAlertAsRead as markAlertAsReadAction, updateAlertCounts } from '../../store/slices/alertsSlice';
import type { RootState } from '../../store';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert as MuiAlert,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Fab,
  Fade,
  Divider,
  LinearProgress,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as ResolveIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Timeline as TrendIcon,
  Inventory as InventoryIcon,
  Email as EmailIcon,
  GetApp as ExportIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { alertsAPI } from '../../services/api';

interface Alert {
  id: number;
  item: {
    id: number;
    name: string;
    code: string;
    barcode: string;
    location?: string;
  };
  alertType: string;
  message: string;
  currentInventory: number;
  pendingPO: number;
  usedInventory: number;
  safetyStockThreshold: number;
  resolved: boolean;
  read: boolean;
  ignored: boolean;
  createdAt: string;
  resolvedAt?: string;
  readAt?: string;
  ignoredAt?: string;
  // Computed fields
  itemName?: string;
  itemCode?: string;
  itemId?: number;
  formattedCreatedAt?: string;
  formattedIgnoredAt?: string;
  formattedResolvedAt?: string;
  currentStockLevel: number;
  urgencyLevel: 'critical' | 'warning';
  daysOld: number;
}

type AlertFilter = 'all' | 'critical' | 'warning';
type SortField = 'createdAt' | 'urgencyLevel' | 'itemName' | 'currentInventory';

export default function AlertsPage() {
  const router = useRouter();
  
  // API URL configuration
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  // Redux state
  const dispatch = useDispatch();
  const { alerts: reduxAlerts, unreadAlerts, activeAlerts } = useSelector((state: RootState) => state.alerts);
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);

  // Local state
  const [localAlerts, setLocalAlerts] = useState<Alert[]>([]);
  const [ignoredAlerts, setIgnoredAlerts] = useState<Alert[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState<AlertFilter>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Process active alerts with computed fields
  const processedAlertsComputed = useMemo(() => {
    console.log('🔍 DEBUG: Processing alerts:', { 
      localAlertsCount: localAlerts.length, 
      reduxAlertsCount: reduxAlerts.length 
    });
    
    // Use local alerts state instead of Redux for more up-to-date data
    const alertsToProcess = localAlerts.length > 0 ? localAlerts : reduxAlerts;
    
    if (!alertsToProcess || !Array.isArray(alertsToProcess)) {
      console.log('🔍 DEBUG: No alerts to process or not an array');
      return [];
    }
    
    const processed = alertsToProcess.map((alert: any) => {
      const currentStockLevel = alert.currentInventory;
      const createdDate = new Date(alert.createdAt);
      const currentDate = new Date();
      const timeDiff = currentDate.getTime() - createdDate.getTime();
      const daysOld = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
      
      // Determine urgency level based on alert type from backend
      let urgencyLevel: 'critical' | 'warning' = 'warning';
      if (alert.alertType === 'CRITICAL_STOCK') {
        urgencyLevel = 'critical';
      } else if (alert.alertType === 'WARNING_STOCK') {
        urgencyLevel = 'warning';
      }

      return {
        ...alert,
        itemName: alert.item?.name || 'N/A',
        itemCode: alert.item?.code || 'N/A',
        itemId: alert.item?.id || null,
        formattedCreatedAt: new Date(alert.createdAt).toLocaleString(),
        currentStockLevel,
        urgencyLevel,
        daysOld,
      };
    });
    
    console.log('🔍 DEBUG: Processed alerts:', processed.length);
    return processed;
  }, [localAlerts, reduxAlerts]);

  const filteredAlerts = useMemo(() => {
    let filtered = processedAlertsComputed;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.itemName?.toLowerCase().includes(term) ||
        alert.itemCode?.toLowerCase().includes(term) ||
        alert.message.toLowerCase().includes(term)
      );
    }

    // Urgency filter
    if (alertFilter !== 'all') {
      filtered = filtered.filter(alert => alert.urgencyLevel === alertFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortField) {
        case 'urgencyLevel':
          const urgencyOrder: { [key: string]: number } = { critical: 0, warning: 1 };
          return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
        case 'itemName':
          return (a.itemName || '').localeCompare(b.itemName || '');
        case 'currentInventory':
          return a.currentInventory - b.currentInventory;
        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [processedAlertsComputed, searchTerm, alertFilter, sortField]);

  const filteredAlertsComputed = useMemo(() => filteredAlerts.filter(alert => !alert.resolved), [filteredAlerts]);
  
  // Process ignored alerts similar to active alerts
  const processedIgnoredAlerts = useMemo(() => {
    if (!ignoredAlerts || !Array.isArray(ignoredAlerts)) {
      return [];
    }
    return ignoredAlerts.map((alert: any) => {
      const currentStockLevel = alert.currentInventory;
      const createdDate = new Date(alert.createdAt);
      const currentDate = new Date();
      const timeDiff = currentDate.getTime() - createdDate.getTime();
      const daysOld = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
      
      // Determine urgency level based on alert type from backend
      let urgencyLevel: 'critical' | 'warning' = 'warning';
      if (alert.alertType === 'CRITICAL_STOCK') {
        urgencyLevel = 'critical';
      } else if (alert.alertType === 'WARNING_STOCK') {
        urgencyLevel = 'warning';
      }

      return {
        ...alert,
        itemName: alert.item?.name || 'N/A',
        itemCode: alert.item?.code || 'N/A',
        itemId: alert.item?.id || null,
        formattedCreatedAt: new Date(alert.createdAt).toLocaleString(),
        formattedIgnoredAt: alert.ignoredAt ? new Date(alert.ignoredAt).toLocaleString() : null,
        currentStockLevel,
        urgencyLevel,
        daysOld,
      };
    });
  }, [ignoredAlerts]);

  // Process resolved alerts similar to active alerts
  const processedResolvedAlerts = useMemo(() => {
    if (!resolvedAlerts || !Array.isArray(resolvedAlerts)) {
      return [];
    }
    return resolvedAlerts.map((alert: any) => {
      const currentStockLevel = alert.currentInventory;
      const createdDate = new Date(alert.createdAt);
      const currentDate = new Date();
      const timeDiff = currentDate.getTime() - createdDate.getTime();
      const daysOld = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
      
      // Determine urgency level based on alert type from backend
      let urgencyLevel: 'critical' | 'warning' = 'warning';
      if (alert.alertType === 'CRITICAL_STOCK') {
        urgencyLevel = 'critical';
      } else if (alert.alertType === 'WARNING_STOCK') {
        urgencyLevel = 'warning';
      }

      return {
        ...alert,
        itemName: alert.item?.name || 'N/A',
        itemCode: alert.item?.code || 'N/A',
        itemId: alert.item?.id || null,
        formattedCreatedAt: new Date(alert.createdAt).toLocaleString(),
        formattedResolvedAt: alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : null,
        currentStockLevel,
        urgencyLevel,
        daysOld,
      };
    });
  }, [resolvedAlerts]);

  const resolvedAlertsComputed = useMemo(() => processedResolvedAlerts, [processedResolvedAlerts]);

  // Statistics
  const alertStats = useMemo(() => {
    const critical = filteredAlertsComputed.filter(a => a.urgencyLevel === 'critical').length;
    const warning = filteredAlertsComputed.filter(a => a.urgencyLevel === 'warning').length;
    const avgDaysOld = filteredAlertsComputed.length > 0 
      ? Math.round(filteredAlertsComputed.reduce((sum, a) => sum + a.daysOld, 0) / filteredAlertsComputed.length)
      : 0;
    
    return {
      total: filteredAlertsComputed.length,
      critical,
      warning,
      avgDaysOld,
      resolved: resolvedAlertsComputed.length,
      ignored: processedIgnoredAlerts.length,
    };
  }, [filteredAlertsComputed, resolvedAlertsComputed, processedIgnoredAlerts]);

  // Fetch alerts with optimized loading states
  const fetchAlerts = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('🔍 DEBUG: Fetching alerts...');

      // Fetch active, ignored, and resolved alerts
      const [activeAlertsResponse, ignoredAlertsResponse, resolvedAlertsResponse] = await Promise.all([
        alertsAPI.getActive(),
        alertsAPI.getIgnored(),
        alertsAPI.getResolved()
      ]);
      
      console.log('🔍 DEBUG: Raw API responses:', {
        activeAlertsResponse,
        ignoredAlertsResponse,
        resolvedAlertsResponse
      });
      
      // Extract data from response objects properly
      const activeAlertsData = activeAlertsResponse?.data || activeAlertsResponse || [];
      const ignoredAlertsData = ignoredAlertsResponse?.data || ignoredAlertsResponse || [];
      const resolvedAlertsData = resolvedAlertsResponse?.data || resolvedAlertsResponse || [];
      
      console.log('🔍 DEBUG: Extracted alert data:', {
        activeAlerts: activeAlertsData,
        ignoredAlerts: ignoredAlertsData,
        resolvedAlerts: resolvedAlertsData
      });
      
      // Ensure we have valid array data with fallbacks
      const validActiveAlerts = Array.isArray(activeAlertsData) ? activeAlertsData : [];
      const validIgnoredAlerts = Array.isArray(ignoredAlertsData) ? ignoredAlertsData : [];
      const validResolvedAlerts = Array.isArray(resolvedAlertsData) ? resolvedAlertsData : [];
      
      console.log('🔍 DEBUG: Valid alerts count:', {
        active: validActiveAlerts.length,
        ignored: validIgnoredAlerts.length,
        resolved: validResolvedAlerts.length
      });
      
      setLocalAlerts(validActiveAlerts);
      setIgnoredAlerts(validIgnoredAlerts);
      setResolvedAlerts(validResolvedAlerts);
      dispatch(setAlerts(validActiveAlerts)); // Redux still uses active alerts
      
      // Also update the unread count from the Redux store
      const unreadCount = validActiveAlerts.filter(alert => !alert.read && !alert.resolved).length;
      console.log('🔍 DEBUG: Calculated unread count:', unreadCount);
      
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Set empty arrays on error to prevent undefined access
      setLocalAlerts([]);
      setIgnoredAlerts([]);
      setResolvedAlerts([]);
      dispatch(setAlerts([]));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dispatch]);

  // Authentication guard and auto-refresh alerts
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    const checkAuth = () => {
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
      const hasToken = !!(token || cookieToken);
      
      if (!isAuthenticated || !hasToken) {
        router.push('/login');
        return;
      }
      
      // Initial fetch
      fetchAlerts();
      
      // Set up auto-refresh if enabled
      if (autoRefresh) {
        intervalId = setInterval(() => {
          console.log('🔄 Auto-refreshing alerts...');
          fetchAlerts(true);
        }, 30000); // Refresh every 30 seconds
      }
    };

    checkAuth();
    
    // Cleanup interval on unmount or dependency change
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [fetchAlerts, autoRefresh, isAuthenticated, token, router]);

  // Also refresh when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && (token || document.cookie.includes('token='))) {
        console.log('📄 Page became visible, refreshing alerts...');
        fetchAlerts(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAlerts, isAuthenticated, token]);

  // Optimized resolve alert with optimistic updates
  const resolveAlert = useCallback(async (alertId: number) => {
    try {
      // Call API first to ensure backend is updated
      await alertsAPI.resolve(alertId);
      
      // Then update local state and Redux
      dispatch(resolveAlertAction(alertId));
      setLocalAlerts(prev => prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, resolved: true, resolvedAt: new Date().toISOString() }
          : alert
      ));
      
      setDialogOpen(false);
      
      // Immediately refresh alert counts to update sidebar badge
      try {
        const countsResponse = await alertsAPI.getCounts();
        const countsData = countsResponse.data || countsResponse; // Handle both cases
        dispatch(updateAlertCounts({
          unreadAlerts: countsData.unreadAlerts || 0,
          activeAlerts: countsData.activeAlerts || 0
        }));
      } catch (countError) {
        console.error('Error fetching updated alert counts:', countError);
      }
      
      // Fetch fresh data to ensure consistency
      setTimeout(() => {
        fetchAlerts(true);
      }, 500);
      
    } catch (error) {
      console.error('Error resolving alert:', error);
      // Fetch fresh data on error to ensure consistency
      fetchAlerts(true);
    }
  }, [dispatch, fetchAlerts]);

  // Mark alert as read
  const markAsRead = useCallback(async (alertId: number) => {
    try {
      const alert = localAlerts.find(a => a.id === alertId);
      if (alert && !alert.read && !alert.resolved) {
        await alertsAPI.markAsRead(alertId);
        dispatch(markAlertAsReadAction(alertId));
        setLocalAlerts(prev => prev.map(a => 
          a.id === alertId 
            ? { ...a, read: true, readAt: new Date().toISOString() }
            : a
        ));
        
        // Immediately refresh alert counts to update sidebar badge
        try {
          const countsResponse = await alertsAPI.getCounts();
          const countsData = countsResponse.data || countsResponse; // Handle both cases
          dispatch(updateAlertCounts({
            unreadAlerts: countsData.unreadAlerts || 0,
            activeAlerts: countsData.activeAlerts || 0
          }));
        } catch (countError) {
          console.error('Error fetching updated alert counts:', countError);
        }
      }
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }, [localAlerts, dispatch]);

  const openAlertDialog = useCallback((alert: Alert) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
    
    // Mark alert as read when opened
    if (!alert.read && !alert.resolved) {
      markAsRead(alert.id);
    }
  }, [markAsRead]);

  const handleExportToExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/alerts/export/excel`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export alerts');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alerts_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting alerts:', error);
      // You might want to show a toast or alert here
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'error';
      case 'warning': return 'warning';
      default: return 'warning'; // default to warning for safety
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '⚠️'; // default to warning for safety
    }
  };

  // Enhanced DataGrid columns with better formatting
  const columns: GridColDef[] = [
    {
      field: 'urgencyLevel',
      headerName: 'Priority',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={`${params.value} priority`}>
          <Chip
            icon={<span>{getUrgencyIcon(params.value)}</span>}
            label={params.value}
            color={getUrgencyColor(params.value) as any}
            size="small"
            variant="filled"
          />
        </Tooltip>
      ),
    },
    {
      field: 'itemName',
      headerName: 'Item',
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Read/Unread status icon */}
          {!params.row.read && (
            <Box
              sx={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                flexShrink: 0
              }}
            />
          )}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: params.row.read ? 'normal' : 'medium' }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {params.row.itemCode}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: 'currentInventory',
      headerName: 'Stock Level',
      width: 140,
      renderCell: (params) => {
        const currentStock = params.value;
        const safetyStock = params.row.safetyStockThreshold;
        const isLow = currentStock < safetyStock;
        const percentage = (currentStock / safetyStock) * 100;
        
        return (
          <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color={isLow ? 'error' : 'inherit'}>
                {currentStock}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                /{safetyStock}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(percentage, 100)}
              color={isLow ? 'error' : 'success'}
              sx={{ height: 4, borderRadius: 2 }}
            />
          </Box>
        );
      },
    },
    {
      field: 'daysOld',
      headerName: 'Age',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={`${params.value}d`}
          size="small"
          color={params.value > 7 ? 'error' : params.value > 3 ? 'warning' : 'default'}
        />
      ),
    },
    {
      field: 'formattedCreatedAt',
      headerName: 'Created',
      width: 160,
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Read/Unread indicator */}
          <Tooltip title={params.row.read ? 'Read' : 'Unread'}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: params.row.read ? 'grey.400' : 'primary.main',
                mr: 1
              }}
            />
          </Tooltip>
          
          <Tooltip title="View Details">
            <IconButton onClick={() => openAlertDialog(params.row as Alert)} size="small">
              <InfoIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {!params.row.resolved && (
            <Tooltip title="Mark as Resolved">
              <IconButton 
                onClick={() => resolveAlert(params.row.id)} 
                size="small"
                color="success"
              >
                <ResolveIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  // Authentication guard UI
  if (!isAuthenticated || (!token && !document.cookie.includes('token='))) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You must be logged in to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to login...
          </Typography>
        </Paper>
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
      {/* Header with actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          📊 Alert Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={() => fetchAlerts(true)}
            disabled={refreshing}
            size="small"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportToExcel}
            color="info"
            size="small"
          >
            Export Excel
          </Button>
          <FormControl sx={{ minWidth: 140 }}>
            <Select
              value={autoRefresh ? 'on' : 'off'}
              onChange={(e) => setAutoRefresh(e.target.value === 'on')}
              size="small"
              displayEmpty
            >
              <MenuItem value="on">Auto-refresh: ON</MenuItem>
              <MenuItem value="off">Auto-refresh: OFF</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Alert Statistics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
        <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {processedAlertsComputed.filter(alert => !alert.read && !alert.resolved).length}
                </Typography>
                <Typography variant="body2">Unread Alerts</Typography>
                {processedAlertsComputed.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {Math.round((processedAlertsComputed.filter(alert => !alert.read && !alert.resolved).length / processedAlertsComputed.length) * 100)}% of active
                  </Typography>
                )}
              </Box>
              <Box sx={{ fontSize: 40 }}>
                {processedAlertsComputed.filter(alert => !alert.read && !alert.resolved).length > 0 ? '🔔' : '✅'}
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'error.light', color: 'error.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {alertStats.critical}
                </Typography>
                <Typography variant="body2">Critical Alerts</Typography>
              </Box>
              <Box sx={{ fontSize: 40 }}>🚨</Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {alertStats.warning}
                </Typography>
                <Typography variant="body2">Warning Alerts</Typography>
              </Box>
              <Box sx={{ fontSize: 40 }}>⚠️</Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {alertStats.resolved}
                </Typography>
                <Typography variant="body2">Resolved</Typography>
              </Box>
              <Box sx={{ fontSize: 40 }}>✅</Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ bgcolor: 'grey.light', color: 'grey.contrastText' }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {alertStats.ignored}
                </Typography>
                <Typography variant="body2">Ignored</Typography>
              </Box>
              <Box sx={{ fontSize: 40 }}>🔕</Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Advanced Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200 }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={alertFilter}
              label="Priority"
              onChange={(e) => setAlertFilter(e.target.value as AlertFilter)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="warning">Warning</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortField}
              label="Sort By"
              onChange={(e) => setSortField(e.target.value as SortField)}
            >
              <MenuItem value="createdAt">Date Created</MenuItem>
              <MenuItem value="urgencyLevel">Priority</MenuItem>
              <MenuItem value="itemName">Item Name</MenuItem>
              <MenuItem value="currentInventory">Stock Level</MenuItem>
            </Select>
          </FormControl>

          <Divider orientation="vertical" flexItem />
          
          <Typography variant="body2" color="text.secondary">
            Showing {filteredAlerts.length} of {processedAlertsComputed.length} alerts
          </Typography>
        </Box>
      </Paper>

      {/* Alert Tabs with improved design */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              minWidth: 200,
              px: 3,
              py: 2
            }
          }}
        >
          <Tab
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 150 }}>
                <Typography>Active Alerts</Typography>
                <Badge 
                  badgeContent={filteredAlertsComputed.length} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      position: 'static',
                      transform: 'none',
                      minWidth: 24,
                      height: 24,
                      fontSize: '0.75rem'
                    }
                  }}
                >
                  <Box />
                </Badge>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 150 }}>
                <Typography>Resolved Alerts</Typography>
                <Badge 
                  badgeContent={resolvedAlertsComputed.length} 
                  color="success"
                  sx={{
                    '& .MuiBadge-badge': {
                      position: 'static',
                      transform: 'none',
                      minWidth: 24,
                      height: 24,
                      fontSize: '0.75rem'
                    }
                  }}
                >
                  <Box />
                </Badge>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 150 }}>
                <Typography>Ignored Alerts</Typography>
                <Badge 
                  badgeContent={processedIgnoredAlerts.length} 
                  color="default"
                  sx={{
                    '& .MuiBadge-badge': {
                      position: 'static',
                      transform: 'none',
                      minWidth: 24,
                      height: 24,
                      fontSize: '0.75rem',
                      backgroundColor: 'grey.400',
                      color: 'white'
                    }
                  }}
                >
                  <Box />
                </Badge>
              </Box>
            } 
          />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <LinearProgress sx={{ width: '50%' }} />
            </Box>
          ) : (
            <>
              {tabValue === 0 && filteredAlertsComputed.length === 0 && (
                <MuiAlert severity="success" sx={{ mb: 2 }}>
                  🎉 Excellent! No active alerts. All items are above safety stock levels.
                </MuiAlert>
              )}

              {tabValue === 0 && filteredAlertsComputed.length > 0 && (
                <Paper sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={filteredAlertsComputed}
                    columns={columns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    onRowDoubleClick={(params: GridRowParams) => openAlertDialog(params.row as Alert)}
                    getRowClassName={(params) => 
                      params.row.read ? 'read-alert' : 'unread-alert'
                    }
                    sx={{
                      '& .MuiDataGrid-row:hover': {
                        cursor: 'pointer',
                      },
                      '& .read-alert': {
                        opacity: 0.6,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        '& .MuiDataGrid-cell': {
                          color: 'text.secondary',
                        },
                      },
                      '& .unread-alert': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        fontWeight: 'medium',
                        '& .MuiDataGrid-cell': {
                          fontWeight: 'inherit',
                        },
                      },
                    }}
                  />
                </Paper>
              )}

              {tabValue === 1 && (
                <Paper sx={{ height: 500, width: '100%' }}>
                  <DataGrid
                    rows={resolvedAlertsComputed}
                    columns={[
                      ...columns,
                      {
                        field: 'formattedResolvedAt',
                        headerName: 'Resolved At',
                        width: 160,
                        renderCell: (params) => (
                          <Typography variant="body2" color="text.secondary">
                            {params.value || 'N/A'}
                          </Typography>
                        ),
                      }
                    ]}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    disableRowSelectionOnClick
                    onRowDoubleClick={(params: GridRowParams) => openAlertDialog(params.row as Alert)}
                    sx={{
                      '& .MuiDataGrid-row': {
                        opacity: 0.7,
                        backgroundColor: 'rgba(76, 175, 80, 0.05)',
                      },
                      '& .MuiDataGrid-cell': {
                        color: 'text.secondary',
                      },
                    }}
                  />
                </Paper>
              )}

              {tabValue === 2 && (
                <>
                  {processedIgnoredAlerts.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        🔕 No Ignored Alerts
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Alerts that have been superseded by newer alerts will appear here.
                      </Typography>
                    </Box>
                  ) : (
                    <Paper sx={{ height: 500, width: '100%' }}>
                      <DataGrid
                        rows={processedIgnoredAlerts}
                        columns={[
                          ...columns,
                          {
                            field: 'formattedIgnoredAt',
                            headerName: 'Ignored At',
                            width: 160,
                            renderCell: (params) => (
                              <Typography variant="body2" color="text.secondary">
                                {params.value || 'N/A'}
                              </Typography>
                            ),
                          }
                        ]}
                        loading={loading}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                          pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        disableRowSelectionOnClick
                        onRowDoubleClick={(params: GridRowParams) => openAlertDialog(params.row as Alert)}
                        sx={{
                          '& .MuiDataGrid-row': {
                            opacity: 0.6,
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                          },
                          '& .MuiDataGrid-cell': {
                            color: 'text.secondary',
                          },
                        }}
                      />
                    </Paper>
                  )}
                </>
              )}
            </>
          )}
        </Box>
      </Paper>

      {/* Enhanced Alert Detail Dialog */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        {selectedAlert && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Chip
                    icon={<span>{getUrgencyIcon(selectedAlert.urgencyLevel)}</span>}
                    label={`${selectedAlert.urgencyLevel} Priority`}
                    color={getUrgencyColor(selectedAlert.urgencyLevel) as any}
                    variant="filled"
                  />
                  <Typography variant="h6">Alert Details</Typography>
                </Box>
                <IconButton onClick={() => setDialogOpen(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {selectedAlert.item.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                  Code: {selectedAlert.item.code} | Barcode: {selectedAlert.item.barcode}
                </Typography>
                <MuiAlert severity={selectedAlert.urgencyLevel === 'critical' ? 'error' : 'warning'} sx={{ mt: 2 }}>
                  {selectedAlert.message}
                </MuiAlert>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <InventoryIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {selectedAlert.currentInventory}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Current Stock
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                      {selectedAlert.pendingPO}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pending Orders
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                      {selectedAlert.usedInventory}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Used/Consumed
                    </Typography>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                      {selectedAlert.safetyStockThreshold}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Safety Threshold
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              <Card 
                variant="outlined" 
                sx={{ 
                  bgcolor: selectedAlert.currentInventory < selectedAlert.safetyStockThreshold 
                    ? 'error.light' 
                    : 'success.light',
                  mb: 3
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 'bold',
                    color: selectedAlert.currentInventory < selectedAlert.safetyStockThreshold 
                      ? 'error.dark' 
                      : 'success.dark'
                  }}>
                    {selectedAlert.currentInventory}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    Current Stock Level
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Available for immediate use
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((selectedAlert.currentInventory / selectedAlert.safetyStockThreshold) * 100, 100)}
                    color={selectedAlert.currentInventory < selectedAlert.safetyStockThreshold ? 'error' : 'success'}
                    sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  />
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    📅 Created: {selectedAlert.formattedCreatedAt}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ⏱️ Age: {selectedAlert.daysOld} days
                  </Typography>
                  {selectedAlert.resolved && selectedAlert.resolvedAt && (
                    <Typography variant="body2" color="text.secondary">
                      ✅ Resolved: {new Date(selectedAlert.resolvedAt).toLocaleString()}
                    </Typography>
                  )}
                  {selectedAlert.ignored && selectedAlert.ignoredAt && (
                    <Typography variant="body2" color="text.secondary">
                      🔕 Ignored: {new Date(selectedAlert.ignoredAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
                {selectedAlert.item.location && (
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      📍 Location: {selectedAlert.item.location}
                    </Typography>
                  </Box>
                )}
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              {!selectedAlert.resolved && (
                <Button
                  onClick={() => resolveAlert(selectedAlert.id)}
                  variant="contained"
                  color="success"
                  startIcon={<ResolveIcon />}
                  sx={{ mr: 'auto' }}
                >
                  Mark as Resolved
                </Button>
              )}
              {/* <Button variant="outlined" startIcon={<EmailIcon />}>
                Notify Team
              </Button> */}
              <Button onClick={() => setDialogOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Floating Action Button for quick actions */}
      <Fade in={activeAlerts > 0}>
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => fetchAlerts(true)}
        >
          <RefreshIcon />
        </Fab>
      </Fade>
    </Box>
  );
} 