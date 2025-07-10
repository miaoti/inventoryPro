'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import type { RootState } from '../../store';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  TextField,
  Button,
  useTheme,
  alpha,
  Fade,
  Slide,
  CardHeader,
  Avatar,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarIcon,
  DateRange as DateRangeIcon,
  Business as DepartmentIcon,
  Dashboard as DashboardIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { statsAPI } from '../../services/api';

interface DailyUsageData {
  date: string;
  usage: number;
}

interface TopUsageItem {
  id: number;
  name: string;
  code: string;
  totalUsage: number;
  percentage: number;
}

interface LowStockItem {
  id: number;
  name: string;
  code: string;
  currentInventory: number;
  safetyStock: number;
  percentage: number;
}

interface StockAlert {
  id: number;
  name: string;
  code: string;
  currentInventory: number;
  safetyStock: number;
  alertType: 'critical' | 'warning';
  percentage: number;
}

interface QuickStatsData {
  dailyUsage: DailyUsageData[];
  topUsageItems: TopUsageItem[];
  lowStockItems: LowStockItem[];
  stockAlerts: StockAlert[];
  department?: string;
}

// Color scheme for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function QuickStats() {
  const router = useRouter();
  const theme = useTheme();
  
  // Authentication check
  const { isAuthenticated, token, user } = useSelector((state: RootState) => state.auth);
  
  // New unified state for all stats data
  const [statsData, setStatsData] = useState<QuickStatsData>({
    dailyUsage: [],
    topUsageItems: [],
    lowStockItems: [],
    stockAlerts: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Department states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  
  // Filter states
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  const [quickFilterMode, setQuickFilterMode] = useState('');

  // Authentication guard
  useEffect(() => {
    const checkAuth = () => {
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
      const hasToken = !!(token || cookieToken);
      
      if (!isAuthenticated || !hasToken) {
        router.push('/login');
        return;
      }
      
      // Initialize department data for OWNER users
      if (user?.role === 'OWNER') {
        fetchAvailableDepartments();
      }
      
      fetchQuickStats();
    };

    checkAuth();
  }, [isAuthenticated, token, router, user]);

  // Fetch available departments for OWNER users
  const fetchAvailableDepartments = async () => {
    if (user?.role !== 'OWNER') return;
    
    try {
      setDepartmentLoading(true);
      const response = await statsAPI.getAvailableDepartments();
      const departments = (response as any)?.data || response || [];
      setAvailableDepartments(departments);
    } catch (err: any) {
      console.error('Error fetching departments:', err);
      // Don't set error state for this, just log it
    } finally {
      setDepartmentLoading(false);
    }
  };

  // Handle department change
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department);
    fetchQuickStats(department);
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (selectedDepartment && user?.role === 'OWNER') count++;
    return count;
  };

  // Quick filter presets
  const applyQuickFilter = (mode: string) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Reset only date filters, preserve department selection
    setStartDate('');
    setEndDate('');
    setIsFiltered(false);
    setQuickFilterMode('');
    
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
      case '3months':
        const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
        setEndDate(today);
        break;
    }
    setQuickFilterMode(mode);
    setTimeout(() => applyDateFilter(), 100);
  };

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setIsFiltered(false);
    setQuickFilterMode('');
    if (user?.role === 'OWNER') {
      setSelectedDepartment('');
    }
    fetchQuickStats();
  };

  const applyDateFilter = async () => {
    try {
      setLoading(true);
      setError('');

      // Determine which department to use
      let targetDepartment = undefined;
      if (user?.role === 'OWNER') {
        // OWNER can select any department or view all
        targetDepartment = selectedDepartment || undefined;
      } else {
        // ADMIN/USER automatically use their own department
        targetDepartment = user?.department;
      }

      // For date filtered queries, use the unified Quick Stats API which handles department filtering correctly
      if (startDate && endDate) {
        // Use unified API for date-filtered data with department
        const response = await statsAPI.getQuickStats(targetDepartment);
        const data = (response as any)?.data || response;
        
        setStatsData({
          dailyUsage: data.dailyUsage || [],
          topUsageItems: data.topUsageItems || [],
          lowStockItems: data.lowStockItems || [],
          stockAlerts: data.stockAlerts || [],
          department: data.department,
        });
      } else {
        // For non-date filtered quick filters, still use unified API
        const response = await statsAPI.getQuickStats(targetDepartment);
        const data = (response as any)?.data || response;
        
        setStatsData({
          dailyUsage: data.dailyUsage || [],
          topUsageItems: data.topUsageItems || [],
          lowStockItems: data.lowStockItems || [],
          stockAlerts: data.stockAlerts || [],
          department: data.department,
        });
      }
      
      setIsFiltered(Boolean(startDate && endDate));

    } catch (err: any) {
      console.error('Filtered quick stats API error:', err);
      setError('Error loading filtered statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickStats = async (department?: string) => {
    try {
      setLoading(true);
      setError('');

      // Determine which department to use
      let targetDepartment = department;
      if (user?.role === 'OWNER') {
        // OWNER can select any department or view all
        targetDepartment = department || selectedDepartment || undefined;
      } else {
        // ADMIN/USER automatically use their own department
        targetDepartment = user?.department;
      }

      // Use the new unified Quick Stats API
      const response = await statsAPI.getQuickStats(targetDepartment);
      const data = (response as any)?.data || response;
      
      setStatsData({
        dailyUsage: data.dailyUsage || [],
        topUsageItems: data.topUsageItems || [],
        lowStockItems: data.lowStockItems || [],
        stockAlerts: data.stockAlerts || [],
        department: data.department,
      });

    } catch (err: any) {
      console.error('Quick stats API error:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again to view the statistics.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view these statistics.');
      } else {
        setError('Error loading statistics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getAlertSeverity = (alertType: string) => {
    return alertType === 'critical' ? 'error' : 'warning';
  };

  const getAlertIcon = (alertType: string) => {
    return alertType === 'critical' ? <ErrorIcon /> : <WarningIcon />;
  };

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
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
      {/*  Header Section */}
      <Paper 
        elevation={0}
        sx={{ 
          background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.08) 0%, rgba(156, 39, 176, 0.08) 100%)',
          borderRadius: 3,
          p: { xs: 2, md: 3 },
          mb: 3,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
              color: 'white',
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AssessmentIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1976d2 0%, #9c27b0 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.5rem', md: '2.125rem' },
                mb: 0.5
              }}
            >
              Quick Stats Dashboard
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontWeight: 500 }}
            >
              Real-time analytics and inventory insights
            </Typography>
          </Box>
        </Box>
        
        {/* Status Chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {/* Only show department chip for OWNER users when they have selected a specific department */}
          {user?.role === 'OWNER' && selectedDepartment && (
            <Chip 
              label={`Department: ${selectedDepartment}`}
              color="primary"
              variant="filled"
              size="small"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                color: 'white'
              }}
              icon={<DepartmentIcon sx={{ color: 'white' }} />}
            />
          )}
          {user?.role === 'OWNER' && !selectedDepartment && (
            <Chip 
              label="All Departments"
              color="secondary"
              variant="filled"
              size="small"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                color: 'white'
              }}
              icon={<DepartmentIcon sx={{ color: 'white' }} />}
            />
          )}
          {isFiltered && (
            <Chip 
              label="Filtered View Active"
              color="success"
              variant="filled"
              size="small"
              sx={{ 
                fontSize: '0.75rem',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                color: 'white'
              }}
              icon={<FilterIcon sx={{ color: 'white' }} />}
            />
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/*  Department Selection */}
      {user?.role === 'OWNER' && (
        <Fade in timeout={800}>
          <Card 
            sx={{ 
              mb: 3,
              background: `linear-gradient(135deg, ${alpha('#2196f3', 0.05)} 0%, ${alpha('#21cbf3', 0.05)} 100%)`,
              border: '1px solid',
              borderColor: alpha('#2196f3', 0.2),
              borderRadius: 3,
              overflow: 'visible'
            }}
          >
            <CardHeader
              avatar={
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)',
                    width: 40,
                    height: 40
                  }}
                >
                  <DepartmentIcon />
                </Avatar>
              }
              title="Department Filter"
              subheader="Filter analytics by specific department"
              titleTypographyProps={{
                variant: 'h6',
                fontWeight: 600,
                color: 'primary.main'
              }}
              subheaderTypographyProps={{
                color: 'text.secondary',
                fontWeight: 500
              }}
            />
            <CardContent sx={{ pt: 0 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="department-select-label">Select Department</InputLabel>
                <Select
                  labelId="department-select-label"
                  value={selectedDepartment || ''}
                  label="Select Department"
                  onChange={(e) => handleDepartmentChange(e.target.value as string)}
                  disabled={departmentLoading}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: selectedDepartment ? alpha('#2196f3', 0.08) : 'transparent',
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: alpha('#2196f3', 0.12)
                      }
                    }
                  }}
                >
                  <MenuItem value="">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DashboardIcon fontSize="small" />
                      All Departments
                    </Box>
                  </MenuItem>
                  {departmentLoading ? (
                    <MenuItem value="" disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={16} />
                        Loading departments...
                      </Box>
                    </MenuItem>
                  ) : availableDepartments.length === 0 ? (
                    <MenuItem value="" disabled>No departments found</MenuItem>
                  ) : (
                    availableDepartments.map((dep) => (
                      <MenuItem key={dep} value={dep}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DepartmentIcon fontSize="small" />
                          {dep}
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              {selectedDepartment && (
                <Slide direction="up" in={!!selectedDepartment} timeout={400}>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      mt: 2,
                      borderRadius: 2,
                      background: `linear-gradient(135deg, ${alpha('#0288d1', 0.1)} 0%, ${alpha('#0277bd', 0.1)} 100%)`,
                      border: '1px solid',
                      borderColor: alpha('#0288d1', 0.3)
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      <strong>Active Filter:</strong> {selectedDepartment}
                    </Typography>
                  </Alert>
                </Slide>
              )}
            </CardContent>
          </Card>
        </Fade>
      )}

      {/*  Department Information for ADMIN/USER */}
      {user?.role !== 'OWNER' && user?.department && (
        <Fade in timeout={800}>
          <Card 
            sx={{ 
              mb: 3,
              background: `linear-gradient(135deg, ${alpha('#4caf50', 0.05)} 0%, ${alpha('#66bb6a', 0.05)} 100%)`,
              border: '1px solid',
              borderColor: alpha('#4caf50', 0.2),
              borderRadius: 3
            }}
          >
            <CardHeader
              avatar={
                <Avatar
                  sx={{
                    background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                    width: 40,
                    height: 40
                  }}
                >
                  <DepartmentIcon />
                </Avatar>
              }
              title="Your Department"
              subheader="Analytics scope for your department"
              titleTypographyProps={{
                variant: 'h6',
                fontWeight: 600,
                color: 'success.main'
              }}
              subheaderTypographyProps={{
                color: 'text.secondary',
                fontWeight: 500
              }}
            />
            <CardContent sx={{ pt: 0 }}>
              <Alert 
                severity="info" 
                sx={{ 
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha('#2196f3', 0.1)} 0%, ${alpha('#21cbf3', 0.1)} 100%)`,
                  border: '1px solid',
                  borderColor: alpha('#2196f3', 0.3)
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DepartmentIcon fontSize="small" />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Showing analytics for: <strong>{user.department}</strong>
                  </Typography>
                </Box>
              </Alert>
            </CardContent>
          </Card>
        </Fade>
      )}

      {/* Modern Filter Section */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ pb: 2 }}>
          {/* Filter Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', sm: 'center' }, 
            mb: 3,
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Badge badgeContent={getActiveFiltersCount()} color="primary">
                <FilterIcon color="primary" />
              </Badge>
              <Typography 
                variant="h6" 
                color="primary"
                sx={{ 
                  fontSize: { xs: '1rem', md: '1.25rem' }
                }}
              >
                Time Range Filters
              </Typography>
              {isFiltered && (
                <Chip 
                  label="Filtered View" 
                  color="success" 
                  size="small"
                  variant="outlined"
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title={filtersExpanded ? "Collapse Filters" : "Expand Filters"}>
                <IconButton 
                  onClick={() => setFiltersExpanded(!filtersExpanded)}
                  size="small"
                  color="primary"
                >
                  {filtersExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
              {getActiveFiltersCount() > 0 && (
                <Tooltip title="Clear All Filters">
                  <IconButton onClick={resetFilters} size="small" color="error">
                    <ClearIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Quick Filter Buttons */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Quick Time Ranges
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                variant={quickFilterMode === 'today' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => applyQuickFilter('today')}
                startIcon={<CalendarIcon />}
              >
                Today
              </Button>
              <Button
                variant={quickFilterMode === 'week' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => applyQuickFilter('week')}
                startIcon={<DateRangeIcon />}
              >
                Last 7 Days
              </Button>
              <Button
                variant={quickFilterMode === 'month' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => applyQuickFilter('month')}
                startIcon={<DateRangeIcon />}
              >
                Last 30 Days
              </Button>
              <Button
                variant={quickFilterMode === '3months' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => applyQuickFilter('3months')}
                startIcon={<DateRangeIcon />}
              >
                Last 3 Months
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setFiltersExpanded(true)}
                startIcon={<SearchIcon />}
              >
                Custom Range
              </Button>
            </Stack>
          </Box>

          {/* Advanced Date Range Filters (Collapsible) */}
          <Collapse in={filtersExpanded}>
            <Divider sx={{ mb: 3 }} />
            
            {/* Date Range Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" />
                Custom Date Range
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: startDate ? 'action.selected' : 'transparent'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: endDate ? 'action.selected' : 'transparent'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Stack direction="row" spacing={1}>
                    <Button 
                      variant="contained" 
                      onClick={applyDateFilter}
                      disabled={loading || !startDate || !endDate}
                      startIcon={<SearchIcon />}
                      fullWidth
                    >
                      {loading ? 'Loading...' : 'Apply Filter'}
                    </Button>
                    {getActiveFiltersCount() > 0 && (
                      <Button 
                        variant="outlined" 
                        onClick={resetFilters}
                        disabled={loading}
                        color="error"
                      >
                        Reset
                      </Button>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </Box>



            {/* Filter Status */}
            {(isFiltered || selectedDepartment || statsData.department) && (
              <Alert severity="info" sx={{ mt: 2 }}>
                <Box>
                  {isFiltered && (
                    <Typography variant="body2">
                      <strong>Date Range:</strong> {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
                    </Typography>
                  )}
                  {statsData.department && (
                    <Typography variant="body2">
                      <strong>Department:</strong> {statsData.department}
                    </Typography>
                  )}
                  {user?.role === 'OWNER' && !selectedDepartment && !isFiltered && (
                    <Typography variant="body2">
                      <strong>Scope:</strong> All Departments
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}
          </Collapse>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/*  Daily Usage Overview */}
        <Grid item xs={12} lg={8}>
          <Fade in timeout={1000}>
            <Card 
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha('#1976d2', 0.02)} 0%, ${alpha('#1565c0', 0.02)} 100%)`,
                border: '1px solid',
                borderColor: alpha('#1976d2', 0.1),
                overflow: 'hidden'
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <TimelineIcon />
                  </Avatar>
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    Daily Usage Overview {isFiltered ? '(Filtered Period)' : '(Last 7 Days)'}
                    {isFiltered && (
                      <Chip 
                        label="Filtered" 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          ml: 1,
                          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                          color: 'white'
                        }} 
                      />
                    )}
                  </Box>
                }
                subheader="Track item usage patterns over time"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: 'primary.main'
                }}
                subheaderTypographyProps={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              />
              <CardContent sx={{ pt: 0 }}>
              <Box sx={{ height: 300, position: 'relative' }}>
                {statsData.dailyUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData.dailyUsage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                      />
                      <YAxis />
                      <RechartsTooltip 
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value) => [value, 'Items Used']}
                      />
                      <Legend />
                      <Bar 
                        dataKey="usage" 
                        fill="#1976d2" 
                        name="Items Used"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No usage data available for this period of time
                    </Typography>
                  </Box>
                )}
              </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/*  Top 5 Usage Items - Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Fade in timeout={1200}>
            <Card 
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha('#9c27b0', 0.02)} 0%, ${alpha('#7b1fa2', 0.02)} 100%)`,
                border: '1px solid',
                borderColor: alpha('#9c27b0', 0.1),
                overflow: 'hidden'
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <PieChartIcon />
                  </Avatar>
                }
                title={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    Top 5 Usage Items {isFiltered ? '(Filtered)' : ''}
                    {isFiltered && (
                      <Chip 
                        label="Filtered" 
                        size="small" 
                        color="secondary" 
                        sx={{ 
                          ml: 1,
                          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                          color: 'white'
                        }} 
                      />
                    )}
                  </Box>
                }
                subheader="Most frequently used items"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: 'secondary.main'
                }}
                subheaderTypographyProps={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              />
              <CardContent sx={{ pt: 0 }}>
              <Box sx={{ height: 300, position: 'relative' }}>
                {statsData.topUsageItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsData.topUsageItems}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ name, percentage }) => `${percentage}%`}
                      >
                        {statsData.topUsageItems.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value}%`, 'Usage']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No usage data available
                    </Typography>
                  </Box>
                )}
              </Box>
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/*  Top 5 Usage Items - List */}
        <Grid item xs={12} lg={6}>
          <Fade in timeout={1400}>
            <Card 
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha('#ff9800', 0.02)} 0%, ${alpha('#f57c00', 0.02)} 100%)`,
                border: '1px solid',
                borderColor: alpha('#ff9800', 0.1),
                overflow: 'hidden'
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <BarChartIcon />
                  </Avatar>
                }
                title={`Top 5 Usage Items (Details) ${isFiltered ? '- Filtered Period' : ''}`}
                subheader="Detailed breakdown of most used items"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: 'warning.main'
                }}
                subheaderTypographyProps={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              />
              <CardContent sx={{ pt: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell align="right">Total Usage</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statsData.topUsageItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box
                              sx={{
                                width: 12,
                                height: 12,
                                bgcolor: COLORS[index % COLORS.length],
                                borderRadius: '50%',
                                mr: 1,
                              }}
                            />
                            {item.name}
                          </Box>
                        </TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell align="right">{item.totalUsage}</TableCell>
                        <TableCell align="right">{item.percentage}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {statsData.topUsageItems.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No usage data available to show top items
                </Typography>
              )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/*  Low Stock Overview */}
        <Grid item xs={12} lg={6}>
          <Fade in timeout={1600}>
            <Card 
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha('#f44336', 0.02)} 0%, ${alpha('#d32f2f', 0.02)} 100%)`,
                border: '1px solid',
                borderColor: alpha('#f44336', 0.1),
                overflow: 'hidden'
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <InventoryIcon />
                  </Avatar>
                }
                title="Low Stock Overview"
                subheader="Between Safety Stock and 110% of Safety Stock"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: 'error.main'
                }}
                subheaderTypographyProps={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              />
              <CardContent sx={{ pt: 0 }}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Item Name</TableCell>
                      <TableCell>Code</TableCell>
                      <TableCell align="right">Current</TableCell>
                      <TableCell align="right">Safety Stock</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statsData.lowStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.code}</TableCell>
                        <TableCell align="right">{item.currentInventory}</TableCell>
                        <TableCell align="right">{item.safetyStock}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${item.percentage}%`}
                            color="warning"
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {statsData.lowStockItems.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No items are currently between safety stock and 110% of safety stock threshold
                </Typography>
              )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/*  Stock Alerts */}
        <Grid item xs={12}>
          <Fade in timeout={1800}>
            <Card 
              sx={{ 
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha('#ff5722', 0.02)} 0%, ${alpha('#e64a19', 0.02)} 100%)`,
                border: '1px solid',
                borderColor: alpha('#ff5722', 0.1),
                overflow: 'hidden'
              }}
            >
              <CardHeader
                avatar={
                  <Avatar
                    sx={{
                      background: 'linear-gradient(135deg, #ff5722 0%, #e64a19 100%)',
                      width: 40,
                      height: 40
                    }}
                  >
                    <NotificationsActiveIcon />
                  </Avatar>
                }
                title="Stock Alerts"
                subheader="Critical and warning alerts for low inventory levels"
                titleTypographyProps={{
                  variant: 'h6',
                  fontWeight: 600,
                  color: 'error.main'
                }}
                subheaderTypographyProps={{
                  color: 'text.secondary',
                  fontWeight: 500
                }}
              />
              <CardContent sx={{ pt: 0 }}>
              <Grid container spacing={2}>
                {statsData.stockAlerts.map((alert) => (
                  <Grid item xs={12} sm={6} md={4} key={alert.id}>
                    <Alert
                      severity={getAlertSeverity(alert.alertType)}
                      icon={getAlertIcon(alert.alertType)}
                      sx={{ height: '100%' }}
                    >
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          {alert.name} ({alert.code})
                        </Typography>
                        <Typography variant="body2">
                          Current: {alert.currentInventory} | Safety: {alert.safetyStock}
                        </Typography>
                        <Typography variant="body2">
                          At {alert.percentage}% of safety stock
                        </Typography>
                        <Chip
                          label={alert.alertType === 'critical' ? 'Critical (≤50%)' : 'Warning (<100%)'}
                          color={alert.alertType === 'critical' ? 'error' : 'warning'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Alert>
                  </Grid>
                ))}
              </Grid>
              {statsData.stockAlerts.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  All items are currently within acceptable stock levels
                </Typography>
              )}
              </CardContent>
            </Card>
          </Fade>
        </Grid>
      </Grid>
    </Box>
  );
} 