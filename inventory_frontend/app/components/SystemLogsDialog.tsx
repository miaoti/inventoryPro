'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Stack,
  Pagination,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  History as HistoryIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  ShoppingCart as ShoppingCartIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  MoreVert as MoreVertIcon,
  CleaningServices as CleaningServicesIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { systemLogsAPI } from '@/services/api';

interface SystemLogsDialogProps {
  open: boolean;
  onClose: () => void;
}

interface LogEntry {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  action: string;
  username?: string;
  details: string;
  module: 'AUTH' | 'INVENTORY' | 'PURCHASE' | 'SYSTEM' | 'USER';
  ipAddress?: string;
}

export default function SystemLogsDialog({ open, onClose }: SystemLogsDialogProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const isOwner = user?.role === 'OWNER';
  
  // Only OWNER can access system logs
  if (!isOwner) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Access Denied</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            System logs are only available to OWNER users.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Filter states
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [userFilter, setUserFilter] = useState<string>('');
  const [page, setPage] = useState(0); // 0-based for backend
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  
  // Selection states for delete functionality
  const [selectedLogs, setSelectedLogs] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Menu state for actions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLogs();
    }
  }, [open, page, levelFilter, moduleFilter, userFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await systemLogsAPI.getLogs({
        page,
        size: itemsPerPage,
        level: levelFilter !== 'ALL' ? levelFilter : undefined,
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        username: userFilter || undefined,
        sortBy: 'timestamp',
        sortDir: 'desc'
      });
      
      const data = response.data;
      setLogs(data.logs || []);
      setTotalPages(data.totalPages || 0);
      setTotalElements(data.totalElements || 0);
      
    } catch (err: any) {
      console.error('Error fetching system logs:', err);
      setError('Failed to load system logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedLogs.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedLogs.length} selected log entries? This action cannot be undone.`)) {
      return;
    }
    
    setDeleteLoading(true);
    setError(null);
    
    try {
      const response = await systemLogsAPI.deleteLogs(selectedLogs);
      const data = response.data;
      setSuccess(`Successfully deleted ${data.deletedCount} log entries`);
      setSelectedLogs([]);
      setSelectAll(false);
      await fetchLogs();
    } catch (err: any) {
      console.error('Error deleting logs:', err);
      setError(err.response?.data?.error || 'Failed to delete logs');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCleanupOldLogs = async () => {
    const days = prompt('Delete logs older than how many days?', '30');
    if (!days || isNaN(Number(days)) || Number(days) < 1) return;
    
    if (!confirm(`Are you sure you want to delete all logs older than ${days} days? This action cannot be undone.`)) {
      return;
    }
    
    setDeleteLoading(true);
    setError(null);
    
    try {
      const response = await systemLogsAPI.deleteOldLogs(Number(days));
      const data = response.data;
      setSuccess(`Successfully cleaned up ${data.deletedCount} old log entries`);
      await fetchLogs();
    } catch (err: any) {
      console.error('Error cleaning up logs:', err);
      setError(err.response?.data?.error || 'Failed to cleanup logs');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedLogs([]);
      setSelectAll(false);
    } else {
      setSelectedLogs(logs.map(log => log.id));
      setSelectAll(true);
    }
  };

  const handleSelectLog = (logId: number) => {
    if (selectedLogs.includes(logId)) {
      setSelectedLogs(selectedLogs.filter(id => id !== logId));
    } else {
      setSelectedLogs([...selectedLogs, logId]);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'error';
      case 'WARN': return 'warning';
      case 'INFO': return 'info';
      case 'DEBUG': return 'default';
      default: return 'default';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'AUTH': return <PersonIcon />;
      case 'INVENTORY': return <InventoryIcon />;
      case 'PURCHASE': return <ShoppingCartIcon />;
      case 'USER': return <PersonIcon />;
      case 'SYSTEM': return <SettingsIcon />;
      default: return <HistoryIcon />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleClose = () => {
    setSelectedLogs([]);
    setSelectAll(false);
    setError(null);
    setSuccess(null);
    setPage(0);
    setLevelFilter('ALL');
    setModuleFilter('ALL');
    setUserFilter('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <HistoryIcon />
            System Activity Logs
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {isOwner && selectedLogs.length > 0 && (
              <Button
                startIcon={<DeleteIcon />}
                onClick={handleDeleteSelected}
                disabled={deleteLoading}
                color="error"
                size="small"
              >
                Delete Selected ({selectedLogs.length})
              </Button>
            )}
            {isOwner && (
              <IconButton
                onClick={handleMenuClick}
                disabled={deleteLoading}
                size="small"
              >
                <MoreVertIcon />
              </IconButton>
            )}
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchLogs}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <FilterIcon />
                <Typography variant="h6">Filters</Typography>
              </Box>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Level</InputLabel>
                  <Select
                    value={levelFilter}
                    label="Level"
                    onChange={(e) => { setLevelFilter(e.target.value); setPage(0); }}
                  >
                    <MenuItem value="ALL">All Levels</MenuItem>
                    <MenuItem value="ERROR">Error</MenuItem>
                    <MenuItem value="WARN">Warning</MenuItem>
                    <MenuItem value="INFO">Info</MenuItem>
                    <MenuItem value="DEBUG">Debug</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Module</InputLabel>
                  <Select
                    value={moduleFilter}
                    label="Module"
                    onChange={(e) => { setModuleFilter(e.target.value); setPage(0); }}
                  >
                    <MenuItem value="ALL">All Modules</MenuItem>
                    <MenuItem value="AUTH">Authentication</MenuItem>
                    <MenuItem value="INVENTORY">Inventory</MenuItem>
                    <MenuItem value="PURCHASE">Purchase Orders</MenuItem>
                    <MenuItem value="USER">User Management</MenuItem>
                    <MenuItem value="SYSTEM">System</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  size="small"
                  label="Filter by User"
                  value={userFilter}
                  onChange={(e) => { setUserFilter(e.target.value); setPage(0); }}
                  placeholder="Enter username"
                  sx={{ minWidth: 150 }}
                />
              </Stack>

              <Box mt={2}>
                <Typography variant="body2" color="text.secondary">
                  Showing {logs.length} of {totalElements} log entries
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Logs Table */}
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {isOwner && (
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectAll}
                            onChange={handleSelectAll}
                            disabled={logs.length === 0}
                          />
                        </TableCell>
                      )}
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Level</TableCell>
                      <TableCell>Module</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>User</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>IP Address</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        {isOwner && (
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={selectedLogs.includes(log.id)}
                              onChange={() => handleSelectLog(log.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatTimestamp(log.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.level}
                            color={getLevelColor(log.level) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getModuleIcon(log.module)}
                            <Typography variant="body2">
                              {log.module}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {log.action.replace('_', ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.username || 'System'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {log.details}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {log.ipAddress || 'N/A'}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page + 1} // Convert to 1-based for display
                    onChange={(_, newPage) => setPage(newPage - 1)} // Convert back to 0-based
                    color="primary"
                  />
                </Box>
              )}

              {logs.length === 0 && !loading && (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No log entries found matching the current filters.
                  </Typography>
                </Box>
              )}
            </>
          )}

          {/* Info Alert */}
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              System Logs Information:
            </Typography>
            <Typography variant="body2">
              • Logs are automatically generated for all system activities
              <br />
              • Entries are retained for 30 days by default
              <br />
              • Use filters to narrow down specific activities or users
              <br />
              • Critical errors and security events are highlighted
            </Typography>
          </Alert>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => { handleCleanupOldLogs(); handleMenuClose(); }}>
          <ListItemIcon>
            <CleaningServicesIcon />
          </ListItemIcon>
          <ListItemText>Cleanup Old Logs</ListItemText>
        </MenuItem>
      </Menu>
    </Dialog>
  );
} 