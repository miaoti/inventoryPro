'use client';

import { useState, useEffect, useRef } from 'react';
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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  LinearProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  Checkbox,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { itemsAPI } from '../../services/api';

interface Item {
  id: number;
  name: string;
  description?: string;
  englishDescription?: string;
  quantity: number;
  minQuantity: number;
  location: string;
  equipment?: string;
  category: 'A' | 'B' | 'C';
  status?: string;
  estimatedConsumption?: number;
  rack?: string;
  floor?: string;
  area?: string;
  bin?: string;
  weeklyData?: string; // JSON string for dynamic weekly data
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
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openQuantityDialog, setOpenQuantityDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]); // For bulk selection
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false); // For bulk delete loading
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    englishDescription: '',
    code: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
    equipment: '',
    category: 'C' as 'A' | 'B' | 'C',
    status: '',
    estimatedConsumption: 0,
    rack: '',
    floor: '',
    area: '',
    bin: '',
    weeklyData: '', // JSON string for dynamic weekly data
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setSelectedItems([]);
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
          description: item.description || '',
          englishDescription: item.englishDescription || '',
          code: item.code || '',
          quantity: currentInventory,
          minQuantity: item.minQuantity || 0,
          location: item.location || '',
          equipment: item.equipment || '',
          category: item.category || 'C',
          status: item.status || '',
          estimatedConsumption: item.estimatedConsumption || 0,
          rack: item.rack || '',
          floor: item.floor || '',
          area: item.area || '',
          bin: item.bin || '',
          weeklyData: item.weeklyData || '',
          barcode: item.barcode || '',
          currentInventory: currentInventory,
          usedInventory: usedInventory,
          pendingPO: pendingPO,
          availableQuantity: Math.max(0, currentInventory + pendingPO - usedInventory),
        };
        
        return processedItem;
      });
      
      console.log('Fetched and processed items:', processedItems.length);
      console.log('Sample item:', processedItems[0]);
      setItems(processedItems);
      setSelectedItems([]);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]); // Set empty array on error
      setSelectedItems([]); // Clear selections on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: Item) => {
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        englishDescription: item.englishDescription || '',
        code: item.code || '',
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        location: item.location,
        equipment: item.equipment || '',
        category: item.category,
        status: item.status || '',
        estimatedConsumption: item.estimatedConsumption || 0,
        rack: item.rack || '',
        floor: item.floor || '',
        area: item.area || '',
        bin: item.bin || '',
        weeklyData: item.weeklyData || '',
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        description: '',
        englishDescription: '',
        code: '',
        quantity: 0,
        minQuantity: 0,
        location: '',
        equipment: '',
        category: 'C',
        status: '',
        estimatedConsumption: 0,
        rack: '',
        floor: '',
        area: '',
        bin: '',
        weeklyData: '',
      });
    }
    setOpenDialog(true);
  };

  const handleOpenDetailDialog = (item: Item) => {
    setSelectedItem(item);
    setOpenDetailDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedItem(null);
  };

  const handleCloseDetailDialog = () => {
    setOpenDetailDialog(false);
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
        ...formData,
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

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to delete');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete ${selectedItems.length} selected item(s)?`)) {
      try {
        setBulkDeleteLoading(true);
        // Use bulk delete API
        const response = await itemsAPI.bulkDelete(selectedItems);
        console.log('Bulk delete response:', response.data);
        
        setSelectedItems([]);
        fetchItems();
        
        // Show result message
        const { deleted, notFound } = response.data;
        if (notFound > 0) {
          alert(`Successfully deleted ${deleted} items. ${notFound} items were not found.`);
        } else {
          alert(`Successfully deleted ${deleted} items.`);
        }
      } catch (error) {
        console.error('Error deleting items:', error);
        alert('Error deleting some items. Please try again.');
      } finally {
        setBulkDeleteLoading(false);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleItemSelect = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleImportCSV = async () => {
    if (!importFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setImportLoading(true);
      const response = await itemsAPI.importCSV(importFile);
      setImportResult(response.data); // Fix: use response.data instead of response
      fetchItems(); // Refresh items after import
    } catch (error) {
      console.error('Error importing CSV:', error);
      setImportResult({
        message: 'Import failed',
        created: 0,
        skippedDuplicates: 0,
        totalProcessed: 0,
        errors: 1,
        errorDetails: ['Failed to import file. Please check the format and try again.']
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleExportBarcodes = async () => {
    try {
      const response = await itemsAPI.exportBarcodes();
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'all_barcodes.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting barcodes:', error);
      alert('Error exporting barcodes. Please try again.');
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'A': return 'error';
      case 'B': return 'warning';
      case 'C': return 'success';
      default: return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'select',
      headerName: '',
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Checkbox
          checked={selectedItems.includes(params.row.id)}
          onChange={(e) => {
            e.stopPropagation();
            handleItemSelect(params.row.id);
          }}
          onClick={(e) => e.stopPropagation()}
          size="small"
        />
      ),
      renderHeader: () => (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Checkbox
            checked={selectedItems.length > 0 && selectedItems.length === items.length}
            indeterminate={selectedItems.length > 0 && selectedItems.length < items.length}
            onChange={(e) => {
              e.stopPropagation();
              handleSelectAll();
            }}
            onClick={(e) => e.stopPropagation()}
            size="small"
          />
        </Box>
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'code', headerName: 'Code', width: 120 },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 100,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getCategoryColor(params.value) as any}
          size="medium"
        />
      )
    },
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
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => handleOpenDetailDialog(params.row)} size="small" title="View Details">
              <ViewIcon />
            </IconButton>
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

  const parseWeeklyData = (weeklyDataJson: string) => {
    try {
      return weeklyDataJson ? JSON.parse(weeklyDataJson) : {};
    } catch {
      return {};
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Inventory Items</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selectedItems.length > 0 && (
            <Button
              variant="outlined"
              startIcon={bulkDeleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={handleBulkDelete}
              color="error"
              disabled={bulkDeleteLoading}
            >
              {bulkDeleteLoading ? 'Deleting...' : `Delete Selected (${selectedItems.length})`}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchItems}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportBarcodes}
            color="secondary"
          >
            Export Barcodes
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            color="info"
          >
            Import CSV/Excel
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
          getRowId={(row) => row?.id || `temp-${Math.random()}`}
          sx={{
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
          }}
        />
      </Paper>

      {/* Item Detail Dialog - Redesigned */}
      <Dialog open={openDetailDialog} onClose={handleCloseDetailDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Item Details</Typography>
            {selectedItem && (
              <Chip 
                label={`Category ${selectedItem.category}`} 
                color={getCategoryColor(selectedItem.category) as any}
                size="medium"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              {/* Header Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="h4" gutterBottom>{selectedItem.name}</Typography>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        Code: {selectedItem.code}
                      </Typography>
                      {selectedItem.description && (
                        <Typography variant="body1" gutterBottom>
                          <strong>Description:</strong> {selectedItem.description}
                        </Typography>
                      )}
                      {selectedItem.englishDescription && (
                        <Typography variant="body1" gutterBottom>
                          <strong>English Description:</strong> {selectedItem.englishDescription}
                        </Typography>
                      )}
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Box sx={{ textAlign: 'center' }}>
                        <img 
                          src={`http://localhost:8080/api/public/barcode-image/${selectedItem.barcode}`}
                          alt={`Barcode: ${selectedItem.barcode}`}
                          style={{ height: 80, maxWidth: '100%' }}
                        />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {selectedItem.barcode}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Inventory Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📦 Inventory Information
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', borderRadius: 2 }}>
                        <Typography variant="h4" color="white">
                          {selectedItem.currentInventory || selectedItem.quantity || 0}
                        </Typography>
                        <Typography variant="body2" color="white">
                          Current Stock
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
                        <Typography variant="h4" color="white">
                          {selectedItem.minQuantity || 0}
                        </Typography>
                        <Typography variant="body2" color="white">
                          Safety Stock
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={6} md={3}>
                      <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', borderRadius: 2 }}>
                        <Typography variant="h4" color="white">
                          {selectedItem.pendingPO || 0}
                        </Typography>
                        <Typography variant="body2" color="white">
                          Pending PO
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Used Inventory:</strong> {selectedItem.usedInventory || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2">
                        <strong>Estimated Consumption:</strong> {selectedItem.estimatedConsumption || 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ mt: 1 }}>
                        {(selectedItem.availableQuantity || 0) <= selectedItem.minQuantity ? (
                          <Alert severity="error">
                            ⚠️ Low Stock Alert - Needs Restocking
                          </Alert>
                        ) : (selectedItem.availableQuantity || 0) <= (selectedItem.minQuantity * 1.5) ? (
                          <Alert severity="warning">
                            📊 Stock is getting low
                          </Alert>
                        ) : (
                          <Alert severity="success">
                            ✅ Stock levels are healthy
                          </Alert>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Location & Equipment Information */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    📍 Location & Equipment
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Primary Location:</strong> {selectedItem.location || 'Not specified'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Equipment:</strong> {selectedItem.equipment || 'Not specified'}
                      </Typography>
                    </Grid>
                    {(selectedItem.rack || selectedItem.floor || selectedItem.area || selectedItem.bin) && (
                      <>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" gutterBottom>Detailed Location</Typography>
                        </Grid>
                        {selectedItem.rack && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2">
                              <strong>Rack:</strong> {selectedItem.rack}
                            </Typography>
                          </Grid>
                        )}
                        {selectedItem.floor && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2">
                              <strong>Floor:</strong> {selectedItem.floor}
                            </Typography>
                          </Grid>
                        )}
                        {selectedItem.area && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2">
                              <strong>Area:</strong> {selectedItem.area}
                            </Typography>
                          </Grid>
                        )}
                        {selectedItem.bin && (
                          <Grid item xs={6} md={3}>
                            <Typography variant="body2">
                              <strong>Bin:</strong> {selectedItem.bin}
                            </Typography>
                          </Grid>
                        )}
                      </>
                    )}
                  </Grid>
                </CardContent>
              </Card>

              {/* Weekly Data */}
              {selectedItem.weeklyData && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      📊 Weekly Data
                    </Typography>
                    <Grid container spacing={2}>
                      {Object.entries(parseWeeklyData(selectedItem.weeklyData)).map(([week, value]) => (
                        <Grid item xs={6} sm={4} md={2} key={week}>
                          <Box sx={{ textAlign: 'center', p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                            <Typography variant="h6">{value as number}</Typography>
                            <Typography variant="caption">Week {week}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Additional Information */}
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary">
                    ℹ️ Additional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Status:</strong> {selectedItem.status || 'Active'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" gutterBottom>
                        <strong>ABC Category:</strong> {selectedItem.category} 
                        {selectedItem.category === 'A' && ' - High Value'}
                        {selectedItem.category === 'B' && ' - Medium Value'}
                        {selectedItem.category === 'C' && ' - Low Value'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" gutterBottom>
                        <strong>Item ID:</strong> {selectedItem.id}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
          </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetailDialog}>Close</Button>
          <Button onClick={() => {
            handleCloseDetailDialog();
            if (selectedItem) handleOpenQuantityDialog(selectedItem);
          }} variant="outlined" color="success">
            Add Stock
          </Button>
          <Button onClick={() => {
            handleCloseDetailDialog();
            if (selectedItem) handleOpenDialog(selectedItem);
          }} variant="contained">
            Edit Item
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

      {/* Import CSV Dialog */}
      <Dialog open={openImportDialog} onClose={() => setOpenImportDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Import Items from CSV/Excel</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Expected columns:</strong> Part Number, Description, English Description, Location, Equipment, Previous WK Inventory, Current Inventory, Open P On the Way
              </Typography>
              <Typography variant="body2">
                • Part Number will be used as the item code<br/>
                • Rows with empty Description will be skipped<br/>
                • Duplicate items (same Part Number) will be skipped automatically<br/>
                • Supported formats: CSV, XLSX, XLS, XLSM
              </Typography>
            </Alert>

            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />

            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
              sx={{ mb: 2 }}
            >
              Select File
            </Button>

            {importFile && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Selected file: {importFile.name}
              </Alert>
            )}

            {importLoading && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress />
                <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                  Importing items...
                </Typography>
              </Box>
            )}

            {importResult && (
              <Box sx={{ mb: 2 }}>
                <Alert severity={importResult.errors > 0 ? 'warning' : 'success'}>
                  <Typography variant="body2">
                    {importResult.message}<br/>
                    Items created: {importResult.created}
                    {importResult.skippedDuplicates > 0 && (
                      <>
                        <br/>Skipped duplicates: {importResult.skippedDuplicates}
                      </>
                    )}
                    {importResult.totalProcessed && (
                      <>
                        <br/>Total processed: {importResult.totalProcessed}
                      </>
                    )}
                    {importResult.errors > 0 && (
                      <>
                        <br/>Errors: {importResult.errors}
                      </>
                    )}
                  </Typography>
                </Alert>

                {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                  <Box sx={{ mt: 2, maxHeight: 200, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Errors:
                    </Typography>
                    {importResult.errorDetails.map((error: string, index: number) => (
                      <Typography key={index} variant="body2" color="error">
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenImportDialog(false);
            setImportFile(null);
            setImportResult(null);
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleImportCSV} 
            variant="contained"
            disabled={!importFile || importLoading}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Item Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedItem ? 'Edit Item' : 'Add New Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 2 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                placeholder="Enter unique item code (e.g., BOLT001, WIRE-12)"
                helperText="This code will be used to generate the barcode"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="English Description"
                value={formData.englishDescription}
                onChange={(e) => setFormData({ ...formData, englishDescription: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Current Inventory"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Safety Stock"
                type="number"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Equipment"
                value={formData.equipment}
                onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>ABC Category</InputLabel>
                <Select
                  value={formData.category}
                  label="ABC Category"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'A' | 'B' | 'C' })}
                >
                  <MenuItem value="A">A - High Value</MenuItem>
                  <MenuItem value="B">B - Medium Value</MenuItem>
                  <MenuItem value="C">C - Low Value</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Estimated Consumption"
                type="number"
                value={formData.estimatedConsumption}
                onChange={(e) => setFormData({ ...formData, estimatedConsumption: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Rack"
                value={formData.rack}
                onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Area"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Bin"
                value={formData.bin}
                onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Weekly Data (JSON)"
                value={formData.weeklyData}
                onChange={(e) => setFormData({ ...formData, weeklyData: e.target.value })}
                placeholder='{"22": 100, "23": 95, "24": 80}'
                helperText="Enter weekly data as JSON format for dynamic weeks"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {selectedItem ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
