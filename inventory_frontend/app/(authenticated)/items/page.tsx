'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Paper,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { itemsAPI } from '../../services/api';

interface Item {
  id: number;
  name: string;
  quantity: number;
  minQuantity: number;
  location: string;
  barcode: string;
  code?: string;
  currentInventory?: number;
  usedInventory?: number;
  pendingPO?: number;
  availableQuantity?: number;
}

export default function ItemsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openQuantityDialog, setOpenQuantityDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  // Refresh data when page becomes visible (after using scanner)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchItems();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll();
      
      // Ensure we have valid data
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response format:', response.data);
        setItems([]);
        return;
      }
      
      // Process items to calculate available quantities
      const processedItems = response.data.map((item: any) => {
        // Ensure all required fields exist with default values
        const currentInventory = item.quantity || 0;
        const usedInventory = item.usedInventory || 0;
        const pendingPO = item.pendingPO || 0;
        
        const processedItem: Item = {
          id: item.id || 0,
          name: item.name || 'Unknown Item',
          code: item.code || '',
          quantity: currentInventory,
          minQuantity: item.minQuantity || 0,
          location: item.location || '',
          barcode: item.barcode || '',
          currentInventory: currentInventory,
          usedInventory: usedInventory,
          pendingPO: pendingPO,
          availableQuantity: Math.max(0, currentInventory + pendingPO - usedInventory),
        };
        
        return processedItem;
      });
      
      console.log('Processed items:', processedItems);
      setItems(processedItems);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        code: item.code || '',
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        location: item.location,
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        code: '',
        quantity: 0,
        minQuantity: 0,
        location: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleOpenQuantityDialog = (item: Item) => {
    setSelectedItem(item);
    setQuantityToAdd(0);
    setOpenQuantityDialog(true);
  };

  const handleCloseQuantityDialog = () => {
    setOpenQuantityDialog(false);
    setSelectedItem(null);
    setQuantityToAdd(0);
  };

  const handleAddQuantity = async () => {
    if (!selectedItem || quantityToAdd <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const newQuantity = selectedItem.quantity + quantityToAdd;
      await itemsAPI.update(selectedItem.id, {
        name: selectedItem.name,
        code: selectedItem.code || '',
        quantity: newQuantity,
        minQuantity: selectedItem.minQuantity,
        location: selectedItem.location,
      });
      
      fetchItems(); // Refresh the items list
      handleCloseQuantityDialog();
    } catch (error) {
      console.error('Error adding quantity:', error);
      alert('Error adding quantity. Please try again.');
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Item name is required');
      return;
    }
    if (!formData.code.trim()) {
      alert('Item code is required');
      return;
    }

    try {
      if (selectedItem) {
        await itemsAPI.update(selectedItem.id, formData);
      } else {
        await itemsAPI.create(formData);
      }
      fetchItems();
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        fetchItems();
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'code', headerName: 'Code', width: 120 },
    { field: 'quantity', headerName: 'Current Inventory', type: 'number', width: 140 },
    { field: 'minQuantity', headerName: 'Min Quantity', type: 'number', width: 120 },
    { field: 'location', headerName: 'Location', flex: 1 },
    { 
      field: 'barcode', 
      headerName: 'Barcode', 
      flex: 1.5,
      renderCell: (params) => {
        if (!params.row || !params.value) return <Typography>No barcode</Typography>;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src={`http://localhost:8080/api/public/barcode-image/${params.value}`}
              alt={`Barcode: ${params.value}`}
              style={{ height: 30, maxWidth: 120 }}
            />
            <Typography variant="caption" color="text.secondary">
              {params.value}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => handleOpenDialog(params.row)} size="small" title="Edit Item">
              <EditIcon />
            </IconButton>
            <IconButton onClick={() => handleOpenQuantityDialog(params.row)} size="small" title="Add Quantity" color="success">
              <InventoryIcon />
            </IconButton>
            <IconButton onClick={() => handleDelete(params.row.id)} size="small" title="Delete Item" color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        );
      },
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Items</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchItems}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      <Paper sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={items || []}
          columns={columns}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          disableRowSelectionOnClick
          getRowId={(row) => row.id || Math.random()}
        />
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedItem ? 'Edit Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
            <TextField
              label="Code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
              placeholder="Enter unique item code (e.g., BOLT001, WIRE-12)"
              helperText="This code will be used to generate the barcode"
            />
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: Number(e.target.value) })
              }
            />
            <TextField
              label="Min Quantity"
              type="number"
              value={formData.minQuantity}
              onChange={(e) =>
                setFormData({ ...formData, minQuantity: Number(e.target.value) })
              }
            />
            <TextField
              label="Location"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Quantity Dialog */}
      <Dialog open={openQuantityDialog} onClose={handleCloseQuantityDialog}>
        <DialogTitle>
          Add Quantity to: {selectedItem?.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, minWidth: 300 }}>
            <Typography variant="body2" color="text.secondary">
              Current Inventory: {selectedItem?.currentInventory || selectedItem?.quantity || 0}
            </Typography>
            {/* <Typography variant="body2" color="text.secondary">
              Available Quantity: {selectedItem?.currentInventory || selectedItem?.quantity || 0}
            </Typography> */}
            <TextField
              label="Quantity to Add"
              type="number"
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 1 }}
              fullWidth
              autoFocus
            />
            <Typography variant="body2" color="text.secondary">
              New Inventory Total: {(selectedItem?.currentInventory || selectedItem?.quantity || 0) + quantityToAdd}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuantityDialog}>Cancel</Button>
          <Button onClick={handleAddQuantity} variant="contained" color="success">
            Add Quantity
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 