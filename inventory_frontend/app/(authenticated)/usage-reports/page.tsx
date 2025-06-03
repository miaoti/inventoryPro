'use client';

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  DateRange as DateRangeIcon,
  GetApp as ExportIcon,
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    fetchAllData();
  }, []);

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
      console.log('Fetched usage records:', response.data); // Debug log
      
      // Flatten the data structure for better DataGrid compatibility
      const flattenedRecords = response.data.map((record: any) => ({
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
      setItemSummary(response.data);
    } catch (error) {
      console.error('Error fetching item summary:', error);
    }
  };

  const fetchUserSummary = async () => {
    try {
      const response = await api.get('/usage/summary/users');
      setUserSummary(response.data);
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
    fetchUsageRecords();
  };

  const applyAdvancedFilter = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedUser.trim()) params.append('userName', selectedUser.trim());
      if (selectedDepartment.trim()) params.append('department', selectedDepartment.trim());
      if (selectedBarcodeOrItem.trim()) params.append('barcodeOrItemCode', selectedBarcodeOrItem.trim());

      const response = await api.get(`/usage/filtered?${params.toString()}`);
      
      // Flatten the data structure for better DataGrid compatibility
      const flattenedRecords = response.data.map((record: any) => ({
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

      const response = await fetch(`http://localhost:8080/api/usage/export/excel/filtered?${params.toString()}`, {
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

  // Determine which data to display
  const displayData = isFiltered ? filteredData : usageRecords;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const handleExportAllUsageToExcel = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/usage/export/excel', {
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
      const response = await fetch(`http://localhost:8080/api/usage/export/excel/date-range?startDate=${startDate}&endDate=${endDate}`, {
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
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

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Advanced Filters
          </Typography>
          {isFiltered && (
            <Chip 
              label={`Filtered Results: ${filteredData.length} records`} 
              color="primary" 
              variant="outlined"
              onDelete={resetFilters}
            />
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
          {/* Date Range Filters */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Typography variant="subtitle2" color="text.secondary">Date Range:</Typography>
            <TextField
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
            <TextField
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 140 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
          {/* Text-based Filters */}
          <TextField
            label="Username"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            size="small"
            placeholder="Enter username"
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Department"
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            size="small"
            placeholder="e.g., D001, D123"
            sx={{ minWidth: 150 }}
          />
          <TextField
            label="Barcode or Item Code"
            value={selectedBarcodeOrItem}
            onChange={(e) => setSelectedBarcodeOrItem(e.target.value)}
            size="small"
            placeholder="Enter barcode, item code, or name"
            sx={{ minWidth: 200 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            variant="contained" 
            onClick={applyAdvancedFilter}
            disabled={loading}
          >
            Apply Filters
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ExportIcon />}
            onClick={exportFilteredData}
            disabled={loading || (!isFiltered && displayData.length === 0)}
          >
            Export {isFiltered ? 'Filtered' : 'All'} Data
          </Button>
          <Button 
            variant="text" 
            onClick={resetFilters}
            disabled={loading}
          >
            Clear All Filters
          </Button>
        </Box>
      </Paper>

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