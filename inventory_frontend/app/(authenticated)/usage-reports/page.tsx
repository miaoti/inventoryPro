'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Tab,
  Tabs,
  TextField,
  Button,
  Chip,
  Grid,
  Collapse,
  IconButton,
  Divider,
  InputAdornment,
  Tooltip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  Alert,
  LinearProgress,
  Fade,
  Zoom,
  Slide,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  DateRange as DateRangeIcon,
  GetApp as ExportIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarIcon,
  Business as DepartmentIcon,
  QrCode as BarcodeIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  Groups as GroupsIcon,
  AssignmentTurnedIn as TaskIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import axios from 'axios';
import api from '../../services/api';

interface UsageRecord {
  id: number;
  item: {
    id: number;
    name: string;
    code: string;
    barcode: string;
    location: string;
  };
  userName: string;
  department: string;
  dNumber?: string;
  quantityUsed: number;
  usedAt: string;
  notes?: string;
  barcode: string;
  // Flattened fields for DataGrid
  itemName?: string;
  itemCode?: string;
  itemLocation?: string;
  formattedUsedAt?: string;
}

interface UsageSummary {
  itemName: string;
  itemCode: string;
  totalQuantityUsed: number;
  usageCount: number;
}

interface UserSummary {
  userName: string;
  usageCount: number;
  totalQuantityUsed: number;
}

