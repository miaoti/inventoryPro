'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  History as HistoryIcon,
  FlashlightOn as FlashlightOnIcon,
  FlashlightOff as FlashlightOffIcon,
  Stop as StopIcon,
} from '@mui/icons-material';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import axios from 'axios';

interface ScannedItem {
  id: number;
  name: string;
  code: string;
  currentInventory: number;
  usedInventory: number;
  pendingPO: number;
  location: string;
  barcode: string;
  needsRestock: boolean;
  availableQuantity: number;
  safetyStockThreshold?: number;
}

interface UsageRecord {
  id: number;
  userName: string;
  quantityUsed: number;
  usedAt: string;
  notes?: string;
}

export default function BarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [userName, setUserName] = useState('');
  const [quantityToUse, setQuantityToUse] = useState(1);
  const [notes, setNotes] = useState('');
  const [department, setDepartment] = useState('');
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddQuantityOption, setShowAddQuantityOption] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    // Load saved user name from localStorage
    const savedUserName = localStorage.getItem('scannerUserName');
    if (savedUserName) {
      setUserName(savedUserName);
    }

    // Check if user is admin (you might want to get this from auth context or JWT token)
    const token = document.cookie.split(';').find(c => c.trim().startsWith('token='));
    if (token) {
      try {
        // Simple check - in a real app, decode the JWT properly
        const isAdminUser = userName.toLowerCase() === 'admin' || savedUserName?.toLowerCase() === 'admin';
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.log('Error checking admin status:', error);
      }
    }

    return () => {
      stopScanning();
    };
  }, [userName]);

  const startScanning = async () => {
    if (!userName.trim()) {
      setError('Please enter your name before scanning');
      return;
    }

    try {
      setError('');
      setCameraError('');
      setIsScanning(true);

      // Save user name for future sessions
      localStorage.setItem('scannerUserName', userName);

      // Initialize the code reader with proper settings
      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

      // Set up hints for better barcode detection
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
      ]);
      codeReader.hints = hints;

      // Start continuous scanning
      codeReader.decodeFromVideoDevice(null, 'video-element', (result, error) => {
        if (result) {
          console.log('Barcode detected:', result.getText());
          stopScanning();
          handleBarcodeScanned(result.getText());
        }
        if (error && !(error.name === 'NotFoundException')) {
          console.error('Scan error:', error);
        }
      });

    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Unable to access camera. Please check permissions or use manual entry.');
      setIsScanning(false);
    }
  };

  const toggleTorch = async () => {
    // Torch functionality - try to enable torch if supported
    if (codeReaderRef.current && isScanning) {
      try {
        const videoElement = document.getElementById('video-element') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          if (track && 'getCapabilities' in track) {
            const capabilities = track.getCapabilities() as any;
            if (capabilities.torch) {
              await track.applyConstraints({
                advanced: [{ torch: !torchEnabled } as any]
              });
              setTorchEnabled(!torchEnabled);
            }
          }
        }
      } catch (error) {
        console.log('Torch not supported or error:', error);
      }
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
      codeReaderRef.current = null;
    }

    setTorchEnabled(false);
  };

  const handleBarcodeScanned = async (barcode: string) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.get(`${API_URL}/public/barcode/scan/${barcode}`);
      
      // Calculate available quantity from the response - currentInventory already reflects usage, so just add pending PO
      const itemData = response.data;
      const availableQuantity = (itemData.currentInventory || 0) + (itemData.pendingPO || 0);
      
      setScannedItem({
        ...itemData,
        availableQuantity: Math.max(0, availableQuantity)
      });
      setShowUsageDialog(true);
      
      // Fetch usage history for this item
      fetchUsageHistory(itemData.id);
    } catch (err) {
      setError('Item not found. Please check the barcode or item code and try again.');
      console.error('Scan error:', err);
    }
  };

  const handleManualScan = () => {
    if (manualBarcode.trim()) {
      console.log('Manual scan input:', manualBarcode.trim());
      handleBarcodeScanned(manualBarcode.trim());
      setManualBarcode('');
    }
  };

  const fetchUsageHistory = async (itemId: number) => {
    try {
      const response = await axios.get(`${API_URL}/usage/item/${itemId}`);
      setUsageHistory(response.data.slice(0, 10)); // Show last 10 records
    } catch (err) {
      console.error('Error fetching usage history:', err);
    }
  };

  const recordUsage = async () => {
    if (!scannedItem || !userName.trim() || !department.trim()) {
      setError('Missing required information');
      return;
    }

    // Validate that quantity to use doesn't exceed available quantity
    if (quantityToUse > scannedItem.availableQuantity) {
      setError(`Cannot use ${quantityToUse} units. Only ${scannedItem.availableQuantity} units are available.`);
      return;
    }

    if (quantityToUse <= 0) {
      setError('Please enter a valid quantity to use');
      return;
    }

    try {
      const usageData = {
        barcode: scannedItem.barcode,
        userName: userName.trim(),
        quantityUsed: quantityToUse,
        notes: notes.trim(),
        department: department.trim()
      };

      const response = await axios.post(`${API_URL}/public/barcode/use`, usageData);
      
      setSuccess(`Successfully recorded usage: ${quantityToUse} units used by ${userName}`);
      
      // Update scanned item with new data from response
      if (response.data.item) {
        const updatedItem = response.data.item;
        setScannedItem({
          ...scannedItem,
          currentInventory: updatedItem.currentInventory,
          usedInventory: updatedItem.usedInventory,
          availableQuantity: updatedItem.availableQuantity
        });
      }
      
      // Reset form but keep dialog open to show updated quantities
      setQuantityToUse(1);
      setNotes('');
      setDepartment('');
      setError(''); // Clear any previous errors
      
      // Refresh usage history
      fetchUsageHistory(scannedItem.id);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Error recording usage';
      setError(errorMsg);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const addQuantityToItem = async () => {
    if (!scannedItem || quantityToAdd <= 0) {
      setError('Please enter a valid quantity to add');
      return;
    }

    try {
      const newQuantity = scannedItem.currentInventory + quantityToAdd;
      const response = await axios.put(`${API_URL}/items/${scannedItem.id}`, {
        name: scannedItem.name,
        code: scannedItem.code,
        quantity: newQuantity,
        minQuantity: scannedItem.safetyStockThreshold || 0,
        location: scannedItem.location,
      });

      setSuccess(`Successfully added ${quantityToAdd} units to ${scannedItem.name}`);
      setQuantityToAdd(0);
      
      // Update scanned item data with new quantities - currentInventory already reflects usage, so just add pending PO
      const newAvailableQuantity = newQuantity + (scannedItem.pendingPO || 0);
      setScannedItem({
        ...scannedItem,
        currentInventory: newQuantity,
        availableQuantity: Math.max(0, newAvailableQuantity)
      });
      
      // Clear the error if there was one
      setError('');
    } catch (error) {
      console.error('Error adding quantity:', error);
      setError('Error adding quantity to item');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Barcode Scanner - Item Usage Tracker
      </Typography>

      {/* User Name Input */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonIcon color="primary" />
            <TextField
              label="Your Name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name to track usage"
              size="small"
              sx={{ flexGrow: 1 }}
              required
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Your name will be recorded with each item usage for tracking purposes.
          </Typography>
        </CardContent>
      </Card>

      {/* Scanner Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Camera Scanner */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Camera Scanner
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<ScannerIcon />}
                onClick={isScanning ? stopScanning : startScanning}
                disabled={!userName.trim()}
              >
                {isScanning ? 'Stop Scanning' : 'Start Camera Scan'}
              </Button>
              
              {isScanning && (
                <IconButton onClick={toggleTorch} color={torchEnabled ? 'warning' : 'default'}>
                  {torchEnabled ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
                </IconButton>
              )}
            </Box>

            {isScanning && (
              <Box sx={{ position: 'relative', maxWidth: 400 }}>
                <video
                  id="video-element"
                  style={{
                    width: '100%',
                    height: 'auto',
                    border: '2px solid #1976d2',
                    borderRadius: '8px'
                  }}
                  autoPlay
                  playsInline
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Point camera at barcode. Scanning will stop automatically when detected.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Manual Entry */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Manual Entry
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                label="Enter Barcode or Item Code"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                size="small"
                sx={{ flexGrow: 1 }}
                disabled={!userName.trim()}
                placeholder="e.g., BOLT001 or barcode number"
                helperText="You can enter either the item code or barcode"
              />
              <Button 
                variant="outlined" 
                onClick={handleManualScan}
                disabled={!userName.trim() || !manualBarcode.trim()}
              >
                Scan
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Error/Success Messages - Only show if dialog is NOT open */}
      {!showUsageDialog && error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!showUsageDialog && success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {cameraError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setCameraError('')}>
          {cameraError}
        </Alert>
      )}

      {/* Usage Dialog */}
      <Dialog 
        open={showUsageDialog} 
        onClose={() => { 
          setShowUsageDialog(false); 
          setSuccess(''); 
          setError(''); 
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Record Item Usage
        </DialogTitle>
        <DialogContent>
          {/* Dialog-specific Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          {/* Dialog-specific Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {scannedItem && (
            <Box>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6">{scannedItem.name}</Typography>
                  <Typography color="text.secondary">Code: {scannedItem.code}</Typography>
                  <Typography color="text.secondary">Location: {scannedItem.location}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Chip 
                      icon={<InventoryIcon />}
                      label={`Available: ${scannedItem.availableQuantity}`}
                      color={scannedItem.availableQuantity > 0 ? 'success' : 'error'}
                    />
                    <Chip 
                      label={`Used: ${scannedItem.usedInventory}`}
                      variant="outlined"
                    />
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Quantity to Use"
                  type="number"
                  value={quantityToUse}
                  onChange={(e) => setQuantityToUse(Math.max(1, parseInt(e.target.value) || 1))}
                  inputProps={{ min: 1, max: scannedItem.availableQuantity }}
                  size="small"
                />
                
                <TextField
                  label="Department (D number)"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g., D001, D123"
                  size="small"
                  required
                />
                
                <TextField
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={2}
                  size="small"
                />

                {/* Admin-only Add Quantity Section */}
                {isAdmin && (
                  <Paper sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom color="success.dark">
                      Admin: Add Inventory Quantity
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        label="Quantity to Add"
                        type="number"
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(Math.max(0, parseInt(e.target.value) || 0))}
                        inputProps={{ min: 0 }}
                        size="small"
                        sx={{ flexGrow: 1 }}
                      />
                      <Button 
                        variant="contained" 
                        color="success" 
                        onClick={addQuantityToItem}
                        disabled={quantityToAdd <= 0}
                      >
                        Add Stock
                      </Button>
                    </Box>
                  </Paper>
                )}

                {/* Usage History */}
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <HistoryIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                    Recent Usage History
                  </Typography>
                  {usageHistory.length > 0 ? (
                    <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                      {usageHistory.map((usage) => (
                        <Box key={usage.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #eee' }}>
                          <Box>
                            <Typography variant="body2">{usage.userName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(usage.usedAt)}
                            </Typography>
                          </Box>
                          <Typography variant="body2">
                            {usage.quantityUsed} units
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No recent usage records
                    </Typography>
                  )}
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowUsageDialog(false)}>
            Close
          </Button>
          <Button 
            onClick={recordUsage} 
            variant="contained"
            disabled={!userName.trim() || !department.trim() || quantityToUse <= 0 || (scannedItem ? quantityToUse > scannedItem.availableQuantity : false)}
          >
            Record Usage
          </Button>
          {isAdmin && (
            <Button 
              onClick={addQuantityToItem}
              variant="contained"
              color="success"
              disabled={quantityToAdd <= 0}
            >
              Add Stock
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
} 