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
      p: { xs: 1, sm: 2, md: 3 }, 
      width: '100%',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'stretch', sm: 'center' }, 
        mb: 3,
        gap: 2
      }}>
        <Typography 
          variant="h4"
          sx={{ 
            fontSize: { xs: '1.5rem', md: '2.125rem' }
          }}
        >
          Usage Reports & Analytics
        </Typography>
        <Button
          variant="contained"
          startIcon={<ExportIcon />}
          onClick={handleExportAllUsageToExcel}
        >
          Export All to Excel
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {displayData.reduce((sum, record) => sum + record.quantityUsed, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Items Used {isFiltered ? '(Filtered)' : ''}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {new Set(displayData.map(r => r.userName)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users {isFiltered ? '(Filtered)' : ''}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <InventoryIcon color="primary" />
                <Box>
                  <Typography variant="h6">
                    {new Set(displayData.map(r => r.itemName)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Items Used {isFiltered ? '(Filtered)' : ''}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Modern Filter Section */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ pb: 2 }}>
          {/* Filter Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge badgeContent={getActiveFiltersCount()} color="primary">
                <FilterIcon color="primary" />
              </Badge>
              <Typography variant="h6" color="primary">
                Filters & Search
              </Typography>
              {isFiltered && (
                <Chip 
                  label={`${filteredData.length} results`} 
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
              Quick Filters
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
                variant="outlined"
                size="small"
                onClick={() => setFiltersExpanded(true)}
                startIcon={<SearchIcon />}
              >
                Custom Search
              </Button>
            </Stack>
          </Box>

          {/* Advanced Filters (Collapsible) */}
          <Collapse in={filtersExpanded}>
            <Divider sx={{ mb: 3 }} />
            
            {/* Date Range Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarIcon fontSize="small" />
                Date Range
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
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
                <Grid item xs={12} sm={6} md={3}>
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
              </Grid>
            </Box>

            {/* Search Filters Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" />
                Search Criteria
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    size="small"
                    placeholder="Search by username..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: selectedUser ? 'action.selected' : 'transparent'
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  {user?.role === 'OWNER' ? (
                    <FormControl fullWidth size="small">
                      <InputLabel id="department-select-label">Department</InputLabel>
                      <Select
                        labelId="department-select-label"
                        value={selectedDepartment || ''}
                        label="Department"
                        onChange={(e) => handleDepartmentChange(e.target.value as string)}
                        disabled={departmentLoading}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: selectedDepartment ? 'action.selected' : 'transparent'
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
                      size="small"
                      disabled
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <DepartmentIcon fontSize="small" color="action" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'action.disabledBackground'
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
                    size="small"
                    placeholder="Barcode, code, or name..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BarcodeIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: selectedBarcodeOrItem ? 'action.selected' : 'transparent'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Department Information for ADMIN/USER */}
            {user?.role !== 'OWNER' && user?.department && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <DepartmentIcon fontSize="small" />
                  Department Data
                </Typography>
                <Alert severity="info" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DepartmentIcon fontSize="small" />
                    <Typography variant="body2">
                      Showing data for: <strong>{user.department}</strong>
                    </Typography>
                  </Box>
                </Alert>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button 
                variant="contained" 
                onClick={applyAdvancedFilter}
                disabled={loading}
                startIcon={<SearchIcon />}
                sx={{ minWidth: 140 }}
              >
                {loading ? 'Applying...' : 'Apply Filters'}
              </Button>
              
              <Button 
                variant="outlined" 
                startIcon={<ExportIcon />}
                onClick={exportFilteredData}
                disabled={loading || (!isFiltered && displayData.length === 0)}
                color="secondary"
              >
                Export {isFiltered ? 'Filtered' : 'All'} Data
              </Button>

              {getActiveFiltersCount() > 0 && (
                <Button 
                  variant="text" 
                  startIcon={<ClearIcon />}
                  onClick={resetFilters}
                  disabled={loading}
                  color="error"
                >
                  Clear Filters ({getActiveFiltersCount()})
                </Button>
              )}
              
              <Box sx={{ flexGrow: 1 }} />
              
              {isFiltered && (
                <Chip 
                  label={`Showing ${filteredData.length} of ${usageRecords.length} records`}
                  color="info"
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Usage Records (${displayData.length}${isFiltered ? ' Filtered' : ''})`} />
          <Tab label={`Item Summary (${itemSummary.length})`} />
          <Tab label={`User Summary (${userSummary.length})`} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tabValue === 0 && (
            <Paper sx={{ height: 500, width: '100%' }}>
              <DataGrid
                rows={displayData}
                columns={usageColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
                getRowId={(row) => row.id}
              />
            </Paper>
          )}

          {tabValue === 1 && (
            <Paper sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={itemSummary.map((item, index) => ({ ...item, id: `item-${index}` }))}
                columns={itemSummaryColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
              />
            </Paper>
          )}

          {tabValue === 2 && (
            <Paper sx={{ height: 400, width: '100%' }}>
              <DataGrid
                rows={userSummary.map((user, index) => ({ ...user, id: `user-${index}` }))}
                columns={userSummaryColumns}
                loading={loading}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 25 } },
                }}
              />
            </Paper>
          )}
        </Box>
      </Paper>
    </Box>
  );
} 