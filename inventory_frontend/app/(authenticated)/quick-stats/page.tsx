'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Inventory as InventoryIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
  const [dailyUsage, setDailyUsage] = useState<DailyUsageData[]>([]);
  const [topUsageItems, setTopUsageItems] = useState<TopUsageItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuickStats();
  }, []);

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

      setDailyUsage(dailyResponse.data || []);
      setTopUsageItems(topUsageResponse.data || []);
      setLowStockItems(lowStockResponse.data || []);
      setStockAlerts(alertsResponse.data || []);

    } catch (err: any) {
      console.error('Quick stats API error:', err);
      if (err.response?.status === 404) {
        setError('Quick Stats API endpoints not implemented yet. Please check with your backend team.');
      } else if (err.response?.status === 500) {
        setError('Server error while fetching statistics. Please try again later.');
      } else {
        setError('Unable to connect to the server. Please check your connection and try again.');
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <AnalyticsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Quick Stats Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Daily Usage Overview */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Daily Usage Overview (Last 7 Days)
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={formatDate}
                    />
                    <YAxis />
                    <Tooltip 
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
                {dailyUsage.length === 0 && !error && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      No usage data available for the last 7 days
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
                Top 5 Usage Items
              </Typography>
              <Box sx={{ height: 300 }}>
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
                    <Tooltip formatter={(value) => [`${value}%`, 'Usage']} />
                  </PieChart>
                </ResponsiveContainer>
                {topUsageItems.length === 0 && !error && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
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
                Top 5 Usage Items (Details)
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