export default function UsageReportsPage() {
  // Authentication check
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  
  const [tabValue, setTabValue] = useState(0);
  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [itemSummary, setItemSummary] = useState<UsageSummary[]>([]);
  const [userSummary, setUserSummary] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBarcodeOrItem, setSelectedBarcodeOrItem] = useState('');
  const [filteredData, setFilteredData] = useState<UsageRecord[]>([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [quickFilterMode, setQuickFilterMode] = useState('');
  
  // Department states for OWNER users
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    fetchAllData();
    
    // Initialize department data for OWNER users
    if (user?.role === 'OWNER') {
      fetchAvailableDepartments();
    }
  }, [user]);
  
  // Fetch available departments for OWNER users
  const fetchAvailableDepartments = async () => {
    if (user?.role !== 'OWNER') return;
    
    try {
      setDepartmentLoading(true);
      const response = await api.get('/stats/departments');
      const departments = (response as any)?.data || response || [];
      setAvailableDepartments(departments);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
    } finally {
      setDepartmentLoading(false);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchUsageRecords(),
        fetchItemSummary(),
        fetchUserSummary()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageRecords = async () => {
    try {
      const response = await api.get('/usage');
      const responseData = (response as any)?.data || response || [];
      console.log('Fetched usage records:', responseData); // Debug log
      
      // Flatten the data structure for better DataGrid compatibility
      const flattenedRecords = responseData.map((record: any) => ({
        ...record,
        itemName: record.item?.name || 'N/A',
        itemCode: record.item?.code || 'N/A',
        itemLocation: record.item?.location || 'N/A',
        formattedUsedAt: record.usedAt ? formatDate(record.usedAt) : 'Unknown'
      }));
      
      setUsageRecords(flattenedRecords);
    } catch (error) {
      console.error('Error fetching usage records:', error);
    }
  };

  const fetchItemSummary = async () => {
    try {
      const response = await api.get('/usage/summary/items');
      const responseData = (response as any)?.data || response || [];
      setItemSummary(responseData);
    } catch (error) {
      console.error('Error fetching item summary:', error);
    }
  };

  const fetchUserSummary = async () => {
    try {
      const response = await api.get('/usage/summary/users');
      const responseData = (response as any)?.data || response || [];
      setUserSummary(responseData);
    } catch (error) {
      console.error('Error fetching user summary:', error);
    }
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setSelectedUser('');
    setSelectedDepartment('');
    setSelectedBarcodeOrItem('');
    setIsFiltered(false);
    setFilteredData([]);
    setQuickFilterMode('');
    fetchUsageRecords();
  };
  
  // Handle department change for OWNER users
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
  };

  const applyAdvancedFilter = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUser.trim()) params.append('userName', selectedUser.trim());
      
      // Determine which department to use based on user role
      let targetDepartment = selectedDepartment;
      if (user?.role === 'OWNER') {
        // OWNER can select any department or view all
        targetDepartment = selectedDepartment;
      } else {
        // ADMIN/USER automatically use their own department
        targetDepartment = user?.department || '';
      }
      
      if (targetDepartment && targetDepartment.trim()) {
        params.append('department', targetDepartment.trim());
      }
      
      if (selectedBarcodeOrItem.trim()) params.append('barcodeOrItemCode', selectedBarcodeOrItem.trim());

      const response = await api.get(`/usage/filtered?${params.toString()}`);
      const responseData = (response as any)?.data || response || [];
      
      // Flatten the data structure for better DataGrid compatibility
      const flattenedRecords = responseData.map((record: any) => ({
        ...record,
        itemName: record.item?.name || 'N/A',
        itemCode: record.item?.code || 'N/A',
        itemLocation: record.item?.location || 'N/A',
        formattedUsedAt: record.usedAt ? formatDate(record.usedAt) : 'Unknown'
      }));
      
      setFilteredData(flattenedRecords);
      setIsFiltered(true);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportFilteredData = async () => {
    try {
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUser.trim()) params.append('userName', selectedUser.trim());
      if (selectedDepartment.trim()) params.append('department', selectedDepartment.trim());
      if (selectedBarcodeOrItem.trim()) params.append('barcodeOrItemCode', selectedBarcodeOrItem.trim());

      const response = await fetch(`${API_URL}/usage/export/excel/filtered?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export filtered usage data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from response headers if available
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'filtered_usage_report.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting filtered data:', error);
    }
  };

  const displayData = isFiltered ? filteredData : usageRecords;

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (selectedUser.trim()) count++;
    if (user?.role === 'OWNER' && selectedDepartment.trim()) count++;
    if (selectedBarcodeOrItem.trim()) count++;
    return count;
  };

  // Quick filter presets
  const applyQuickFilter = (mode: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    resetFilters();
    
    switch (mode) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setStartDate(weekAgo.toISOString().split('T')[0]);
        setEndDate(today);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        setStartDate(monthAgo.toISOString().split('T')[0]);
        setEndDate(today);
        break;
    }
    setQuickFilterMode(mode);
    setTimeout(() => applyAdvancedFilter(), 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleExportAllUsageToExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/usage/export/excel`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export usage data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting usage data:', error);
    }
  };

  const handleExportDateRangeToExcel = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/usage/export/excel/date-range?startDate=${startDate}&endDate=${endDate}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${document.cookie.split(';').find(c => c.trim().startsWith('token='))?.split('=')[1] || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to export usage data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage_report_${startDate}_to_${endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting usage data:', error);
    }
  };

  const usageColumns: GridColDef[] = [
    { field: 'userName', headerName: 'User', width: 150 },
    { 
      field: 'department', 
      headerName: 'Department', 
      width: 120
    },
    { 
      field: 'dNumber', 
      headerName: 'D Number', 
      width: 120
    },
    { 
      field: 'itemName', 
      headerName: 'Item Name', 
      flex: 1
    },
    { 
      field: 'itemCode', 
      headerName: 'Item Code', 
      width: 120
    },
    { 
      field: 'itemLocation', 
      headerName: 'Location', 
      width: 120
    },
    { field: 'quantityUsed', headerName: 'Quantity Used', width: 130 },
    { 
      field: 'formattedUsedAt', 
      headerName: 'Used At', 
      width: 180
    },
    { field: 'notes', headerName: 'Notes', flex: 1 },
  ];

  const itemSummaryColumns: GridColDef[] = [
    { field: 'itemName', headerName: 'Item Name', flex: 1 },
    { field: 'itemCode', headerName: 'Item Code', width: 120 },
    { field: 'totalQuantityUsed', headerName: 'Total Used', width: 120 },
    { field: 'usageCount', headerName: 'Usage Count', width: 120 },
  ];

  const userSummaryColumns: GridColDef[] = [
    { field: 'userName', headerName: 'User Name', flex: 1 },
    { field: 'usageCount', headerName: 'Total Usages', width: 140 },
    { field: 'totalQuantityUsed', headerName: 'Total Quantity', width: 140 },
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
      p: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Enhanced Header Section */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            p: { xs: 3, md: 4 },
            mb: 4,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><defs><pattern id=\'grain\' width=\'100\' height=\'100\' patternUnits=\'userSpaceOnUse\'><circle cx=\'50\' cy=\'50\' r=\'1\' fill=\'%23ffffff\' opacity=\'0.1\'/></pattern></defs><rect width=\'100\' height=\'100\' fill=\'url(%23grain)\'/></svg>")',
              pointerEvents: 'none',
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            gap: 3,
            position: 'relative',
            zIndex: 1,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                background: alpha(theme.palette.common.white, 0.15),
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <AnalyticsIcon sx={{ fontSize: 32 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4"
                  sx={{ 
                    fontSize: { xs: '1.5rem', md: '2.125rem' },
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  Usage Reports & Analytics
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Track inventory usage patterns and generate detailed reports
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={<ExportIcon />}
              onClick={handleExportAllUsageToExcel}
              sx={{
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.25)',
                  transform: 'translateY(-1px)',
                  boxShadow: `0 8px 25px ${alpha(theme.palette.common.black, 0.15)}`,
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              Export All to Excel
            </Button>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Zoom in timeout={600} style={{ transitionDelay: '100ms' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.light, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
              borderRadius: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.success.main, 0.15)}`,
                borderColor: alpha(theme.palette.success.main, 0.4),
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.3)}`,
                  }}>
                    <TrendingUpIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.dark, mb: 0.5 }}>
                      {displayData.reduce((sum, record) => sum + record.quantityUsed, 0).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                      Total Items Used {isFiltered && <Chip label="Filtered" size="small" color="success" variant="outlined" sx={{ ml: 1 }} />}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
        <Grid item xs={12} md={4}>
          <Zoom in timeout={600} style={{ transitionDelay: '200ms' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
              borderRadius: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.info.main, 0.15)}`,
                borderColor: alpha(theme.palette.info.main, 0.4),
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}>
                    <GroupsIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.info.dark, mb: 0.5 }}>
                      {new Set(displayData.map(r => r.userName)).size.toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                      Active Users {isFiltered && <Chip label="Filtered" size="small" color="info" variant="outlined" sx={{ ml: 1 }} />}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
        <Grid item xs={12} md={4}>
          <Zoom in timeout={600} style={{ transitionDelay: '300ms' }}>
            <Card sx={{
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.light, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              borderRadius: 3,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 12px 40px ${alpha(theme.palette.warning.main, 0.15)}`,
                borderColor: alpha(theme.palette.warning.main, 0.4),
              }
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.3)}`,
                  }}>
                    <InventoryIcon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.dark, mb: 0.5 }}>
                      {new Set(displayData.map(r => r.itemName)).size.toLocaleString()}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, fontWeight: 500 }}>
                      Items Used {isFiltered && <Chip label="Filtered" size="small" color="warning" variant="outlined" sx={{ ml: 1 }} />}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Grid>
      </Grid>

      {/* Enhanced Filter Section */}
      <Slide in direction="up" timeout={800} style={{ transitionDelay: '400ms' }}>
        <Card sx={{ 
          mb: 4,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
          overflow: 'visible',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 12px 48px ${alpha(theme.palette.common.black, 0.12)}`,
            transform: 'translateY(-2px)',
          }
        }}>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Enhanced Filter Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    borderRadius: 2,
                    p: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }}>
                    <Badge badgeContent={getActiveFiltersCount()} color="error" sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }
                    }}>
                      <FilterIcon sx={{ fontSize: 24 }} />
                    </Badge>
                  </Box>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
                      Filters & Search
                    </Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                      {getActiveFiltersCount() > 0 ? `${getActiveFiltersCount()} active filters` : 'No filters applied'}
                    </Typography>
                  </Box>
                </Box>
                {isFiltered && (
                  <Zoom in>
                    <Chip 
                      label={`${filteredData.length} results found`} 
                      color="success" 
                      variant="filled"
                      icon={<TaskIcon />}
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        px: 1.5,
                        py: 2,
                        borderRadius: 2,
                        boxShadow: `0 2px 8px ${alpha(theme.palette.success.main, 0.3)}`,
                      }}
                    />
                  </Zoom>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Tooltip title={filtersExpanded ? "Collapse Filters" : "Expand Filters"} arrow>
                  <IconButton 
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      color: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                  >
                    {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Tooltip>
                {getActiveFiltersCount() > 0 && (
                  <Tooltip title="Clear All Filters" arrow>
                    <IconButton 
                      onClick={resetFilters} 
                      sx={{
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                        color: theme.palette.error.main,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.error.main, 0.2),
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>

            {/* Enhanced Quick Filter Buttons */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{
                  background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
                  borderRadius: 1.5,
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <TimelineIcon sx={{ fontSize: 20, color: theme.palette.secondary.main }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Quick Filters
                </Typography>
              </Box>
              <Stack 
                direction="row" 
                spacing={2} 
                flexWrap="wrap" 
                useFlexGap
                sx={{ 
                  '& .MuiButton-root': {
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 500,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }
                }}
              >
                <Button
                  variant={quickFilterMode === 'today' ? 'contained' : 'outlined'}
                  onClick={() => applyQuickFilter('today')}
                  startIcon={<CalendarIcon />}
                  sx={{
                    ...(quickFilterMode === 'today' ? {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      }
                    } : {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateY(-1px)',
                      }
                    })
                  }}
                >
                  Today
                </Button>
                <Button
                  variant={quickFilterMode === 'week' ? 'contained' : 'outlined'}
                  onClick={() => applyQuickFilter('week')}
                  startIcon={<DateRangeIcon />}
                  sx={{
                    ...(quickFilterMode === 'week' ? {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      }
                    } : {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateY(-1px)',
                      }
                    })
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant={quickFilterMode === 'month' ? 'contained' : 'outlined'}
                  onClick={() => applyQuickFilter('month')}
                  startIcon={<DateRangeIcon />}
                  sx={{
                    ...(quickFilterMode === 'month' ? {
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                      }
                    } : {
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                      color: theme.palette.primary.main,
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateY(-1px)',
                      }
                    })
                  }}
                >
                  Last 30 Days
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setFiltersExpanded(true)}
                  startIcon={<SearchIcon />}
                  sx={{
                    borderColor: alpha(theme.palette.secondary.main, 0.3),
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      borderColor: theme.palette.secondary.main,
                      bgcolor: alpha(theme.palette.secondary.main, 0.05),
                      transform: 'translateY(-1px)',
                    }
                  }}
                >
                  Custom Search
                </Button>
              </Stack>
            </Box>

            {/* Enhanced Advanced Filters (Collapsible) */}
            <Collapse in={filtersExpanded} timeout={500}>
              <Box sx={{ 
                pt: 3,
                borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.5)} 0%, ${alpha(theme.palette.grey[100], 0.3)} 100%)`,
                borderRadius: 2,
                p: 3,
                mt: 3,
              }}>
                {/* Date Range Section */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                      borderRadius: 1.5,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CalendarIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Date Range
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: startDate ? alpha(theme.palette.success.light, 0.1) : 'transparent',
                            borderColor: startDate ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.divider, 0.23),
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: startDate ? theme.palette.success.main : theme.palette.primary.main,
                            },
                            '&.Mui-focused': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: endDate ? alpha(theme.palette.success.light, 0.1) : 'transparent',
                            borderColor: endDate ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.divider, 0.23),
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: endDate ? theme.palette.success.main : theme.palette.primary.main,
                            },
                            '&.Mui-focused': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Search Filters Section */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Box sx={{
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                      borderRadius: 1.5,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <SearchIcon sx={{ fontSize: 20, color: theme.palette.primary.main }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                      Search Criteria
                    </Typography>
                  </Box>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={4}>
                      <TextField
                        fullWidth
                        label="Username"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                        placeholder="Search by username..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon 
                                sx={{ 
                                  color: selectedUser ? theme.palette.primary.main : theme.palette.action.disabled,
                                  fontSize: 20
                                }} 
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: selectedUser ? alpha(theme.palette.primary.light, 0.1) : 'transparent',
                            borderColor: selectedUser ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.23),
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: selectedUser ? theme.palette.primary.main : theme.palette.primary.main,
                            },
                            '&.Mui-focused': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                      {user?.role === 'OWNER' ? (
                        <FormControl fullWidth>
                          <InputLabel id="department-select-label">Department</InputLabel>
                          <Select
                            labelId="department-select-label"
                            value={selectedDepartment || ''}
                            label="Department"
                            onChange={(e) => handleDepartmentChange(e.target.value as string)}
                            disabled={departmentLoading}
                            startAdornment={
                              <InputAdornment position="start">
                                <DepartmentIcon 
                                  sx={{ 
                                    color: selectedDepartment ? theme.palette.primary.main : theme.palette.action.disabled,
                                    fontSize: 20,
                                    ml: 1
                                  }} 
                                />
                              </InputAdornment>
                            }
                            sx={{ 
                              borderRadius: 2,
                              '& .MuiOutlinedInput-root': {
                                backgroundColor: selectedDepartment ? alpha(theme.palette.primary.light, 0.1) : 'transparent',
                                borderColor: selectedDepartment ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.23),
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  borderColor: selectedDepartment ? theme.palette.primary.main : theme.palette.primary.main,
                                },
                                '&.Mui-focused': {
                                  borderColor: theme.palette.primary.main,
                                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                                }
                              }
                            }}
                          >
                            <MenuItem value="">All Departments</MenuItem>
                            {departmentLoading ? (
                              <MenuItem value="" disabled>Loading departments...</MenuItem>
                            ) : availableDepartments.length === 0 ? (
                              <MenuItem value="" disabled>No departments found</MenuItem>
                            ) : (
                              availableDepartments.map((dep) => (
                                <MenuItem key={dep} value={dep}>{dep}</MenuItem>
                              ))
                            )}
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          label="Department"
                          value={user?.department || ''}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <DepartmentIcon sx={{ color: theme.palette.action.disabled, fontSize: 20 }} />
                              </InputAdornment>
                            ),
                          }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              backgroundColor: alpha(theme.palette.action.disabledBackground, 0.5),
                            }
                          }}
                        />
                      )}
                    </Grid>
                    <Grid item xs={12} sm={12} md={4}>
                      <TextField
                        fullWidth
                        label="Item Search"
                        value={selectedBarcodeOrItem}
                        onChange={(e) => setSelectedBarcodeOrItem(e.target.value)}
                        placeholder="Barcode, code, or name..."
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BarcodeIcon 
                                sx={{ 
                                  color: selectedBarcodeOrItem ? theme.palette.primary.main : theme.palette.action.disabled,
                                  fontSize: 20
                                }} 
                              />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: selectedBarcodeOrItem ? alpha(theme.palette.primary.light, 0.1) : 'transparent',
                            borderColor: selectedBarcodeOrItem ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.divider, 0.23),
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              borderColor: selectedBarcodeOrItem ? theme.palette.primary.main : theme.palette.primary.main,
                            },
                            '&.Mui-focused': {
                              borderColor: theme.palette.primary.main,
                              boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                            }
                          }
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>

                {/* Department Information for ADMIN/USER */}
                {user?.role !== 'OWNER' && user?.department && (
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{
                        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                        borderRadius: 1.5,
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <DepartmentIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        Department Data
                      </Typography>
                    </Box>
                    <Alert 
                      severity="info" 
                      icon={<DepartmentIcon />}
                      sx={{ 
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        '& .MuiAlert-message': {
                          display: 'flex',
                          alignItems: 'center',
                          fontWeight: 500,
                        }
                      }}
                    >
                      Showing data for: <strong style={{ marginLeft: '4px' }}>{user.department}</strong>
                    </Alert>
                  </Box>
                )}

                {/* Enhanced Action Buttons */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  flexWrap: 'wrap', 
                  alignItems: 'center', 
                  pt: 4,
                  borderTop: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.3)} 0%, transparent 100%)`,
                  borderRadius: 2,
                  p: 3,
                  mt: 3,
                }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={applyAdvancedFilter}
                    disabled={loading}
                    startIcon={loading ? <LinearProgress size={20} /> : <SearchIcon />}
                    sx={{
                      minWidth: 160,
                      py: 1.5,
                      px: 4,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                      },
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled,
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    {loading ? 'Applying...' : 'Apply Filters'}
                  </Button>
                  
                  <Button 
                    variant="outlined" 
                    size="large"
                    startIcon={<ExportIcon />}
                    onClick={exportFilteredData}
                    disabled={loading || (!isFiltered && displayData.length === 0)}
                    sx={{
                      py: 1.5,
                      px: 3,
                      borderRadius: 2,
                      fontWeight: 500,
                      borderColor: alpha(theme.palette.secondary.main, 0.5),
                      color: theme.palette.secondary.main,
                      '&:hover': {
                        borderColor: theme.palette.secondary.main,
                        bgcolor: alpha(theme.palette.secondary.main, 0.05),
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Export {isFiltered ? 'Filtered' : 'All'} Data
                  </Button>

                  {getActiveFiltersCount() > 0 && (
                    <Button 
                      variant="text" 
                      size="large"
                      startIcon={<ClearIcon />}
                      onClick={resetFilters}
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        px: 3,
                        borderRadius: 2,
                        color: theme.palette.error.main,
                        fontWeight: 500,
                        '&:hover': {
                          bgcolor: alpha(theme.palette.error.main, 0.05),
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Clear Filters ({getActiveFiltersCount()})
                    </Button>
                  )}
                  
                  <Box sx={{ flexGrow: 1 }} />
                  
                  {isFiltered && (
                    <Zoom in>
                      <Chip 
                        label={`Showing ${filteredData.length} of ${usageRecords.length} records`}
                        color="info"
                        variant="outlined"
                        sx={{
                          fontWeight: 500,
                          px: 2,
                          py: 2.5,
                          borderRadius: 2,
                          fontSize: '0.875rem',
                          border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                          background: alpha(theme.palette.info.light, 0.1),
                        }}
                      />
                    </Zoom>
                  )}
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Slide>

      {/* Enhanced Tabs and Data Display */}
      <Slide in direction="up" timeout={1000} style={{ transitionDelay: '600ms' }}>
        <Paper sx={{ 
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.default, 0.8)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
          overflow: 'hidden',
          mb: 4,
        }}>
          <Box sx={{
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          }}>
            <Tabs 
              value={tabValue} 
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 500,
                  fontSize: '1rem',
                  py: 2,
                  px: 3,
                  minHeight: 64,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.05),
                  },
                  '&.Mui-selected': {
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                  }
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TimelineIcon sx={{ fontSize: 20 }} />
                    <span>Usage Records ({displayData.length.toLocaleString()}{isFiltered ? ' Filtered' : ''})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <InventoryIcon sx={{ fontSize: 20 }} />
                    <span>Item Summary ({itemSummary.length.toLocaleString()})</span>
                  </Box>
                } 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <GroupsIcon sx={{ fontSize: 20 }} />
                    <span>User Summary ({userSummary.length.toLocaleString()})</span>
                  </Box>
                } 
              />
            </Tabs>
          </Box>

          <Box sx={{ p: { xs: 2, md: 3 } }}>
            {tabValue === 0 && (
              <Fade in timeout={500}>
                <Paper sx={{ 
                  height: { xs: 400, md: 500 }, 
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: `inset 0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                }}>
                  <DataGrid
                    rows={displayData}
                    columns={usageColumns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50, 100]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    getRowId={(row) => row.id}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.grey[100], 0.6)} 100%)`,
                        borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                        fontWeight: 600,
                      },
                      '& .MuiDataGrid-row': {
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: alpha(theme.palette.grey[50], 0.3),
                        }
                      }
                    }}
                  />
                </Paper>
              </Fade>
            )}

            {tabValue === 1 && (
              <Fade in timeout={500}>
                <Paper sx={{ 
                  height: { xs: 400, md: 450 }, 
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: `inset 0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                }}>
                  <DataGrid
                    rows={itemSummary.map((item, index) => ({ ...item, id: `item-${index}` }))}
                    columns={itemSummaryColumns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.grey[100], 0.6)} 100%)`,
                        borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                        fontWeight: 600,
                      },
                      '& .MuiDataGrid-row': {
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: alpha(theme.palette.grey[50], 0.3),
                        }
                      }
                    }}
                  />
                </Paper>
              </Fade>
            )}

            {tabValue === 2 && (
              <Fade in timeout={500}>
                <Paper sx={{ 
                  height: { xs: 400, md: 450 }, 
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: `inset 0 2px 8px ${alpha(theme.palette.common.black, 0.05)}`,
                }}>
                  <DataGrid
                    rows={userSummary.map((user, index) => ({ ...user, id: `user-${index}` }))}
                    columns={userSummaryColumns}
                    loading={loading}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                      pagination: { paginationModel: { pageSize: 25 } },
                    }}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        background: `linear-gradient(135deg, ${alpha(theme.palette.grey[50], 0.8)} 0%, ${alpha(theme.palette.grey[100], 0.6)} 100%)`,
                        borderBottom: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
                        fontWeight: 600,
                      },
                      '& .MuiDataGrid-row': {
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: alpha(theme.palette.grey[50], 0.3),
                        }
                      }
                    }}
                  />
                </Paper>
              </Fade>
            )}
          </Box>
        </Paper>
      </Slide>
    </Box>
  );
} 