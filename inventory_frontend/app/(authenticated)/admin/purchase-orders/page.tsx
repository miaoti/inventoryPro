'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { purchaseOrderStatsAPI } from '../../../services/api';
import { PurchaseOrder } from '../../../types/purchaseOrder';
// import { TrackingDisplay } from '../../../../components/TrackingDisplay';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  CheckCircle as ArrivedIcon,
  Schedule as PendingIcon,
  ShoppingCart as OrderIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  LocalShipping as TrackingIcon,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`po-tabpanel-${index}`}
      aria-labelledby={`po-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function PurchaseOrderStatsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const [allPOs, setAllPOs] = useState<PurchaseOrder[]>([]);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [arrivedPOs, setArrivedPOs] = useState<PurchaseOrder[]>([]);
  const [filteredAllPOs, setFilteredAllPOs] = useState<PurchaseOrder[]>([]);
  const [filteredPendingPOs, setFilteredPendingPOs] = useState<PurchaseOrder[]>([]);
  const [filteredArrivedPOs, setFilteredArrivedPOs] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    createdBy: '',
    startDate: '',
    endDate: '',
    itemName: '',
  });
  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  // Check if current user is owner
  if (user?.role !== 'OWNER') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Only owners can view purchase order statistics.
        </Alert>
      </Box>
    );
  }

  useEffect(() => {
    fetchPOData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, allPOs, pendingPOs, arrivedPOs]);

  const fetchPOData = async () => {
    try {
      setLoading(true);
      const [all, pending, arrived] = await Promise.all([
        purchaseOrderStatsAPI.getAll(),
        purchaseOrderStatsAPI.getPending(),
        purchaseOrderStatsAPI.getArrived(),
      ]);
      
      console.log('API Response - All POs:', all);
      console.log('API Response - Pending POs:', pending);
      console.log('API Response - Arrived POs:', arrived);
      
      // Ensure we always set arrays, even if API returns undefined or null
      const safeAllPOs = Array.isArray(all) ? all : [];
      const safePendingPOs = Array.isArray(pending) ? pending : [];
      const safeArrivedPOs = Array.isArray(arrived) ? arrived : [];
      
      setAllPOs(safeAllPOs);
      setPendingPOs(safePendingPOs);
      setArrivedPOs(safeArrivedPOs);
      
      // Extract unique users for filter dropdown
      const users = new Set<string>();
      safeAllPOs.forEach(po => {
        if (po.createdBy) users.add(po.createdBy);
      });
      setAvailableUsers(Array.from(users).sort());
      
    } catch (error) {
      console.error('Error fetching PO data:', error);
      // Set empty arrays on error
      setAllPOs([]);
      setPendingPOs([]);
      setArrivedPOs([]);
      setAvailableUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filterPOs = (pos: PurchaseOrder[]) => {
      return pos.filter(po => {
        // Created by filter
        if (filters.createdBy && po.createdBy !== filters.createdBy) {
          return false;
        }
        
        // Date range filter
        if (filters.startDate) {
          const poDate = new Date(po.orderDate);
          const startDate = new Date(filters.startDate);
          if (poDate < startDate) return false;
        }
        
        if (filters.endDate) {
          const poDate = new Date(po.orderDate);
          const endDate = new Date(filters.endDate);
          endDate.setHours(23, 59, 59, 999); // Include full end date
          if (poDate > endDate) return false;
        }
        
        // Item name filter
        if (filters.itemName) {
          const searchTerm = filters.itemName.toLowerCase();
          if (!po.itemName?.toLowerCase().includes(searchTerm)) {
            return false;
          }
        }
        
        return true;
      });
    };

    setFilteredAllPOs(filterPOs(allPOs));
    setFilteredPendingPOs(filterPOs(pendingPOs));
    setFilteredArrivedPOs(filterPOs(arrivedPOs));
  };

  const clearFilters = () => {
    setFilters({
      createdBy: '',
      startDate: '',
      endDate: '',
      itemName: '',
    });
  };

  const handleViewDetails = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setDetailDialogOpen(true);
  };

  const getStatusChip = (po: PurchaseOrder) => {
    if (po.arrived) {
      return <Chip label="Arrived" color="success" size="small" icon={<ArrivedIcon />} />;
    }
    return <Chip label="Pending" color="warning" size="small" icon={<PendingIcon />} />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPOStats = () => {
    // Use filtered data for stats
    const totalValue = filteredAllPOs.reduce((sum, po) => sum + (po?.quantity || 0), 0);
    const pendingValue = filteredPendingPOs.reduce((sum, po) => sum + (po?.quantity || 0), 0);
    const arrivedValue = filteredArrivedPOs.reduce((sum, po) => sum + (po?.quantity || 0), 0);

    return [
      { label: 'Total POs', count: filteredAllPOs.length, value: totalValue, color: 'primary', icon: <OrderIcon /> },
      { label: 'Pending', count: filteredPendingPOs.length, value: pendingValue, color: 'warning', icon: <PendingIcon /> },
      { label: 'Arrived', count: filteredArrivedPOs.length, value: arrivedValue, color: 'success', icon: <ArrivedIcon /> },
    ];
  };

  const renderPOTable = (pos: PurchaseOrder[]) => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Order Date</TableCell>
            <TableCell>Arrival Date</TableCell>
            <TableCell>Tracking</TableCell>
            <TableCell>Created By</TableCell>
            <TableCell>Arrived By</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pos.map((po) => (
            <TableRow key={po.id}>
              <TableCell>{po.itemName}</TableCell>
              <TableCell>{po.quantity}</TableCell>
              <TableCell>{getStatusChip(po)}</TableCell>
              <TableCell>{formatDate(po.orderDate)}</TableCell>
              <TableCell>
                {po.arrivalDate ? formatDate(po.arrivalDate) : '-'}
              </TableCell>
              <TableCell>
                {po.trackingNumber ? (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {po.trackingNumber}
                    </Typography>
                    {/* <TrackingDisplay trackingNumber={po.trackingNumber} compact /> */}
                  </Box>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell>{po.createdBy || '-'}</TableCell>
              <TableCell>{po.arrivedBy || '-'}</TableCell>
              <TableCell>
                <Tooltip title="View Details">
                  <IconButton
                    onClick={() => handleViewDetails(po)}
                    size="small"
                    color="primary"
                  >
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        <Typography>Loading purchase order statistics...</Typography>
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
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '2.125rem' } }}>
        Purchase Order Statistics
      </Typography>

      {/* Filters */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FilterIcon />
            <Typography variant="h6">Filters</Typography>
            {(filters.createdBy || filters.startDate || filters.endDate || filters.itemName) && (
              <Chip label="Active" size="small" color="primary" />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Created By</InputLabel>
                <Select
                  value={filters.createdBy}
                  onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
                  label="Created By"
                >
                  <MenuItem value="">All Users</MenuItem>
                  {availableUsers.map(user => (
                    <MenuItem key={user} value={user}>{user}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Item Name"
                value={filters.itemName}
                onChange={(e) => setFilters({ ...filters, itemName: e.target.value })}
                placeholder="Search by item name..."
              />
            </Grid>
            <Grid item xs={12} sm={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                size="small"
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* PO Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {getPOStats().map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ color: `${stat.color}.main` }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h6" color={`${stat.color}.main`}>
                      {stat.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Qty: {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs for different views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All POs (${filteredAllPOs.length})`} />
          <Tab label={`Pending (${filteredPendingPOs.length})`} />
          <Tab label={`Arrived (${filteredArrivedPOs.length})`} />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={tabValue} index={0}>
        {renderPOTable(filteredAllPOs)}
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        {renderPOTable(filteredPendingPOs)}
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        {renderPOTable(filteredArrivedPOs)}
      </TabPanel>

      {/* PO Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <OrderIcon />
            Purchase Order Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPO && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    PO ID
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    #{selectedPO.id}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Item
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPO.itemName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quantity
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPO.quantity}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {getStatusChip(selectedPO)}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedPO.orderDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Arrival Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPO.arrivalDate ? formatDate(selectedPO.arrivalDate) : 'Not arrived yet'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tracking Number
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPO.trackingNumber || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created By
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPO.createdBy || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Arrived By
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedPO.arrivedBy || 'Not arrived yet'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Created At
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedPO.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatDate(selectedPO.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Tracking Information */}
              {selectedPO.trackingNumber && (
                <Box sx={{ mt: 3 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TrackingIcon color="primary" />
                    <Typography variant="h6">Package Tracking</Typography>
                  </Box>
                  {/* <TrackingDisplay trackingNumber={selectedPO.trackingNumber} /> */}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
} 