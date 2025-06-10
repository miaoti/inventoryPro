'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Grid,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Tab,
  Tabs,
  CircularProgress,
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Tooltip,
  Badge,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  Computer as ComputerIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  BugReport as BugReportIcon,
  Security as SecurityIcon,
  Timeline as TimelineIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as VisibilityIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { logAPI } from '../../../services/api';

interface LogData {
  lines: string[];
  totalLines: number;
  source: string;
  timestamp: string;
  requestedLines: number;
}

interface SystemStatus {
  jvm: {
    totalMemory: number;
    freeMemory: number;
    usedMemory: number;
    maxMemory: number;
    availableProcessors: number;
  };
  system: {
    javaVersion: string;
    osName: string;
    osVersion: string;
    userTimezone: string;
  };
  application: {
    activeProfiles: string;
    logFile: string;
    logFileExists: boolean;
  };
  timestamp: string;
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LogViewerPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  
  // Check if user is OWNER
  const isOwner = user?.role === 'OWNER';
  
  const [tabValue, setTabValue] = useState(0);
  const [applicationLogs, setApplicationLogs] = useState<LogData | null>(null);
  const [dockerLogs, setDockerLogs] = useState<LogData | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [filteredLogs, setFilteredLogs] = useState<LogData | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filter states
  const [logLines, setLogLines] = useState(100);
  const [logLevel, setLogLevel] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5); // seconds
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && tabValue !== 2) { // Don't auto-refresh system status
      refreshIntervalRef.current = setInterval(() => {
        refreshCurrentTab();
      }, refreshInterval * 1000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, tabValue]);

  // Load initial data
  useEffect(() => {
    if (isOwner) {
      loadApplicationLogs();
      loadSystemStatus();
    }
  }, [isOwner]);

  const refreshCurrentTab = () => {
    switch (tabValue) {
      case 0:
        loadApplicationLogs();
        break;
      case 1:
        loadDockerLogs();
        break;
      case 3:
        loadFilteredLogs();
        break;
    }
  };

  const loadApplicationLogs = async () => {
    try {
      setLoading(true);
      const data = await logAPI.getApplicationLogs(logLines);
      setApplicationLogs(data as LogData);
      setSuccess('Application logs loaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to load application logs: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadDockerLogs = async () => {
    try {
      setLoading(true);
      const data = await logAPI.getDockerLogs(logLines);
      setDockerLogs(data as LogData);
      setSuccess('Docker logs loaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to load docker logs: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      setLoading(true);
      const data = await logAPI.getSystemStatus();
      setSystemStatus(data as SystemStatus);
      setSuccess('System status loaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to load system status: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadFilteredLogs = async () => {
    try {
      setLoading(true);
      const data = await logAPI.getFilteredLogs(
        logLines, 
        logLevel || undefined, 
        searchQuery || undefined
      );
      setFilteredLogs(data as LogData);
      setSuccess('Filtered logs loaded successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to load filtered logs: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const downloadLogs = (logs: LogData, filename: string) => {
    const content = logs.lines.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getLogLevelColor = (line: string) => {
    if (line.includes('ERROR')) return theme.palette.error.main;
    if (line.includes('WARN')) return theme.palette.warning.main;
    if (line.includes('INFO')) return theme.palette.info.main;
    if (line.includes('DEBUG')) return theme.palette.success.main;
    return theme.palette.text.primary;
  };

  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, `<mark style="background-color: ${alpha(theme.palette.warning.main, 0.3)}">$1</mark>`);
  };

  if (!isOwner) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          <Typography variant="h6">Access Denied</Typography>
          <Typography>This page is only accessible to OWNER users. You need OWNER privileges to view system logs.</Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <SecurityIcon color="error" />
        System Log Viewer
        <Chip label="OWNER ONLY" color="error" size="small" />
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Control Panel */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SpeedIcon />
            Control Panel
          </Typography>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                label="Lines"
                type="number"
                value={logLines}
                onChange={(e) => setLogLines(parseInt(e.target.value) || 100)}
                size="small"
                fullWidth
                inputProps={{ min: 10, max: 1000 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Log Level</InputLabel>
                <Select
                  value={logLevel}
                  onChange={(e) => setLogLevel(e.target.value)}
                  label="Log Level"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="ERROR">ERROR</MenuItem>
                  <MenuItem value="WARN">WARN</MenuItem>
                  <MenuItem value="INFO">INFO</MenuItem>
                  <MenuItem value="DEBUG">DEBUG</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                label="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={1}>
              <TextField
                label="Interval (s)"
                type="number"
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
                size="small"
                fullWidth
                disabled={!autoRefresh}
                inputProps={{ min: 1, max: 60 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <Button
                variant="contained"
                onClick={refreshCurrentTab}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BugReportIcon />
                Application Logs
                {applicationLogs && <Badge badgeContent={applicationLogs.totalLines} color="primary" />}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StorageIcon />
                Docker Logs
                {dockerLogs && <Badge badgeContent={dockerLogs.totalLines} color="secondary" />}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssessmentIcon />
                System Status
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterIcon />
                Filtered Logs
                {filteredLogs && <Badge badgeContent={filteredLogs.totalLines} color="success" />}
              </Box>
            } 
          />
        </Tabs>

        {/* Application Logs Tab */}
        <TabPanel value={tabValue} index={0}>
          {applicationLogs && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Application Logs ({applicationLogs.totalLines} lines from {applicationLogs.source})
                </Typography>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadLogs(applicationLogs, 'application')}
                  variant="outlined"
                  size="small"
                >
                  Download
                </Button>
              </Box>
              
              <Paper 
                ref={logContainerRef}
                sx={{ 
                  p: 2, 
                  maxHeight: '600px', 
                  overflow: 'auto', 
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {applicationLogs.lines.map((line, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      color: getLogLevelColor(line),
                      borderLeft: line.includes('ERROR') ? `3px solid ${theme.palette.error.main}` : 
                                 line.includes('WARN') ? `3px solid ${theme.palette.warning.main}` : 'none',
                      paddingLeft: line.includes('ERROR') || line.includes('WARN') ? 1 : 0,
                      marginBottom: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(line, searchQuery) 
                    }}
                  />
                ))}
              </Paper>
            </>
          )}
        </TabPanel>

        {/* Docker Logs Tab */}
        <TabPanel value={tabValue} index={1}>
          {dockerLogs && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Docker Logs ({dockerLogs.totalLines} lines)
                </Typography>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadLogs(dockerLogs, 'docker')}
                  variant="outlined"
                  size="small"
                >
                  Download
                </Button>
              </Box>
              
              <Paper 
                sx={{ 
                  p: 2, 
                  maxHeight: '600px', 
                  overflow: 'auto', 
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {dockerLogs.lines.map((line, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      color: line.includes('[STDERR]') ? theme.palette.error.main : getLogLevelColor(line),
                      borderLeft: line.includes('[STDERR]') ? `3px solid ${theme.palette.error.main}` : 
                                 line.includes('ERROR') ? `3px solid ${theme.palette.error.main}` : 
                                 line.includes('WARN') ? `3px solid ${theme.palette.warning.main}` : 'none',
                      paddingLeft: (line.includes('[STDERR]') || line.includes('ERROR') || line.includes('WARN')) ? 1 : 0,
                      marginBottom: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(line, searchQuery) 
                    }}
                  />
                ))}
              </Paper>
            </>
          )}
        </TabPanel>

        {/* System Status Tab */}
        <TabPanel value={tabValue} index={2}>
          {systemStatus && (
            <Grid container spacing={3}>
              {/* JVM Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MemoryIcon />
                      JVM Memory
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Total Memory" 
                          secondary={formatBytes(systemStatus.jvm.totalMemory)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Used Memory" 
                          secondary={formatBytes(systemStatus.jvm.usedMemory)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Free Memory" 
                          secondary={formatBytes(systemStatus.jvm.freeMemory)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Max Memory" 
                          secondary={formatBytes(systemStatus.jvm.maxMemory)} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="CPU Cores" 
                          secondary={systemStatus.jvm.availableProcessors} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* System Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ComputerIcon />
                      System Info
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="Java Version" 
                          secondary={systemStatus.system.javaVersion} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Operating System" 
                          secondary={`${systemStatus.system.osName} ${systemStatus.system.osVersion}`} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Timezone" 
                          secondary={systemStatus.system.userTimezone} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Active Profiles" 
                          secondary={systemStatus.application.activeProfiles} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Log File" 
                          secondary={
                            <Box>
                              {systemStatus.application.logFile}
                              <Chip 
                                label={systemStatus.application.logFileExists ? "EXISTS" : "NOT FOUND"}
                                color={systemStatus.application.logFileExists ? "success" : "error"}
                                size="small"
                                sx={{ ml: 1 }}
                              />
                            </Box>
                          } 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" align="center">
                  Last updated: {new Date(systemStatus.timestamp).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </TabPanel>

        {/* Filtered Logs Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ mb: 2 }}>
            <Button
              variant="contained"
              onClick={loadFilteredLogs}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <FilterIcon />}
            >
              Apply Filters
            </Button>
          </Box>
          
          {filteredLogs && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Filtered Logs ({filteredLogs.totalLines} lines)
                </Typography>
                <Button
                  startIcon={<DownloadIcon />}
                  onClick={() => downloadLogs(filteredLogs, 'filtered')}
                  variant="outlined"
                  size="small"
                >
                  Download
                </Button>
              </Box>
              
              <Paper 
                sx={{ 
                  p: 2, 
                  maxHeight: '600px', 
                  overflow: 'auto', 
                  backgroundColor: alpha(theme.palette.background.default, 0.5),
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                {filteredLogs.lines.map((line, index) => (
                  <Box 
                    key={index} 
                    sx={{ 
                      color: getLogLevelColor(line),
                      borderLeft: line.includes('ERROR') ? `3px solid ${theme.palette.error.main}` : 
                                 line.includes('WARN') ? `3px solid ${theme.palette.warning.main}` : 'none',
                      paddingLeft: line.includes('ERROR') || line.includes('WARN') ? 1 : 0,
                      marginBottom: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.05)
                      }
                    }}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(line, searchQuery) 
                    }}
                  />
                ))}
              </Paper>
            </>
          )}
        </TabPanel>
      </Card>
    </Box>
  );
} 