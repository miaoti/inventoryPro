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

// Color scheme for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function QuickStats() {
  const router = useRouter();
  
  // Authentication check
  const { isAuthenticated, token } = useSelector((state: RootState) => state.auth);
  
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData[]>([]);
  const [topUsageItems, setTopUsageItems] = useState<TopUsageItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
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
      
      fetchQuickStats();
    };

    checkAuth();
  }, [isAuthenticated, token, router]);

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
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
    fetchQuickStats();
  };

  const applyDateFilter = async () => {
    try {
      setLoading(true);
      setError('');

      // Determine the days parameter based on date range
      let days = 7; // default
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }

      // Fetch data with date range parameters
      const [dailyResponse, topUsageResponse, lowStockResponse, alertsResponse] = await Promise.all([
        startDate && endDate 
          ? statsAPI.getDailyUsageFiltered(startDate, endDate)
          : statsAPI.getDailyUsage(days),
        startDate && endDate
          ? statsAPI.getTopUsageItemsFiltered(5, startDate, endDate)
          : statsAPI.getTopUsageItems(5),
        statsAPI.getLowStockItems(),
        statsAPI.getStockAlerts(),
      ]);

      setDailyUsage((dailyResponse as any)?.data || dailyResponse || []);
      setTopUsageItems((topUsageResponse as any)?.data || topUsageResponse || []);
      setLowStockItems((lowStockResponse as any)?.data || lowStockResponse || []);
      setStockAlerts((alertsResponse as any)?.data || alertsResponse || []);
      setIsFiltered(Boolean(startDate && endDate));

    } catch (err: any) {
      console.error('Filtered quick stats API error:', err);
      setError('Error loading filtered statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuickStats = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch real data from backend APIs
      const [dailyResponse, topUsageResponse, lowStockResponse, alertsResponse] = await Promise.all([
        statsAPI.getDailyUsage(7),
        statsAPI.getTopUsageItems(5),
        statsAPI.getLowStockItems(),
        statsAPI.getStockAlerts(),
      ]);

      setDailyUsage((dailyResponse as any)?.data || dailyResponse || []);
      setTopUsageItems((topUsageResponse as any)?.data || topUsageResponse || []);
      setLowStockItems((lowStockResponse as any)?.data || lowStockResponse || []);
      setStockAlerts((alertsResponse as any)?.data || alertsResponse || []);

    } catch (err: any) {
      console.error('Quick stats API error:', err);
      
      if (err.response?.status === 401) {
        setError('Your session has expired. Please log in again to view the statistics.');
        // Let the API interceptor handle the redirect
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view these statistics. Please contact your administrator.');
      } else if (err.response?.status === 500) {
        setError('Server error while loading statistics. This might be due to missing data or a backend issue. Please try again later or contact support.');
      } else if (err.response?.status === 404) {
        setError('Quick Stats API endpoints are not available. Please check with your backend team.');
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else {
        setError(`An unexpected error occurred (${err.response?.status || 'Unknown'}). Please try refreshing the page.`);
      }
      
      // Set empty arrays when API fails
      setDailyUsage([]);
      setTopUsageItems([]);
      setLowStockItems([]);
      setStockAlerts([]);
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
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap',
          fontSize: { xs: '1.5rem', md: '2.125rem' }
        }}
      >
        <AnalyticsIcon sx={{ mr: 1 }} />
        Quick Stats Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
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
            {isFiltered && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
              </Alert>
            )}
          </Collapse>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Daily Usage Overview */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Daily Usage Overview {isFiltered ? '(Filtered Period)' : '(Last 7 Days)'}
                {isFiltered && (
                  <Chip 
                    label="Filtered" 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
              <Box sx={{ height: 300, position: 'relative' }}>
                {dailyUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyUsage}>
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
        </Grid>

        {/* Top 5 Usage Items - Pie Chart */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 Usage Items {isFiltered ? '(Filtered)' : ''}
                {isFiltered && (
                  <Chip 
                    label="Filtered" 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1 }} 
                  />
                )}
              </Typography>
              <Box sx={{ height: 300, position: 'relative' }}>
                {topUsageItems.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topUsageItems}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="percentage"
                        label={({ name, percentage }) => `${percentage}%`}
                      >
                        {topUsageItems.map((entry, index) => (
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
        </Grid>

        {/* Top 5 Usage Items - List */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 5 Usage Items (Details) {isFiltered ? '- Filtered Period' : ''}
              </Typography>
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
                    {topUsageItems.map((item, index) => (
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
              {topUsageItems.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No usage data available to show top items
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Low Stock Overview */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Low Stock Overview (Between Safety Stock and 110% of Safety Stock)
              </Typography>
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
                    {lowStockItems.map((item) => (
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
              {lowStockItems.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No items are currently between safety stock and 110% of safety stock threshold
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Stock Alerts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock Alerts
              </Typography>
              <Grid container spacing={2}>
                {stockAlerts.map((alert) => (
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
              {stockAlerts.length === 0 && !error && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  All items are currently within acceptable stock levels
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
} 