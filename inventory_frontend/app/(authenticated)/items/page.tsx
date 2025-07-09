'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
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
  InputAdornment,
  Menu,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  CardActions,
  Pagination,
  Stack,
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
  Close as CloseIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  LocalShipping as ReceiveIcon,
  LocalShipping as LocalShippingIcon,
  MoreVert as MoreVertIcon,
  QrCode as QrCodeIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { itemsAPI, purchaseOrderAPI } from '../../services/api';
import { PurchaseOrder } from '../../types/purchaseOrder';
// import { TrackingDisplay } from '../../../components/TrackingDisplay';

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
  department?: string; // Department assignment (empty = Public)
  displayDepartment?: string; // "Public" or department name for display
  weeklyData?: string; // JSON string for dynamic weekly data
  barcode: string;
  qrCodeId?: string;
  qrCodeData?: string; // Base64 encoded QR code image
  qrCodeUrl?: string; // URL that the QR code points to
  code?: string;
  currentInventory?: number;
  usedInventory?: number;
  pendingPO?: number;
  availableQuantity?: number;
  estimatedConsumption?: number;
}

interface ImportResult {
  message: string;
  totalProcessed: number;
  created: number;
  skippedDuplicates: number;
  errors: number;
  errorDetails: string[];
  items: Item[];
}

