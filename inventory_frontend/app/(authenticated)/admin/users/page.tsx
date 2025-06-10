'use client';

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import { userManagementAPI } from '../../../services/api';
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
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  AdminPanelSettings as AdminIcon,
  SupervisorAccount as OwnerIcon,
  Add as AddIcon,
  AccountBox as UsernameIcon,
} from '@mui/icons-material';

export default function UserManagementPage() {
  const { user } = useSelector((state: RootState) => state.auth);
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
    role: 'USER'
  });
  const [usernameForm, setUsernameForm] = useState<UpdateUsernameRequest>({ username: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Check if current user is owner
  if (user?.role !== 'OWNER') {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        <Alert severity="error">
          Access denied. Only owners can manage users.
        </Alert>
      </Box>
    );
  }

  useEffect(() => {
    fetchUsers();
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
        role: 'USER'
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
      role: userItem.role,
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
        { label: 'Owners', count: 0, color: 'error' },
        { label: 'Admins', count: 0, color: 'warning' },
        { label: 'Users', count: 0, color: 'primary' },
      ];
    }

    const stats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return [
      { label: 'Owners', count: stats.OWNER || 0, color: 'error' },
      { label: 'Admins', count: stats.ADMIN || 0, color: 'warning' },
      { label: 'Users', count: stats.USER || 0, color: 'primary' },
    ];
  };

  if (loading) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        <Typography>Loading users...</Typography>
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
        User Management
      </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a6fd8, #6a4190)',
            }
          }}
        >
          Create User
        </Button>
      </Box>

      {/* User Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {getUserStats().map((stat) => (
          <Grid item xs={12} sm={4} key={stat.label}>
            <Card>
              <CardContent>
                <Typography variant="h6" color={`${stat.color}.main`}>
                  {stat.count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.isArray(users) ? (
              users.map((userItem) => (
                <TableRow key={userItem.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getRoleIcon(userItem.role)}
                      {userItem.name}
                  </Box>
                </TableCell>
                  <TableCell>{userItem.username}</TableCell>
                  <TableCell>{userItem.email}</TableCell>
                <TableCell>
                  <Chip
                      label={userItem.role}
                      color={getRoleColor(userItem.role) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                    {new Date(userItem.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <IconButton
                      onClick={() => handleEditUser(userItem)}
                    size="small"
                    color="primary"
                      title="Edit User"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                      onClick={() => handleEditUsername(userItem)}
                      size="small"
                      color="info"
                      title="Change Username"
                    >
                      <UsernameIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteUser(userItem)}
                    size="small"
                    color="error"
                      disabled={userItem.id === user?.id}
                      title="Delete User"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="text.secondary">
                    {loading ? 'Loading users...' : 'No users available or error occurred'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Username"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Full Name"
              value={createForm.fullName}
              onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
              fullWidth
              required
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as 'ADMIN' | 'USER' })}
                label="Role"
              >
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateUser} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={editForm.role || ''}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                label="Role"
              >
                <MenuItem value="OWNER">Owner</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
                <MenuItem value="USER">User</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="New Password (optional)"
              type="password"
              value={editForm.password || ''}
              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              fullWidth
              helperText="Leave empty to keep current password"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Username Dialog */}
      <Dialog open={usernameDialogOpen} onClose={() => setUsernameDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Username</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              label="New Username"
              value={usernameForm.username}
              onChange={(e) => setUsernameForm({ username: e.target.value })}
              fullWidth
              required
              helperText="This will change the user's login username"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUsernameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUsername} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user "{selectedUser?.name}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 