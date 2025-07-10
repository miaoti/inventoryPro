'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { userManagementAPI, itemsAPI } from '../../../services/api';
import { User, UserUpdateRequest, CreateUserRequest, UpdateUsernameRequest } from '../../../types/user';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Alert,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Fab,
  useTheme,
  alpha,
  Fade,
  Zoom,
  Slide,
  LinearProgress,
  CardHeader,
  Avatar,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as OwnerIcon,
  Add as AddIcon,
  AccountBox as UsernameIcon,
  People as PeopleIcon,
  ManageAccounts as ManageIcon,
  Security as SecurityIcon,
  Business as DepartmentIcon,
} from '@mui/icons-material';

export default function UserManagementPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [usernameDialogOpen, setUsernameDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<UserUpdateRequest>({});
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'USER',
    department: '',
    warningThreshold: undefined,
    criticalThreshold: undefined
  });
  const [usernameForm, setUsernameForm] = useState<UpdateUsernameRequest>({ username: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Department management state
  const [departments, setDepartments] = useState<string[]>([]);
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  const [departmentToDelete, setDepartmentToDelete] = useState<string>('');
  const [deleteDepartmentDialogOpen, setDeleteDepartmentDialogOpen] = useState(false);

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
            Access denied. Only owners can manage users.
          </Alert>
        </Fade>
      </Box>
    );
  }

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response: any = await userManagementAPI.getAll();
      const data = response.data || response; // Handle both response structures
      console.log('Fetched users data:', data);
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        console.error('Expected users array but received:', data);
        setUsers([]);
        setSnackbar({ open: true, message: 'Received invalid data format', severity: 'error' });
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      const response: any = await userManagementAPI.create(createForm);
      const responseData = response.data || response; // Handle both response structures
      setSnackbar({ open: true, message: responseData.message || 'User created successfully', severity: 'success' });
      setCreateDialogOpen(false);
      setCreateForm({
        username: '',
        password: '',
        email: '',
        fullName: '',
        role: 'USER',
        department: '',
        warningThreshold: undefined,
        criticalThreshold: undefined
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      const message = error.response?.data?.message || 'Failed to create user';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleEditUser = (userItem: User) => {
    setSelectedUser(userItem);
    setEditForm({
      name: userItem.name,
      email: userItem.email,
      alertEmail: userItem.alertEmail,
      role: userItem.role,
      department: userItem.department || '',
      warningThreshold: userItem.warningThreshold,
      criticalThreshold: userItem.criticalThreshold,
    });
    setEditDialogOpen(true);
  };

  const handleEditUsername = (userItem: User) => {
    setSelectedUser(userItem);
    setUsernameForm({ username: userItem.username });
    setUsernameDialogOpen(true);
  };

  const handleDeleteUser = (userItem: User) => {
    setSelectedUser(userItem);
    setDeleteDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await userManagementAPI.update(selectedUser.id, editForm);
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setEditDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({ open: true, message: 'Failed to update user', severity: 'error' });
    }
  };

  const handleSaveUsername = async () => {
    if (!selectedUser) return;

    try {
      const response: any = await userManagementAPI.updateUsername(selectedUser.id, usernameForm);
      const responseData = response.data || response; // Handle both response structures
      setSnackbar({ open: true, message: responseData.message || 'Username updated successfully', severity: 'success' });
      setUsernameDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating username:', error);
      const message = error.response?.data?.message || 'Failed to update username';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;

    try {
      await userManagementAPI.delete(selectedUser.id);
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const message = error.response?.data?.message || 'Failed to delete user';
      setSnackbar({ open: true, message, severity: 'error' });
    }
  };

  // Department management functions
  const fetchDepartments = async () => {
    try {
      const response = await itemsAPI.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const handleCreateDepartment = async () => {
    if (!newDepartmentName.trim()) {
      setSnackbar({ open: true, message: 'Department name is required', severity: 'error' });
      return;
    }

    try {
      await itemsAPI.createDepartment(newDepartmentName.trim());
      setSnackbar({ open: true, message: `Department "${newDepartmentName.trim()}" created successfully`, severity: 'success' });
      setNewDepartmentName('');
      setDepartmentDialogOpen(false);
      await fetchDepartments();
    } catch (error: any) {
      console.error('Error creating department:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error creating department';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleDeleteDepartment = async () => {
    if (!departmentToDelete) return;

    try {
      const response = await itemsAPI.deleteDepartment(departmentToDelete);
      const result = response.data;
      setSnackbar({ 
        open: true, 
        message: `${result.message} (${result.usersAffected} users and ${result.itemsAffected} items affected)`, 
        severity: 'success' 
      });
      setDeleteDepartmentDialogOpen(false);
      setDepartmentToDelete('');
      await fetchDepartments();
      await fetchUsers(); // Refresh users to show updated departments
    } catch (error: any) {
      console.error('Error deleting department:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error deleting department';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <OwnerIcon color="error" />;
      case 'ADMIN':
        return <AdminIcon color="warning" />;
      default:
        return <PersonIcon color="action" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'error';
      case 'ADMIN':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getUserStats = () => {
    if (!Array.isArray(users)) {
      console.error('Users is not an array in getUserStats:', users);
      return [
        { label: 'Owners', count: 0, color: 'error', icon: <OwnerIcon /> },
        { label: 'Admins', count: 0, color: 'warning', icon: <AdminIcon /> },
        { label: 'Users', count: 0, color: 'primary', icon: <PersonIcon /> },
      ];
    }

    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { label: 'Owners', count: stats.OWNER || 0, color: 'error', icon: <OwnerIcon /> },
      { label: 'Admins', count: stats.ADMIN || 0, color: 'warning', icon: <AdminIcon /> },
      { label: 'Users', count: stats.USER || 0, color: 'primary', icon: <PersonIcon /> },
    ];
  };

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
              Loading users...
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
                <ManageIcon sx={{ fontSize: 32 }} />
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
                  User Management
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Manage users, roles, and department access control
                </Typography>
              </Box>
            </Box>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              flexDirection: { xs: 'column', sm: 'row' },
              width: { xs: '100%', sm: 'auto' }
            }}>
              <Button
                variant="outlined"
                onClick={() => setDepartmentDialogOpen(true)}
                startIcon={<DepartmentIcon />}
                sx={{
                  borderColor: alpha(theme.palette.common.white, 0.3),
                  color: 'white',
                  borderWidth: 2,
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: alpha(theme.palette.common.white, 0.1),
                    borderWidth: 2,
                  }
                }}
              >
                Department Control
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  background: alpha(theme.palette.common.white, 0.15),
                  color: 'white',
                  fontWeight: 600,
                  '&:hover': {
                    background: alpha(theme.palette.common.white, 0.25),
                  }
                }}
              >
                Create User
              </Button>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced User Statistics */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '200ms' }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {getUserStats().map((stat, index) => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Zoom in timeout={600} style={{ transitionDelay: `${400 + index * 200}ms` }}>
                <Card sx={{
                  borderRadius: 3,
                  background: theme => `linear-gradient(135deg, ${alpha((theme.palette as any)[stat.color].main, 0.08)} 0%, ${alpha((theme.palette as any)[stat.color].light, 0.05)} 100%)`,
                  border: theme => `1px solid ${alpha((theme.palette as any)[stat.color].main, 0.2)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme => `0 12px 40px ${alpha((theme.palette as any)[stat.color].main, 0.15)}`,
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{
                        background: theme => `linear-gradient(135deg, ${(theme.palette as any)[stat.color].main} 0%, ${(theme.palette as any)[stat.color].dark} 100%)`,
                        width: 48,
                        height: 48,
                      }}>
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h4" 
                          sx={{ 
                            color: theme => (theme.palette as any)[stat.color].main,
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
                          }}
                        >
                          {stat.label}
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

      {/* Enhanced Users Table */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '600ms' }}>
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
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>User</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Username</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Account Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Alert Email</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Role</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Department</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Alert Thresholds</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Created</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(users) ? (
                users.map((userItem, index) => (
                  <TableRow 
                    key={userItem.id}
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{
                          background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                          width: 32,
                          height: 32,
                        }}>
                          {getRoleIcon(userItem.role)}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {userItem.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={userItem.username} 
                        size="small" 
                        variant="outlined"
                        color="info"
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {userItem.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {userItem.alertEmail || userItem.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={userItem.role}
                        color={getRoleColor(userItem.role) as any}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {userItem.department ? (
                        <Chip
                          label={userItem.department}
                          color="info"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 500 }}
                        />
                      ) : userItem.role === 'OWNER' ? (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          Owner (No department required)
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No department assigned
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          label={`Warning: ${userItem.warningThreshold || 100}%`}
                          size="small"
                          color="warning"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                        />
                        <Chip
                          label={`Critical: ${userItem.criticalThreshold || 50}%`}
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(userItem.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit User">
                          <IconButton
                            onClick={() => handleEditUser(userItem)}
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
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Change Username">
                          <IconButton
                            onClick={() => handleEditUsername(userItem)}
                            size="small"
                            sx={{
                              color: theme.palette.info.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.info.main, 0.1),
                                transform: 'scale(1.1)',
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <UsernameIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton
                            onClick={() => handleDeleteUser(userItem)}
                            size="small"
                            disabled={userItem.id === user?.id}
                            sx={{
                              color: theme.palette.error.main,
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.error.main, 0.1),
                                transform: 'scale(1.1)',
                              },
                              '&:disabled': {
                                color: theme.palette.action.disabled,
                              },
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      {loading ? 'Loading users...' : 'No users available or error occurred'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Slide>

      {/* Enhanced Create User Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        maxWidth="sm" 
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
              <AddIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Create New User
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Username"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Full Name"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              fullWidth
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'ADMIN' | 'USER' })}
                label="Role"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={createForm.department || ''}
                onChange={(e) => {
                  if (e.target.value === '__CREATE_NEW__') {
                    setDepartmentDialogOpen(true);
                  } else {
                    setCreateForm({ ...createForm, department: e.target.value });
                  }
                }}
                label="Department"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">No Department (Public Access)</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
                <MenuItem 
                  value="__CREATE_NEW__" 
                  sx={{ color: 'primary.main', fontStyle: 'italic' }}
                >
                  + Create New Department
                </MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Warning Threshold (%)"
                type="number"
                value={createForm.warningThreshold || ''}
                onChange={(e) => setCreateForm({ ...createForm, warningThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                helperText="Default: 100%"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Critical Threshold (%)"
                type="number"
                value={createForm.criticalThreshold || ''}
                onChange={(e) => setCreateForm({ ...createForm, criticalThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                helperText="Default: 50%"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)} 
        maxWidth="sm" 
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
              <EditIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Edit User
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Email"
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Alert Email"
              type="email"
              value={editForm.alertEmail || ''}
              onChange={(e) => setEditForm({ ...editForm, alertEmail: e.target.value })}
              fullWidth
              helperText="Leave empty to use account email"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role || 'USER'}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'ADMIN' | 'USER' })}
                label="Role"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={editForm.department || ''}
                onChange={(e) => {
                  if (e.target.value === '__CREATE_NEW__') {
                    setDepartmentDialogOpen(true);
                  } else {
                    setEditForm({ ...editForm, department: e.target.value });
                  }
                }}
                label="Department"
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">No Department (Public Access)</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))}
                <MenuItem 
                  value="__CREATE_NEW__" 
                  sx={{ color: 'primary.main', fontStyle: 'italic' }}
                >
                  + Create New Department
                </MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Warning Threshold (%)"
                type="number"
                value={editForm.warningThreshold || ''}
                onChange={(e) => setEditForm({ ...editForm, warningThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                helperText="Default: 100%"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                label="Critical Threshold (%)"
                type="number"
                value={editForm.criticalThreshold || ''}
                onChange={(e) => setEditForm({ ...editForm, criticalThreshold: e.target.value ? parseInt(e.target.value) : undefined })}
                fullWidth
                inputProps={{ min: 0, max: 100 }}
                helperText="Default: 50%"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUser} 
            variant="contained"
            sx={{ 
              borderRadius: 2,
              background: theme => `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Username Dialog */}
      <Dialog 
        open={usernameDialogOpen} 
        onClose={() => setUsernameDialogOpen(false)} 
        maxWidth="sm" 
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
            background: theme => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white',
            margin: theme => theme.spacing(-3, -3, 0, -3),
            padding: theme => theme.spacing(2, 3),
          }}>
            <Avatar sx={{
              background: alpha(theme.palette.common.white, 0.15),
              width: 32,
              height: 32,
            }}>
              <UsernameIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Change Username
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 5, minHeight: 120 }}>
          <TextField
            label="New Username"
            value={usernameForm.username}
            onChange={(e) => setUsernameForm({ username: e.target.value })}
            fullWidth
            autoFocus
            required
            helperText="Enter the new username for this user"
            variant="outlined"
            sx={{ 
              mt: 1,
              '& .MuiOutlinedInput-root': { 
                borderRadius: 2,
                minHeight: 56 
              },
              '& .MuiInputLabel-root': { 
                fontWeight: 500,
                color: 'text.primary',
                fontSize: '1rem'
              },
              '& .MuiFormHelperText-root': {
                marginTop: 1,
                fontSize: '0.875rem'
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setUsernameDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveUsername} 
            variant="contained"
            color="info"
            sx={{ 
              borderRadius: 2,
              background: theme => `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            }}
          >
            Update Username
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)}
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
            background: theme => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            margin: theme => theme.spacing(-3, -3, 0, -3),
            padding: theme => theme.spacing(2, 3),
          }}>
            <Avatar sx={{
              background: alpha(theme.palette.common.white, 0.15),
              width: 32,
              height: 32,
            }}>
              <DeleteIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Confirm Delete
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: 2,
              background: theme => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            }}
          >
            Delete User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Department Management Dialog */}
      <Dialog 
        open={departmentDialogOpen} 
        onClose={() => setDepartmentDialogOpen(false)} 
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
            background: theme => `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            color: 'white',
            margin: theme => theme.spacing(-3, -3, 0, -3),
            padding: theme => theme.spacing(2, 3),
          }}>
            <Avatar sx={{
              background: alpha(theme.palette.common.white, 0.15),
              width: 32,
              height: 32,
            }}>
              <DepartmentIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Department Management
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Create New Department
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Department Name"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <Button 
                variant="contained" 
                onClick={handleCreateDepartment}
                sx={{ 
                  borderRadius: 2,
                  background: theme => `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                  minWidth: 120,
                }}
              >
                Create
              </Button>
            </Box>
          </Box>
          
          <Divider sx={{ my: 3 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Existing Departments
            </Typography>
            <Grid container spacing={2}>
              {departments.map((dept) => (
                <Grid item xs={12} sm={6} md={4} key={dept}>
                  <Card sx={{ 
                    borderRadius: 2,
                    border: theme => `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    '&:hover': {
                      boxShadow: theme => `0 4px 12px ${alpha(theme.palette.secondary.main, 0.15)}`,
                    },
                    transition: 'all 0.2s ease',
                  }}>
                    <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {dept}
                      </Typography>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => {
                          setDepartmentToDelete(dept);
                          setDeleteDepartmentDialogOpen(true);
                        }}
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.1),
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setDepartmentDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Department Dialog */}
      <Dialog 
        open={deleteDepartmentDialogOpen} 
        onClose={() => setDeleteDepartmentDialogOpen(false)}
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
            background: theme => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            color: 'white',
            margin: theme => theme.spacing(-3, -3, 0, -3),
            padding: theme => theme.spacing(2, 3),
          }}>
            <Avatar sx={{
              background: alpha(theme.palette.common.white, 0.15),
              width: 32,
              height: 32,
            }}>
              <DeleteIcon />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Delete Department
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          <Typography>
            Are you sure you want to delete the department <strong>{departmentToDelete}</strong>? 
            This will affect all users and items assigned to this department.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setDeleteDepartmentDialogOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteDepartment} 
            variant="contained" 
            color="error"
            sx={{ 
              borderRadius: 2,
              background: theme => `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${theme.palette.error.dark} 100%)`,
            }}
          >
            Delete Department
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ 
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontWeight: 500,
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 