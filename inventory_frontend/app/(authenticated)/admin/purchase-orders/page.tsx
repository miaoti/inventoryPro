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
  useTheme,
  alpha,
  Fade,
  Zoom,
  Slide,
  LinearProgress,
  CardHeader,
  Avatar,
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
  Analytics as AnalyticsIcon,
  Inventory as InventoryIcon,
  Assessment as StatsIcon,
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
  const theme = useTheme();
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
      <Box sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        background: theme => `linear-gradient(135deg, ${alpha(theme.palette.error.light, 0.1)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
      }}>
        <Fade in timeout={800}>
          <Alert 
            severity="error" 
            sx={{
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              '& .MuiAlert-message': {
                fontSize: '1.1rem',
                fontWeight: 500,
              }
            }}
          >
            Access denied. Only owners can view purchase order statistics.
          </Alert>
        </Fade>
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
      const [allResponse, pendingResponse, arrivedResponse]: any[] = await Promise.all([
        purchaseOrderStatsAPI.getAll(),
        purchaseOrderStatsAPI.getPending(),
        purchaseOrderStatsAPI.getArrived(),
      ]);
      
      console.log('API Response - All POs:', allResponse);
      console.log('API Response - Pending POs:', pendingResponse);
      console.log('API Response - Arrived POs:', arrivedResponse);
      
      // Extract data from response objects
      const all = allResponse.data || allResponse;
      const pending = pendingResponse.data || pendingResponse;
      const arrived = arrivedResponse.data || arrivedResponse;
      
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
    <Slide in direction="up" timeout={600}>
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow 
              sx={{ 
                background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              }}
            >
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Item</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Quantity</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Status</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Order Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Arrival Date</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Tracking</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Created By</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Arrived By</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pos.map((po, index) => (
              <TableRow 
                key={po.id}
                sx={{ 
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.primary.light, 0.05),
                    transform: 'scale(1.001)',
                  },
                  transition: 'all 0.2s ease',
                  animation: `fadeInUp 0.5s ease ${index * 0.1}s both`,
                  '@keyframes fadeInUp': {
                    from: {
                      opacity: 0,
                      transform: 'translateY(20px)',
                    },
                    to: {
                      opacity: 1,
                      transform: 'translateY(0)',
                    },
                  },
                }}
              >
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {po.itemName}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={po.quantity} 
                    size="small" 
                    color="info"
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell>{getStatusChip(po)}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(po.orderDate)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {po.arrivalDate ? formatDate(po.arrivalDate) : '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {po.trackingNumber ? (
                    <Box>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                        {po.trackingNumber}
                      </Typography>
                      {/* <TrackingDisplay trackingNumber={po.trackingNumber} compact /> */}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {po.createdBy || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {po.arrivedBy || '-'}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Details">
                    <IconButton
                      onClick={() => handleViewDetails(po)}
                      size="small"
                      sx={{
                        color: theme.palette.primary.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.2s ease',
                      }}
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
    </Slide>
  );

  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
        background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Card sx={{ p: 4, borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <LinearProgress sx={{ width: 200, height: 6, borderRadius: 3 }} />
            <Typography variant="h6" color="text.secondary">
              Loading purchase order statistics...
            </Typography>
          </Box>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      background: theme => `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
    }}>
      {/* Enhanced Header Section */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
                  Purchase Order Analytics
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Comprehensive tracking and analysis of purchase orders
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced Filters */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '200ms' }}>
        <Accordion 
          sx={{ 
            mb: 4,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{
              background: theme => `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
              '&:hover': {
                background: theme => `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)} 0%, ${alpha(theme.palette.info.light, 0.08)} 100%)`,
              },
              transition: 'all 0.3s ease',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{
                background: theme => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                width: 32,
                height: 32,
              }}>
                <FilterIcon sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Advanced Filters</Typography>
              {(filters.createdBy || filters.startDate || filters.endDate || filters.itemName) && (
                <Chip 
                  label="Active" 
                  size="small" 
                  color="info"
                  sx={{ 
                    fontWeight: 600,
                    boxShadow: theme => `0 2px 8px ${alpha(theme.palette.info.main, 0.3)}`,
                  }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={3} alignItems="flex-end">
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Created By</InputLabel>
                  <Select
                    value={filters.createdBy}
                    onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
                    label="Created By"
                    sx={{ borderRadius: 2 }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
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
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearFilters}
                  size="small"
                  sx={{
                    borderRadius: 2,
                    borderWidth: 2,
                    '&:hover': { borderWidth: 2 },
                  }}
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Slide>

      {/* Enhanced Statistics Cards */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '400ms' }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {getPOStats().map((stat, index) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Zoom in timeout={600} style={{ transitionDelay: `${600 + index * 200}ms` }}>
                <Card sx={{
                  borderRadius: 3,
                  background: theme => `linear-gradient(135deg, ${alpha(theme.palette[stat.color].main, 0.08)} 0%, ${alpha(theme.palette[stat.color].light, 0.05)} 100%)`,
                  border: theme => `1px solid ${alpha(theme.palette[stat.color].main, 0.2)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme => `0 12px 40px ${alpha(theme.palette[stat.color].main, 0.15)}`,
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{
                        background: theme => `linear-gradient(135deg, ${theme.palette[stat.color].main} 0%, ${theme.palette[stat.color].dark} 100%)`,
                        width: 48,
                        height: 48,
                      }}>
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: theme => theme.palette[stat.color].main,
                            fontWeight: 700,
                            mb: 0.5,
                          }}
                        >
                          {stat.count}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: 'text.primary',
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {stat.label}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontWeight: 500,
                          }}
                        >
                          Total Qty: {stat.value.toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Slide>

      {/* Enhanced Tabs */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '600ms' }}>
        <Paper sx={{ 
          mb: 4, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          overflow: 'hidden',
        }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                }
              }
            }}
          >
            <Tab 
              label={`All POs (${filteredAllPOs.length})`}
              icon={<StatsIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`Pending (${filteredPendingPOs.length})`} 
              icon={<PendingIcon />}
              iconPosition="start"
            />
            <Tab 
              label={`Arrived (${filteredArrivedPOs.length})`}
              icon={<ArrivedIcon />}
              iconPosition="start"
            />
          </Tabs>
        </Paper>
      </Slide>

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

      {/* Enhanced PO Detail Dialog */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            margin: theme => theme.spacing(-3, -3, 0, -3),
            padding: theme => theme.spacing(2, 3),
          }}>
            <Avatar sx={{
              background: alpha(theme.palette.common.white, 0.15),
              width: 32,
              height: 32,
            }}>
              <OrderIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Purchase Order Details
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          {selectedPO && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    PO ID
                  </Typography>
                  <Chip 
                    label={`#${selectedPO.id}`} 
                    color="primary" 
                    variant="outlined"
                    sx={{ fontWeight: 600, mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Item
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {selectedPO.itemName}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Quantity
                  </Typography>
                  <Chip 
                    label={selectedPO.quantity} 
                    color="info" 
                    sx={{ fontWeight: 600, mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Status
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    {getStatusChip(selectedPO)}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Order Date
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {formatDate(selectedPO.orderDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Arrival Date
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {selectedPO.arrivalDate ? formatDate(selectedPO.arrivalDate) : 'Not arrived yet'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Tracking Number
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {selectedPO.trackingNumber || 'Not provided'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Created By
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {selectedPO.createdBy || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Arrived By
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {selectedPO.arrivedBy || 'Not arrived yet'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Created At
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {formatDate(selectedPO.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600, mb: 1 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body1" gutterBottom sx={{ fontWeight: 500 }}>
                    {formatDate(selectedPO.updatedAt)}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Enhanced Tracking Information */}
              {selectedPO.trackingNumber && (
                <Box sx={{ mt: 4 }}>
                  <Divider sx={{ mb: 3 }} />
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2, 
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    background: theme => `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                    border: theme => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}>
                    <Avatar sx={{
                      background: theme => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                      width: 32,
                      height: 32,
                    }}>
                      <TrackingIcon sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Package Tracking</Typography>
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