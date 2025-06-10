'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Paper,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  BugReport as LogsIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Email as EmailIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  AccessTime as TimeIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { ownerLogsAPI } from '../../services/api';

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
      id={`logs-tabpanel-${index}`}
      aria-labelledby={`logs-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function OwnerLogsPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [tabValue, setTabValue] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [emailLogs, setEmailLogs] = useState<string[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [logLevel, setLogLevel] = useState('INFO');
  const [lineCount, setLineCount] = useState(100);
  const [searchQuery, setSearchQuery] = useState('');
  const [emailLineCount, setEmailLineCount] = useState(50);

  // Check if user is OWNER
  const isOwner = user?.role === 'OWNER';

  useEffect(() => {
    if (isOwner) {
      loadRecentLogs();
      loadSystemStatus();
    }
  }, [isOwner]);

  const loadRecentLogs = async () => {
    try {
      setLoading(true);
      const response: any = await ownerLogsAPI.getRecentLogs(lineCount, logLevel);
      setLogs(response.logs || []);
      setSuccess(`Loaded ${response.totalLines} log entries`);
    } catch (err: any) {
      setError(`Failed to load logs: ${err.message}`);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEmailLogs = async () => {
    try {
      setLoading(true);
      const response: any = await ownerLogsAPI.getEmailLogs(emailLineCount);
      setEmailLogs(response.logs || []);
      setSuccess(`Loaded ${response.totalLines} email log entries`);
    } catch (err: any) {
      setError(`Failed to load email logs: ${err.message}`);
      setEmailLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response: any = await ownerLogsAPI.getSystemStatus();
      setSystemStatus(response);
    } catch (err: any) {
      console.error('Failed to load system status:', err);
    }
  };

  const searchLogs = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      const response: any = await ownerLogsAPI.searchLogs(searchQuery, 100);
      setSearchResults(response.logs || []);
      setSuccess(`Found ${response.totalMatches} matching entries`);
    } catch (err: any) {
      setError(`Search failed: ${err.message}`);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');

    // Load data for the selected tab
    if (newValue === 1 && emailLogs.length === 0) {
      loadEmailLogs();
    } else if (newValue === 3) {
      loadSystemStatus();
    }
  };

  const formatLogLine = (line: string, index: number) => {
    // Extract log level for styling
    const isError = line.includes(' ERROR ');
    const isWarn = line.includes(' WARN ');
    const isInfo = line.includes(' INFO ');
    const isDebug = line.includes(' DEBUG ');

    const getLogLevelColor = () => {
      if (isError) return '#f44336';
      if (isWarn) return '#ff9800';
      if (isInfo) return '#2196f3';
      if (isDebug) return '#9e9e9e';
      return '#000';
    };

    const getLogLevelIcon = () => {
      if (isError) return <ErrorIcon sx={{ fontSize: 16, color: '#f44336' }} />;
      if (isWarn) return <WarningIcon sx={{ fontSize: 16, color: '#ff9800' }} />;
      if (isInfo) return <InfoIcon sx={{ fontSize: 16, color: '#2196f3' }} />;
      return <TimeIcon sx={{ fontSize: 16, color: '#9e9e9e' }} />;
    };

    return (
      <Box
        key={index}
        sx={{
          p: 1,
          mb: 0.5,
          backgroundColor: isError ? '#ffebee' : isWarn ? '#fff3e0' : 'transparent',
          borderLeft: `3px solid ${getLogLevelColor()}`,
          borderRadius: 1,
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        {getLogLevelIcon()}
        <Typography
          component="pre"
          sx={{
            margin: 0,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            flex: 1,
            fontSize: 'inherit',
          }}
        >
          {line}
        </Typography>
      </Box>
    );
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOwner) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access Denied. This page is exclusively for OWNER users.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <LogsIcon sx={{ color: '#f44336' }} />
        System Logs & Monitoring
        <Chip label="OWNER ONLY" color="error" size="small" />
      </Typography>

      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Recent Logs" icon={<ViewIcon />} />
        <Tab label="Email Logs" icon={<EmailIcon />} />
        <Tab label="Search Logs" icon={<SearchIcon />} />
        <Tab label="System Status" icon={<MemoryIcon />} />
      </Tabs>

      {/* Success/Error Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Recent Logs Tab */}
      <TabPanel value={tabValue} index={0}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent System Logs
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Log Level</InputLabel>
                  <Select
                    value={logLevel}
                    label="Log Level"
                    onChange={(e) => setLogLevel(e.target.value)}
                  >
                    <MenuItem value="ALL">All Levels</MenuItem>
                    <MenuItem value="ERROR">Error</MenuItem>
                    <MenuItem value="WARN">Warning</MenuItem>
                    <MenuItem value="INFO">Info</MenuItem>
                    <MenuItem value="DEBUG">Debug</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Number of Lines"
                  type="number"
                  value={lineCount}
                  onChange={(e) => setLineCount(parseInt(e.target.value) || 100)}
                  inputProps={{ min: 10, max: 1000 }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadRecentLogs}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                  sx={{ height: 56 }}
                >
                  {loading ? 'Loading...' : 'Refresh Logs'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
          {logs.length > 0 ? (
            logs.map((line, index) => formatLogLine(line, index))
          ) : (
            <Typography color="text.secondary" align="center">
              No log entries found. Click "Refresh Logs" to load recent entries.
            </Typography>
          )}
        </Paper>
      </TabPanel>

      {/* Email Logs Tab */}
      <TabPanel value={tabValue} index={1}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Email System Logs
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Number of Lines"
                  type="number"
                  value={emailLineCount}
                  onChange={(e) => setEmailLineCount(parseInt(e.target.value) || 50)}
                  inputProps={{ min: 10, max: 200 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={loadEmailLogs}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <EmailIcon />}
                  sx={{ height: 56 }}
                >
                  {loading ? 'Loading...' : 'Load Email Logs'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
          {emailLogs.length > 0 ? (
            emailLogs.map((line, index) => formatLogLine(line, index))
          ) : (
            <Typography color="text.secondary" align="center">
              No email log entries found. Click "Load Email Logs" to search for email-related logs.
            </Typography>
          )}
        </Paper>
      </TabPanel>

      {/* Search Logs Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search System Logs
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Search Query"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., EMAIL, ERROR, AlertService, specific error message..."
                  onKeyPress={(e) => e.key === 'Enter' && searchLogs()}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={searchLogs}
                  disabled={loading || !searchQuery.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
                  sx={{ height: 56 }}
                >
                  {loading ? 'Searching...' : 'Search'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Paper sx={{ p: 2, maxHeight: 600, overflow: 'auto' }}>
          {searchResults.length > 0 ? (
            searchResults.map((line, index) => formatLogLine(line, index))
          ) : searchQuery.trim() ? (
            <Typography color="text.secondary" align="center">
              No matching log entries found for "{searchQuery}".
            </Typography>
          ) : (
            <Typography color="text.secondary" align="center">
              Enter a search query and click "Search" to find specific log entries.
            </Typography>
          )}
        </Paper>
      </TabPanel>

      {/* System Status Tab */}
      <TabPanel value={tabValue} index={3}>
        <Grid container spacing={3}>
          {/* System Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MemoryIcon /> System Information
                </Typography>
                {systemStatus && (
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Memory Used:</Typography>
                      <Typography>{formatBytes(systemStatus.memoryUsed)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Total Memory:</Typography>
                      <Typography>{formatBytes(systemStatus.memoryTotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Max Memory:</Typography>
                      <Typography>{formatBytes(systemStatus.memoryMax)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>CPU Cores:</Typography>
                      <Typography>{systemStatus.processors}</Typography>
                    </Box>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Log File Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon /> Log File Status
                </Typography>
                {systemStatus && (
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>File Exists:</Typography>
                      <Chip 
                        label={systemStatus.logFileExists ? 'Yes' : 'No'} 
                        color={systemStatus.logFileExists ? 'success' : 'error'} 
                        size="small" 
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>File Size:</Typography>
                      <Typography>{formatBytes(systemStatus.logFileSize)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>Last Modified:</Typography>
                      <Typography>
                        {systemStatus.logFileLastModified 
                          ? new Date(systemStatus.logFileLastModified).toLocaleString()
                          : 'N/A'
                        }
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Error Summary */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon /> Recent Error Summary
                </Typography>
                {systemStatus && (
                  <Grid container spacing={3}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#ffebee' }}>
                        <ErrorIcon sx={{ fontSize: 40, color: '#f44336' }} />
                        <Typography variant="h4" color="#f44336">
                          {systemStatus.recentErrors}
                        </Typography>
                        <Typography variant="body2">Errors</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                        <WarningIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                        <Typography variant="h4" color="#ff9800">
                          {systemStatus.recentWarnings}
                        </Typography>
                        <Typography variant="body2">Warnings</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                )}
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadSystemStatus}
                  sx={{ mt: 2 }}
                >
                  Refresh Status
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
} 