export default function ItemsPage() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // API URL configuration
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  
  // Authentication check
  const { isAuthenticated, user, token } = useSelector((state: RootState) => state.auth);
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openQuantityDialog, setOpenQuantityDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]); // For bulk selection
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false); // For bulk delete loading
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuItem, setActionMenuItem] = useState<Item | null>(null);
  
  // Mobile pagination state
  const [mobilePage, setMobilePage] = useState(0);
  const [mobilePageSize, setMobilePageSize] = useState(10);
  
  // PO-related state
  const [showPODialog, setShowPODialog] = useState(false);
  const [showCreatePODialog, setShowCreatePODialog] = useState(false);
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [newPOQuantity, setNewPOQuantity] = useState(0);
  const [newPOTrackingNumber, setNewPOTrackingNumber] = useState('');
  
  // PO editing state
  const [showEditPODialog, setShowEditPODialog] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [editPOQuantity, setEditPOQuantity] = useState(0);
  const [editPOTrackingNumber, setEditPOTrackingNumber] = useState('');
  const [editPOOrderDate, setEditPOOrderDate] = useState('');
  
  // QR code regeneration state
  const [regeneratingQR, setRegeneratingQR] = useState(false);
  
  // Department filtering state
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  
  // Department creation state
  const [showCreateDepartmentDialog, setShowCreateDepartmentDialog] = useState(false);
  const [newDepartmentName, setNewDepartmentName] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    englishDescription: '',
    code: '',
    quantity: 0,
    minQuantity: 0,
    pendingPO: 0,
    location: '',
    equipment: '',
    category: 'C' as 'A' | 'B' | 'C',
    department: '', // Department assignment (empty = Public)
    weeklyData: '', // JSON string for dynamic weekly data
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // State for number inputs to allow temporary empty states
  const [quantityToAddInput, setQuantityToAddInput] = useState('0');
  const [newPOQuantityInput, setNewPOQuantityInput] = useState('0');
  const [editPOQuantityInput, setEditPOQuantityInput] = useState('0');

  // Helper function for better number input handling
  const handleNumberInputChange = (value: string, setter: (val: number) => void, inputSetter: (val: string) => void, min: number = 0) => {
    // Allow empty string or partial numbers during typing
    inputSetter(value);
    
    // Only parse and validate if it's a complete number
    if (value === '') {
      setter(min);
    } else {
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        setter(Math.max(min, parsed));
      }
    }
  };

  // Authentication guard - check immediately
  useEffect(() => {
    const checkAuth = () => {
      // Check for token in cookie as fallback
      const cookieToken = document.cookie.split(';').find(c => c.trim().startsWith('token='));
      const hasToken = !!(token || cookieToken);
      
      if (!isAuthenticated || !hasToken) {
        // Redirect immediately without fetching any data
        router.push('/login');
        return;
      }
      
      // Only fetch data if authenticated
      fetchDepartments();
      fetchItems();
    };

    checkAuth();
  }, [isAuthenticated, token, router]);

  // Separate effect for department filtering
  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [selectedDepartment]);

  // Smart search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredItems(items);
    } else {
      const searchResults = performSmartSearch(items, searchQuery);
      setFilteredItems(searchResults);
    }
    // Reset mobile pagination when search changes
    setMobilePage(0);
  }, [items, searchQuery]);

  // Refresh data when page becomes visible (after using scanner)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && (token || document.cookie.includes('token='))) {
        fetchItems();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, token]);

  // Smart search algorithm
  const performSmartSearch = (itemsList: Item[], query: string): Item[] => {
    if (!query.trim()) return itemsList;

    const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 0);
    
    const searchResults = itemsList.map(item => {
      const searchableText = [
        item.name || '',
        item.description || '',
        item.englishDescription || '',
        item.code || '',
        item.location || '',
        item.equipment || '',
        item.barcode || '',
      ].join(' ').toLowerCase();

      let score = 0;
      let exactMatches = 0;
      let partialMatches = 0;

      queryWords.forEach(word => {
        // Exact word match (highest priority)
        if (searchableText.includes(` ${word} `) || searchableText.startsWith(`${word} `) || searchableText.endsWith(` ${word}`) || searchableText === word) {
          score += 100;
          exactMatches++;
        }
        // Partial word match (medium priority)
        else if (searchableText.includes(word)) {
          score += 50;
          partialMatches++;
        }
        // Fuzzy match for single character differences (low priority)
        else {
          const words = searchableText.split(' ');
          for (const textWord of words) {
            if (calculateLevenshteinDistance(word, textWord) <= 1 && Math.min(word.length, textWord.length) > 2) {
              score += 20;
              partialMatches++;
              break;
            }
          }
        }
      });

      // Bonus for exact name matches
      if (item.name?.toLowerCase().includes(query.toLowerCase())) {
        score += 200;
      }

      // Bonus for code matches
      if (item.code?.toLowerCase().includes(query.toLowerCase())) {
        score += 150;
      }

      return { item, score, exactMatches, partialMatches };
    });

    // Filter out items with no matches and sort by score
    return searchResults
      .filter(result => result.score > 0)
      .sort((a, b) => {
        // First by exact matches, then by score, then by name
        if (a.exactMatches !== b.exactMatches) {
          return b.exactMatches - a.exactMatches;
        }
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        return (a.item.name || '').localeCompare(b.item.name || '');
      })
      .map(result => result.item);
  };

  // Calculate Levenshtein distance for fuzzy matching
  const calculateLevenshteinDistance = (str1: string, str2: string): number => {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  };

  const fetchDepartments = async () => {
    try {
      const response = await itemsAPI.getDepartments();
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      setDepartments([]);
    }
  };

  const createDepartment = async () => {
    if (!newDepartmentName.trim()) {
      alert('Department name is required');
      return;
    }

    try {
      const departmentName = newDepartmentName.trim();
      await itemsAPI.createDepartment(departmentName);
      setNewDepartmentName('');
      setShowCreateDepartmentDialog(false);
      await fetchDepartments(); // Refresh departments list
      
      // Set the newly created department as selected in form
      setFormData({ ...formData, department: departmentName });
      
      alert(`Department "${departmentName}" created successfully!`);
    } catch (error: any) {
      console.error('Error creating department:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error creating department';
      alert(errorMessage);
    }
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll(selectedDepartment || undefined);
      const itemsData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      
      console.log('🔍 DEBUG: Fetched items data:', itemsData.length, 'items');
      
      // Log first few items to check QR code data
      if (itemsData.length > 0) {
        console.log('🔍 DEBUG: First item data:', itemsData[0]);
        const itemsWithQR = itemsData.filter((item: any) => item.qrCodeData);
        const itemsWithoutQR = itemsData.filter((item: any) => !item.qrCodeData);
        console.log('🔍 DEBUG: Items with QR codes:', itemsWithQR.length);
        console.log('🔍 DEBUG: Items without QR codes:', itemsWithoutQR.length);
        
        if (itemsWithQR.length > 0) {
          console.log('🔍 DEBUG: Sample QR code data length:', itemsWithQR[0].qrCodeData?.length);
        }
      }
      
      setItems(itemsData);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
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
        department: item.department || '',
        weeklyData: item.weeklyData || '',
        pendingPO: item.pendingPO || 0,
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
        department: '',
        weeklyData: '',
        pendingPO: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleOpenDetailDialog = (item: Item) => {
    console.log('🔍 DEBUG: Opening detail dialog for item:', item.name);
    console.log('🔍 DEBUG: Item QR code data:', {
      qrCodeId: item.qrCodeId,
      qrCodeData: item.qrCodeData ? `${item.qrCodeData.substring(0, 50)}...` : 'null',
      qrCodeUrl: item.qrCodeUrl,
      hasQRCode: !!item.qrCodeData
    });
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
    setQuantityToAddInput('0');
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

  const handleReceivePO = async (item: Item) => {
    if (!item.pendingPO || item.pendingPO <= 0) {
      alert('No pending PO to receive for this item');
      return;
    }

    if (window.confirm(`Receive ${item.pendingPO} units from PO for ${item.name}? This will add to current inventory and reset PO to 0.`)) {
      try {
        const newQuantity = item.quantity + item.pendingPO;
        await itemsAPI.update(item.id, {
          name: item.name,
          description: item.description || '',
          englishDescription: item.englishDescription || '',
          code: item.code || '',
          quantity: newQuantity,
          minQuantity: item.minQuantity,
          pendingPO: 0, // Reset PO to 0
          location: item.location,
          equipment: item.equipment || '',
          category: item.category,
          weeklyData: item.weeklyData || '',
        });
        
        fetchItems(); // Refresh the items list
        alert(`Successfully received ${item.pendingPO} units from PO`);
      } catch (error) {
        console.error('Error receiving PO:', error);
        alert('Error receiving PO. Please try again.');
      }
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

    // Validate file type
    const allowedTypes = ['.csv', '.xlsx', '.xls', '.xlsm'];
    const fileExtension = '.' + importFile.name.split('.').pop()?.toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      setImportResult({
        message: 'Invalid file type',
        totalProcessed: 0,
        created: 0,
        skippedDuplicates: 0,
        errors: 1,
        errorDetails: [`Unsupported file type: ${fileExtension}. Please upload a CSV, XLSX, XLS, or XLSM file.`],
        items: [],
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (importFile.size > maxSize) {
      setImportResult({
        message: 'File too large',
        totalProcessed: 0,
        created: 0,
        skippedDuplicates: 0,
        errors: 1,
        errorDetails: [`File size (${Math.round(importFile.size / 1024 / 1024)}MB) exceeds the maximum limit of 10MB.`],
        items: [],
      });
      return;
    }

    try {
      setImportLoading(true);
      setImportResult(null); // Clear previous results
      const response = await itemsAPI.importCSV(importFile);
      setImportResult(response.data);
      fetchItems(); // Refresh items after import
    } catch (error: any) {
      console.error('Error importing CSV:', error);
      
      let errorMessage = 'Failed to import file. Please check the format and try again.';
      let errorDetails = [errorMessage];
      
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
          errorDetails = [errorMessage];
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
          errorDetails = error.response.data.errorDetails || [errorMessage];
        }
      } else if (error.message) {
        errorMessage = error.message;
        errorDetails = [errorMessage];
      }
      
      setImportResult({
        message: errorMessage,
        totalProcessed: 0,
        created: 0,
        skippedDuplicates: 0,
        errors: 1,
        errorDetails: errorDetails,
        items: [],
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setImportFile(file);
    setImportResult(null); // Clear previous import results when selecting a new file
  };

  const handleCloseImportDialog = () => {
    setOpenImportDialog(false);
    setImportFile(null);
    setImportResult(null);
    setImportLoading(false);
  };

  const handleExportBarcodes = async () => {
    try {
      const response = await itemsAPI.exportBarcodes();
      
      // Create a download link
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

  const handleRegenerateQRCodes = async () => {
    if (!window.confirm('Generate QR codes for items that are missing them? This process may take a few moments.')) {
      return;
    }

    try {
      setRegeneratingQR(true);
      const response = await itemsAPI.regenerateQRCodes();
      const result = (response as any)?.data || response;
      
      alert(`QR code regeneration completed!\n\nProcessed: ${result.totalProcessed} items\nSuccessful: ${result.successful}\nErrors: ${result.errors}`);
      
      // Refresh the items list to show the new QR codes
      fetchItems();
    } catch (error) {
      console.error('Error regenerating QR codes:', error);
      alert('Error regenerating QR codes. Please try again.');
    } finally {
      setRegeneratingQR(false);
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
    { field: 'name', headerName: 'Name', flex: 1.5 },
    { field: 'code', headerName: 'Code', width: 100 },
    { 
      field: 'category', 
      headerName: 'Category', 
      width: 90,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={getCategoryColor(params.value) as any}
          size="small"
        />
      )
    },
    { field: 'quantity', headerName: 'Current', type: 'number', width: 90 },
    { field: 'pendingPO', headerName: 'PO', type: 'number', width: 70 },
    { field: 'minQuantity', headerName: 'Min', type: 'number', width: 70 },
    { field: 'location', headerName: 'Location', flex: 1 },
    { 
      field: 'barcode', 
      headerName: 'Barcode', 
      flex: 1.2,
      renderCell: (params) => {
        if (!params.row || !params.value) return <Typography variant="caption" color="text.secondary">No barcode</Typography>;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img 
              src={`${API_URL}/public/barcode-image/${params.value}`}
              alt={`Barcode: ${params.value}`}
              style={{ height: 24, maxWidth: 100 }}
            />
            <Typography variant="caption" color="text.secondary" noWrap>
              {params.value}
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {/* Primary Action - View Details */}
            <IconButton 
              onClick={(e) => {
                e.stopPropagation();
                handleOpenDetailDialog(params.row);
              }} 
              size="small" 
              title="View Details"
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.light', color: 'white' }
              }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>

            {/* Quick Action - Receive PO (only if available) */}
            {/* {params.row.pendingPO > 0 && (
              <IconButton 
                onClick={(e) => {
                  e.stopPropagation();
                  handleReceivePO(params.row);
                }} 
                size="small" 
                title={`Receive ${params.row.pendingPO} units from PO`}
                sx={{ 
                  color: 'info.main',
                  '&:hover': { bgcolor: 'info.light', color: 'white' }
                }}
              >
                <ReceiveIcon fontSize="small" />
              </IconButton>
            )} */}

            {/* More Actions Menu */}
            <IconButton
              onClick={(e) => handleActionMenuOpen(e, params.row)}
              size="small"
              title="More actions"
              sx={{ 
                color: 'text.secondary',
                '&:hover': { bgcolor: 'grey.200' }
              }}
            >
              <MoreVertIcon fontSize="small" />
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

  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, item: Item) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setActionMenuItem(item);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setActionMenuItem(null);
  };

  const handleMenuAction = (action: string) => {
    if (!actionMenuItem) return;
    
    handleActionMenuClose();
    
    switch (action) {
      case 'view':
        handleOpenDetailDialog(actionMenuItem);
        break;
      case 'edit':
        handleOpenDialog(actionMenuItem);
        break;
      case 'addQuantity':
        handleOpenQuantityDialog(actionMenuItem);
        break;
      case 'receivePO':
        handleReceivePO(actionMenuItem);
        break;
      case 'managePO':
        handleOpenPODialog(actionMenuItem);
        break;
      case 'createPO':
        handleOpenCreatePODialog(actionMenuItem);
        break;
      case 'delete':
        handleDelete(actionMenuItem.id);
        break;
    }
  };

  // PO-related functions
  const fetchPendingPOs = async (itemId: number) => {
    try {
      const response = await purchaseOrderAPI.getPendingByItem(itemId);
      const responseData = (response as any)?.data || response || [];
      setPendingPOs(Array.isArray(responseData) ? responseData : []);
    } catch (error) {
      console.error('Error fetching pending POs:', error);
      setPendingPOs([]);
    }
  };

  const handleOpenPODialog = async (item: Item) => {
    setSelectedItem(item);
    await fetchPendingPOs(item.id);
    setShowPODialog(true);
  };

  const handleOpenCreatePODialog = (item: Item) => {
    setSelectedItem(item);
    setNewPOQuantity(0);
    setNewPOQuantityInput('0');
    setNewPOTrackingNumber('');
    setShowCreatePODialog(true);
  };

  const createPurchaseOrder = async () => {
    if (!selectedItem || newPOQuantity <= 0) {
      alert('Please enter a valid PO quantity');
      return;
    }

    try {
      await purchaseOrderAPI.create({
        itemId: selectedItem.id,
        quantity: newPOQuantity,
        trackingNumber: newPOTrackingNumber || undefined,
      });

      alert(`Created Purchase Order for ${newPOQuantity} units of ${selectedItem.name}`);
      
      // Refresh items list
      fetchItems();
      
      setNewPOQuantity(0);
      setNewPOTrackingNumber('');
      setShowCreatePODialog(false);
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create Purchase Order. Please try again.');
    }
  };

  const markPOAsArrived = async (purchaseOrderId: number) => {
    try {
      await purchaseOrderAPI.markAsArrived(purchaseOrderId);
      
      alert('Purchase Order marked as arrived successfully');
      
      // Refresh items list and pending POs
      fetchItems();
      if (selectedItem) {
        await fetchPendingPOs(selectedItem.id);
      }
    } catch (error) {
      console.error('Error marking PO as arrived:', error);
      alert('Failed to mark Purchase Order as arrived. Please try again.');
    }
  };

  const handleEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setEditPOQuantity(po.quantity);
    setEditPOQuantityInput(po.quantity.toString());
    setEditPOTrackingNumber(po.trackingNumber || '');
    setEditPOOrderDate(po.orderDate.split('T')[0]); // Format for date input
    setShowEditPODialog(true);
  };

  const updatePurchaseOrder = async () => {
    if (!editingPO || !selectedItem) return;

    try {
      await purchaseOrderAPI.update(selectedItem.id, editingPO.id, {
          quantity: editPOQuantity,
          trackingNumber: editPOTrackingNumber,
        orderDate: editPOOrderDate ? `${editPOOrderDate}T00:00:00` : undefined,
      });

        alert('Purchase order updated successfully!');
        setShowEditPODialog(false);
        setEditingPO(null);
        // Reset form
        setEditPOQuantity(0);
        setEditPOTrackingNumber('');
        setEditPOOrderDate('');
        // Refresh data
        fetchItems();
        if (selectedItem) {
          await fetchPendingPOs(selectedItem.id);
      }
    } catch (error) {
      console.error('Error updating purchase order:', error);
      alert('Failed to update purchase order');
    }
  };

  // Authentication guard UI
  if (!isAuthenticated || (!token && !document.cookie.includes('token='))) {
    return (
      <Box sx={{ 
        p: { xs: 1, sm: 2, md: 3 }, 
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '50vh'
      }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            You must be logged in to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Redirecting to login...
          </Typography>
        </Paper>
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
      <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Typography variant="h4">Inventory Items</Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          flexWrap: 'wrap',
          justifyContent: isMobile ? 'center' : 'flex-end'
        }}>
          {selectedItems.length > 0 && (
            <Button
              variant="outlined"
              startIcon={bulkDeleteLoading ? <CircularProgress size={20} /> : <DeleteIcon />}
              onClick={handleBulkDelete}
              color="error"
              disabled={bulkDeleteLoading}
              size={isMobile ? 'small' : 'medium'}
            >
              {bulkDeleteLoading ? 'Deleting...' : `Delete (${selectedItems.length})`}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchItems}
            disabled={loading}
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? 'Refresh' : 'Refresh'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportBarcodes}
            color="secondary"
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? 'Export' : 'Export Barcodes'}
          </Button>
          <Button
            variant="outlined"
            startIcon={regeneratingQR ? <CircularProgress size={20} /> : <QrCodeIcon />}
            onClick={handleRegenerateQRCodes}
            color="info"
            disabled={regeneratingQR}
            size={isMobile ? 'small' : 'medium'}
          >
            {regeneratingQR ? 'Generating...' : (isMobile ? 'QR Codes' : 'Generate QR Codes')}
          </Button>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => setOpenImportDialog(true)}
            color="info"
            size={isMobile ? 'small' : 'medium'}
          >
            {isMobile ? 'Import' : 'Import CSV/Excel'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size={isMobile ? 'small' : 'medium'}
          >
            Add Item
          </Button>
        </Box>
      </Box>

      {/* Smart Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search items by name, code, description, location, equipment... (e.g., 'white belt', 'belt', 'B001')"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton onClick={clearSearch} size="small" edge="end">
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'background.paper',
            },
          }}
        />
        {searchQuery && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Found {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </Typography>
        )}
      </Box>

      {/* Responsive Layout */}
      {isMobile ? (
        /* Mobile Card Layout */
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredItems.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No items found
              </Typography>
            </Paper>
          ) : (
            <>
              {/* Mobile Items Display */}
              {filteredItems
                .slice(mobilePage * mobilePageSize, (mobilePage + 1) * mobilePageSize)
                .map((item) => (
              <Card key={item.id} sx={{ position: 'relative' }}>
                <CardContent>
                  {/* Selection Checkbox */}
                  <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleItemSelect(item.id);
                      }}
                      size="small"
                    />
                  </Box>

                  {/* Main Content */}
                  <Box sx={{ ml: 5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Code: {item.code || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Location: {item.location || 'N/A'}
                        </Typography>
                      </Box>
                      <Chip 
                        label={item.category} 
                        color={getCategoryColor(item.category) as any}
                        size="small"
                      />
                    </Box>

                    {/* Inventory Info */}
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography variant="h6" color="primary">
                          {item.quantity || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Current
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color={item.pendingPO && item.pendingPO > 0 ? "warning" : "inherit"}
                          onClick={() => handleOpenPODialog(item)}
                          sx={{ 
                            minWidth: 60,
                            flexDirection: 'column',
                            height: 'auto',
                            py: 0.5,
                            px: 1
                          }}
                        >
                          <Typography variant="h6" component="span">
                            {item.pendingPO || 0}
                          </Typography>
                          <Typography variant="caption" component="span">
                            Manage PO
                          </Typography>
                        </Button>
                      </Box>
                      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
                        <Typography variant="h6" color="error.main">
                          {item.minQuantity || 0}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Min
                        </Typography>
                      </Box>
                    </Box>

                    {/* Barcode */}
                    {item.barcode && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <img 
                          src={`${API_URL}/public/barcode-image/${item.barcode}`}
                          alt={`Barcode: ${item.barcode}`}
                          style={{ height: 20, maxWidth: 80 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {item.barcode}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => handleOpenDetailDialog(item)}
                  >
                    View
                  </Button>
                  <IconButton
                    onClick={(e) => handleActionMenuOpen(e, item)}
                    size="small"
                  >
                    <MoreVertIcon />
                  </IconButton>
                </CardActions>
              </Card>
                ))}
              
              {/* Mobile Pagination */}
              {filteredItems.length > mobilePageSize && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Stack spacing={2} alignItems="center">
                    <Pagination
                      count={Math.ceil(filteredItems.length / mobilePageSize)}
                      page={mobilePage + 1}
                      onChange={(event, value) => setMobilePage(value - 1)}
                      color="primary"
                      size="large"
                      showFirstButton 
                      showLastButton
                    />
                    <Typography variant="body2" color="text.secondary">
                      Showing {(mobilePage * mobilePageSize) + 1}-{Math.min((mobilePage + 1) * mobilePageSize, filteredItems.length)} of {filteredItems.length} items
                    </Typography>
                  </Stack>
                </Box>
              )}
            </>
          )}
        </Box>
      ) : (
        /* Desktop Table Layout */
        <Paper sx={{ 
          height: 600, 
          width: '100%',
          overflow: 'hidden'
        }}>
          <DataGrid
            rows={filteredItems || []}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            pagination
            disableRowSelectionOnClick
            getRowId={(row) => row?.id || `temp-${Math.random()}`}
            sx={{
              width: '100%',
              '& .MuiDataGrid-root': {
                minWidth: 0,
              },
              '& .MuiDataGrid-columnHeaders': {
                minWidth: 0,
              },
              '& .MuiDataGrid-virtualScroller': {
                minWidth: 0,
              },
              '& .MuiDataGrid-row': {
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
                minWidth: 0,
              },
              '& .MuiDataGrid-footerContainer': {
                minHeight: 52,
                justifyContent: 'center'
              }
            }}
          />
        </Paper>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1,
            minWidth: 180,
            '& .MuiMenuItem-root': {
              px: 2,
              py: 1,
              borderRadius: 0.5,
              mx: 0.5,
              my: 0.25,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleMenuAction('edit')}>
          <ListItemIcon>
            <EditIcon fontSize="small" color="primary" />
          </ListItemIcon>
          <ListItemText primary="Edit Item" />
        </MenuItem>
        
        <MenuItem onClick={() => handleMenuAction('addQuantity')}>
          <ListItemIcon>
            <InventoryIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText primary="Add Quantity" />
        </MenuItem>

        <Divider sx={{ my: 0.5 }} />

        <MenuItem onClick={() => handleMenuAction('createPO')}>
          <ListItemIcon>
            <AddIcon fontSize="small" color="info" />
          </ListItemIcon>
          <ListItemText primary="Create Purchase Order" />
        </MenuItem>

          <MenuItem onClick={() => handleMenuAction('managePO')}>
            <ListItemIcon>
            <LocalShippingIcon fontSize="small" color={actionMenuItem && actionMenuItem.pendingPO && actionMenuItem.pendingPO > 0 ? "warning" : "action"} />
            </ListItemIcon>
          <ListItemText primary={
            actionMenuItem && actionMenuItem.pendingPO && actionMenuItem.pendingPO > 0 
              ? `Manage POs (${actionMenuItem.pendingPO})` 
              : "Manage POs"
          } />
          </MenuItem>
        
        <Divider sx={{ my: 0.5 }} />
        
        <MenuItem 
          onClick={() => handleMenuAction('delete')}
          sx={{ 
            color: 'error.main',
            '&:hover': { 
              bgcolor: 'error.light',
              color: 'error.contrastText'
            }
          }}
        >
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primary="Delete Item" />
        </MenuItem>
      </Menu>

      {/* Item Detail Dialog - Redesigned */}
      <Dialog 
        open={openDetailDialog} 
        onClose={handleCloseDetailDialog} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
      >
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
                        {/* Barcode Display */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            📊 Barcode
                          </Typography>
                          <img 
                            src={`${API_URL}/public/barcode-image/${selectedItem.barcode}`}
                            alt={`Barcode: ${selectedItem.barcode}`}
                            style={{ height: 60, maxWidth: '100%' }}
                          />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {selectedItem.barcode}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* QR Code Section */}
              {selectedItem.qrCodeData && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <QrCodeIcon />
                      📱 Mobile QR Code for Usage Recording
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                      Scan this QR code with any mobile device to quickly record item usage without logging into the system.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <Paper
                        elevation={4}
                        sx={{
                          display: 'inline-flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          p: 3,
                          bgcolor: 'white',
                          borderRadius: 3,
                          border: '3px solid',
                          borderColor: 'primary.main',
                          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                          maxWidth: 300
                        }}
                      >
                        <Box
                          sx={{
                            p: 2,
                            bgcolor: 'white',
                            borderRadius: 2,
                            border: '2px solid #e0e0e0',
                            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.08)',
                            mb: 2
                          }}
                        >
                          <img 
                            src={`data:image/png;base64,${selectedItem.qrCodeData}`}
                            alt="QR Code for mobile usage recording"
                            style={{ 
                              width: 180, 
                              height: 180, 
                              display: 'block',
                              borderRadius: '8px'
                            }}
                          />
                        </Box>
                        
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary" gutterBottom sx={{ fontWeight: 600 }}>
                            📱 Scan to Record Usage
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                            Open camera app on any smartphone<br />
                            and point at this QR code
                          </Typography>
                        </Box>
                      </Paper>
                    </Box>

                    {selectedItem.qrCodeUrl && (
                      <Box sx={{ 
                        display: 'flex', 
                        gap: 2, 
                        justifyContent: 'center', 
                        flexWrap: 'wrap',
                        mt: 2
                      }}>
                        <Button
                          variant="outlined"
                          startIcon={<ShareIcon />}
                          onClick={() => {
                            if (selectedItem.qrCodeUrl) {
                              navigator.clipboard.writeText(selectedItem.qrCodeUrl);
                              alert('QR code URL copied to clipboard!');
                            }
                          }}
                          sx={{ 
                            borderRadius: 3,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 3,
                            py: 1
                          }}
                        >
                          Copy Usage URL
                        </Button>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => {
                            if (selectedItem.qrCodeUrl) {
                              window.open(selectedItem.qrCodeUrl, '_blank');
                            }
                          }}
                          sx={{ 
                            textTransform: 'none',
                            color: 'text.secondary'
                          }}
                        >
                          Open Usage Page
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {!selectedItem.qrCodeData && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <QrCodeIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        QR Code Not Available
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        QR codes are generated automatically for new items.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Use the "Generate QR Codes" button in the items list to create QR codes for existing items.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}

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
            if (selectedItem) handleOpenCreatePODialog(selectedItem);
          }} variant="outlined" color="info">
            Create PO
          </Button>
          <Button onClick={() => {
            handleCloseDetailDialog();
            if (selectedItem) handleOpenPODialog(selectedItem);
          }} variant="outlined" color={selectedItem && selectedItem.pendingPO && selectedItem.pendingPO > 0 ? "warning" : "inherit"}>
            Manage POs{selectedItem && selectedItem.pendingPO && selectedItem.pendingPO > 0 ? ` (${selectedItem.pendingPO})` : ' (0)'}
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
              value={quantityToAddInput}
              onChange={(e) => handleNumberInputChange(e.target.value, setQuantityToAdd, setQuantityToAddInput, 1)}
              onBlur={(e) => {
                // Ensure minimum value on blur
                const value = parseInt(e.target.value) || 1;
                setQuantityToAdd(Math.max(1, value));
                setQuantityToAddInput(Math.max(1, value).toString());
              }}
              inputProps={{ min: 1 }}
              fullWidth
              autoFocus
              placeholder="Enter quantity to add"
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
      <Dialog open={openImportDialog} onClose={handleCloseImportDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Import Items from CSV/Excel
          <IconButton 
            onClick={handleCloseImportDialog}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
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
                • Status, Total Consumption, Rack, Floor, Area, and Bin columns are ignored<br/>
                • Supported formats: CSV, XLSX, XLS, XLSM
              </Typography>
            </Alert>

            <input
              type="file"
              accept=".csv,.xlsx,.xls,.xlsm"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
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
                <br />
                <Typography variant="caption" color="text.secondary">
                  Size: {(importFile.size / 1024).toFixed(1)} KB • Type: {importFile.type || 'Unknown'}
                </Typography>
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
                {/* Main Result Summary */}
                <Alert severity={importResult.errors > 0 ? 'warning' : 'success'} sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    📊 Import Summary
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {importResult.message}
                  </Typography>
                </Alert>

                {/* Detailed Statistics Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="h4" component="div">
                          {importResult.created || 0}
                        </Typography>
                  <Typography variant="body2">
                          ✅ Created
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'info.contrastText' }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="h4" component="div">
                          {importResult.skippedDuplicates || 0}
                        </Typography>
                        <Typography variant="body2">
                          ⏭️ Skipped
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Card sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="h4" component="div">
                          {importResult.totalProcessed || 0}
                        </Typography>
                        <Typography variant="body2">
                          📋 Total Rows
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={6} md={3}>
                    <Card sx={{ 
                      textAlign: 'center', 
                      bgcolor: importResult.errors > 0 ? 'error.light' : 'grey.300',
                      color: importResult.errors > 0 ? 'error.contrastText' : 'text.primary'
                    }}>
                      <CardContent sx={{ py: 1 }}>
                        <Typography variant="h4" component="div">
                          {importResult.errors || 0}
                        </Typography>
                        <Typography variant="body2">
                          ❌ Errors
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                {/* Success Rate Progress */}
                {importResult.totalProcessed > 0 && (
                  <Box sx={{ mb: 2 }}>
                    {(() => {
                      const created = Number(importResult.created) || 0;
                      const totalProcessed = Number(importResult.totalProcessed) || 1; // Avoid division by zero
                      const successRate = Math.round((created / totalProcessed) * 100);
                      
                      console.log('Success Rate Calculation:', {
                        created,
                        totalProcessed,
                        successRate,
                        importResult
                      });
                      
                      return (
                        <>
                          <Typography variant="body2" gutterBottom>
                            Success Rate: {successRate}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={successRate}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                      </>
                      );
                    })()}
                  </Box>
                )}

                {/* Items Successfully Created */}
                {importResult.items && importResult.items.length > 0 && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      ✅ Successfully Created Items ({importResult.items.length}):
                  </Typography>
                    <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                      {importResult.items.slice(0, 10).map((item: any, index: number) => (
                        <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                          • {item.code} - {item.name}
                        </Typography>
                      ))}
                      {importResult.items.length > 10 && (
                        <Typography variant="body2" sx={{ ml: 1, fontStyle: 'italic' }}>
                          ... and {importResult.items.length - 10} more items
                        </Typography>
                      )}
                    </Box>
                </Alert>
                )}

                {/* Error Details */}
                {importResult.errorDetails && importResult.errorDetails.length > 0 && (
                  <Alert severity="error">
                    <Typography variant="subtitle2" gutterBottom>
                      ❌ Error Details ({importResult.errorDetails.length}):
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {importResult.errorDetails.map((error: string, index: number) => (
                        <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                        • {error}
                      </Typography>
                    ))}
                  </Box>
                  </Alert>
                )}

                {/* Processing Time Info */}
                {/* <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Import completed at {new Date().toLocaleString()}
                </Typography> */}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
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
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
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
                label="Pending PO"
                type="number"
                value={formData.pendingPO}
                onChange={(e) => setFormData({ ...formData, pendingPO: Number(e.target.value) })}
                helperText="Purchase orders on the way"
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
            <Grid item xs={12} md={8}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department}
                  label="Department"
                  onChange={(e) => {
                    if (e.target.value === '__CREATE_NEW__') {
                      setShowCreateDepartmentDialog(true);
                    } else {
                      setFormData({ ...formData, department: e.target.value });
                    }
                  }}
                >
                  <MenuItem value="">Public (No Department)</MenuItem>
                  {/* For ADMIN users, only show their own department if they have one */}
                  {user?.role === 'ADMIN' ? (
                    user.department && (
                      <MenuItem key={user.department} value={user.department}>
                        {user.department} (Your Department)
                      </MenuItem>
                    )
                  ) : (
                    /* For OWNER users, show all departments */
                    departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))
                  )}
                  {/* Show create department option only for OWNER */}
                  {user?.role === 'OWNER' && (
                    <MenuItem 
                      value="__CREATE_NEW__" 
                      sx={{ color: 'primary.main', fontStyle: 'italic' }}
                    >
                      + Create New Department
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
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

      {/* Create Purchase Order Dialog */}
      <Dialog 
        open={showCreatePODialog} 
        onClose={() => setShowCreatePODialog(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create Purchase Order</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ py: 2 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{selectedItem.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Code:</strong> {selectedItem.code || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Current Inventory:</strong> {selectedItem.currentInventory || selectedItem.quantity || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Pending PO:</strong> {selectedItem.pendingPO || 0}
                  </Typography>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Quantity to Order"
                  type="number"
                  value={newPOQuantityInput}
                  onChange={(e) => handleNumberInputChange(e.target.value, setNewPOQuantity, setNewPOQuantityInput, 1)}
                  onBlur={(e) => {
                    // Ensure minimum value on blur
                    const value = parseInt(e.target.value) || 1;
                    setNewPOQuantity(Math.max(1, value));
                    setNewPOQuantityInput(Math.max(1, value).toString());
                  }}
                  inputProps={{ min: 1 }}
                  required
                  helperText="Enter the quantity to order"
                  placeholder="Enter quantity"
                />

                <TextField
                  fullWidth
                  label="Tracking Number (Optional)"
                  value={newPOTrackingNumber}
                  onChange={(e) => setNewPOTrackingNumber(e.target.value)}
                  helperText="Enter tracking number if available"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreatePODialog(false)}>Cancel</Button>
          <Button 
            onClick={createPurchaseOrder} 
            variant="contained"
            color="primary"
            disabled={!selectedItem || newPOQuantity <= 0}
          >
            Create Purchase Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Purchase Orders Dialog */}
      <Dialog 
        open={showPODialog} 
        onClose={() => setShowPODialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Manage Purchase Orders</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ py: 2 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{selectedItem.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Code:</strong> {selectedItem.code || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Current Inventory:</strong> {selectedItem.currentInventory || selectedItem.quantity || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Total Pending PO:</strong> {selectedItem.pendingPO || 0}
                  </Typography>
                </CardContent>
              </Card>

              <Typography variant="h6" gutterBottom>Pending Purchase Orders</Typography>
              {!pendingPOs || pendingPOs.length === 0 ? (
                <Card sx={{ mt: 2, textAlign: 'center', py: 4 }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      gap: 2,
                      color: 'text.secondary'
                    }}>
                      <LocalShippingIcon sx={{ fontSize: 48, opacity: 0.5 }} />
                      <Typography variant="h6" color="text.secondary">
                        No Purchase Orders
                </Typography>
                      <Typography variant="body2" color="text.secondary">
                        This item currently has no pending purchase orders.
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click "Create New PO" below to order more inventory.
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {(pendingPOs || []).map((po) => (
                    <Card key={po.id} variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1">
                              <strong>PO #{po.id}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Quantity:</strong> {po.quantity}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              <strong>Order Date:</strong> {new Date(po.orderDate).toLocaleDateString()}
                            </Typography>
                            {po.trackingNumber && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  <strong>Tracking:</strong> {po.trackingNumber}
                                </Typography>
                                {/* <TrackingDisplay trackingNumber={po.trackingNumber} compact /> */}
                              </Box>
                            )}
                            {po.createdBy && (
                              <Typography variant="body2" color="text.secondary">
                                <strong>Created by:</strong> {po.createdBy}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                            <Button
                              variant="outlined"
                              color="primary"
                              onClick={() => handleEditPO(po)}
                              size="small"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="contained"
                              color="success"
                              onClick={() => markPOAsArrived(po.id)}
                              size="small"
                            >
                              Mark as Arrived
                            </Button>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPODialog(false)}>Close</Button>
          <Button 
            onClick={() => {
              setShowPODialog(false);
              setShowCreatePODialog(true);
            }}
            variant="contained"
            color="primary"
          >
            Create New PO
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Purchase Order Dialog */}
      <Dialog 
        open={showEditPODialog} 
        onClose={() => setShowEditPODialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          Edit Purchase Order #{editingPO?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Quantity"
              type="number"
              value={editPOQuantityInput}
              onChange={(e) => handleNumberInputChange(e.target.value, setEditPOQuantity, setEditPOQuantityInput, 1)}
              onBlur={(e) => {
                // Ensure minimum value on blur
                const value = parseInt(e.target.value) || 1;
                setEditPOQuantity(Math.max(1, value));
                setEditPOQuantityInput(Math.max(1, value).toString());
              }}
              inputProps={{ min: 1 }}
            />
            <TextField
              fullWidth
              label="Tracking Number"
              value={editPOTrackingNumber}
              onChange={(e) => setEditPOTrackingNumber(e.target.value)}
            />
            <TextField
              fullWidth
              label="Order Date"
              type="date"
              value={editPOOrderDate}
              onChange={(e) => setEditPOOrderDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditPODialog(false)}>Cancel</Button>
          <Button onClick={updatePurchaseOrder} variant="contained" color="primary">
            Update Purchase Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog 
        open={showCreateDepartmentDialog} 
        onClose={() => setShowCreateDepartmentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Department</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Department Name"
              value={newDepartmentName}
              onChange={(e) => setNewDepartmentName(e.target.value)}
              placeholder="Enter department name (e.g., Engineering, IT, Operations)"
              autoFocus
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDepartmentDialog(false)}>Cancel</Button>
          <Button 
            onClick={createDepartment} 
            variant="contained"
            color="primary"
            disabled={!newDepartmentName.trim()}
          >
            Create Department
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
} 
