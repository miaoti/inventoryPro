'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  Alert,
  Card,
  CardContent,
  Chip,
  Tab,
  Tabs,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Remove as RemoveIcon,
  CameraAlt as CameraIcon,
  Stop as StopIcon 
} from '@mui/icons-material';
import axios from 'axios';

// ZXing imports
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';

// QuaggaJS import
import Quagga from 'quagga';

interface ScannedItem {
  id: number;
  name: string;
  code: string;
  currentInventory: number;
  location: string;
  barcode: string;
  needsRestock: boolean;
}

export default function BarcodeScannerPage() {
  const [barcode, setBarcode] = useState('');
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [quantityToUse, setQuantityToUse] = useState(1);
  const [restockQuantity, setRestockQuantity] = useState(0);
  const [actionMode, setActionMode] = useState<'use' | 'restock'>('use');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

  useEffect(() => {
    // Load search history from localStorage
    const savedHistory = localStorage.getItem('barcodeSearchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    // Check if camera permission was previously granted
    const previousPermission = localStorage.getItem('cameraPermissionGranted');
    if (previousPermission === 'true') {
      setCameraPermission(true);
    }

    // Initialize code reader with more comprehensive format support
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      // Most common barcode formats
      'CODE_128',
      'CODE_39', 
      'CODE_93',
      'EAN_13',
      'EAN_8',
      'UPC_A',
      'UPC_E',
      'ITF',
      'CODABAR',
      'RSS_14',
      'RSS_EXPANDED'
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    hints.set(DecodeHintType.PURE_BARCODE, false);
    
    codeReaderRef.current = new BrowserMultiFormatReader(hints);

    return () => {
      stopScanning();
    };
  }, []);

  const requestCameraPermission = async () => {
    try {
      // Clear any previous error messages
      setError(null);
      
      // For mobile devices, we need to be more explicit about the constraints
      // Start with basic constraints that work across all devices
      const basicConstraints = {
        video: true
      };
      
      console.log('Requesting basic camera access first...');
      
      // First, try with the most basic constraints to trigger permission
      const testStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      console.log('Basic camera access granted!');
      
      // Stop the test stream immediately
      testStream.getTracks().forEach(track => track.stop());
      
      setCameraPermission(true);
      // Store permission in localStorage for future use
      localStorage.setItem('cameraPermissionGranted', 'true');
      
      console.log('Camera permission stored in localStorage');
      return true;
      
    } catch (err) {
      console.error('Camera permission error:', err);
      setCameraPermission(false);
      
      // Clear localStorage permission if it fails
      localStorage.removeItem('cameraPermissionGranted');
      
      // Provide specific error messages for different scenarios
      let errorMessage = 'Camera access is required to scan barcodes.';
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera permission was denied. Please click "Allow" when prompted, or check your browser settings to allow camera access for this site.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device. Please ensure your device has a camera.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera is not supported on this browser. Please try using Chrome or Safari.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is currently being used by another application. Please close other camera apps and try again.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Camera constraints not supported. Please try again.';
        }
      }
      
      setError(errorMessage);
      return false;
    }
  };

  const startScanning = async () => {
    if (!codeReaderRef.current) return;
    
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setIsScanning(true);
      setError(null);

      // Now use optimized constraints for barcode scanning
      // Try environment camera first, then fall back to user camera
      let constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { 
            ideal: 1280, 
            max: 1920, 
            min: 640 
          },
          height: { 
            ideal: 720, 
            max: 1080, 
            min: 480 
          },
        }
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (envCameraError) {
        console.log('Environment camera not available, trying user camera...');
        // Fallback to front camera if back camera is not available
        constraints = {
          video: {
            facingMode: { ideal: 'user' },
            width: { 
              ideal: 1280, 
              max: 1920, 
              min: 640 
            },
            height: { 
              ideal: 720, 
              max: 1080, 
              min: 480 
            },
          }
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
        };
        
        // Enhanced scanning with interval-based detection
        let consecutiveFailures = 0;
        const maxFailures = 5;
        
        scanningIntervalRef.current = setInterval(async () => {
          if (!videoRef.current || !codeReaderRef.current || !isScanning) return;
          
          try {
            setScanAttempts(prev => prev + 1);
            
            // Use canvas approach to avoid video playing issues
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            
            if (!context) return;
            
            canvas.width = videoRef.current.videoWidth || 640;
            canvas.height = videoRef.current.videoHeight || 480;
            
            if (canvas.width === 0 || canvas.height === 0) return;
            
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            
            const result = await codeReaderRef.current.decodeFromImageUrl(dataUrl);
            if (result) {
              const barcodeText = result.getText();
              console.log('Barcode detected:', barcodeText, 'after', scanAttempts, 'attempts');
              setBarcode(barcodeText);
              handleScanBarcode(barcodeText);
              stopScanning();
              return;
            }
            // Reset consecutive failures on successful scan attempt (even if no barcode found)
            consecutiveFailures = 0;
          } catch (err) {
            // Only count actual errors, not "NotFoundException" which is normal
            if ((err as any).name !== 'NotFoundException') {
              consecutiveFailures++;
              console.error('Scanning error:', err);
              
              // Only stop on critical errors, not on normal "no barcode found" errors
              if (consecutiveFailures > 10) {
                console.error('Too many consecutive scanning errors, stopping...');
                stopScanning();
                setError('Scanner encountered repeated errors. Please restart scanning.');
                return;
              }
            }
          }
        }, 800); // Increased interval to 800ms for more stability
        
        setSuccess('Camera started. Position barcode in the orange frame and wait, or use Capture button.');
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to start camera. Please ensure you have a camera and try again.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
    
    setIsScanning(false);
    setTorchEnabled(false);
    setScanAttempts(0);
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && 'torch' in track.getCapabilities()) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !torchEnabled } as any]
          });
          setTorchEnabled(!torchEnabled);
        } catch (err) {
          console.error('Torch not supported:', err);
        }
      }
    }
  };

  const handleScanBarcode = async (barcodeText?: string) => {
    const codeToScan = barcodeText || barcode;
    
    if (!codeToScan.trim()) {
      setError('Please enter a barcode or scan one with the camera');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.get(`${API_URL}/public/barcode/scan/${codeToScan.trim()}`);
      setScannedItem(response.data);
      setTabValue(1); // Switch to results tab
      addToSearchHistory(codeToScan);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('Item not found with this barcode');
      } else {
        setError('Error scanning barcode. Please try again.');
      }
      setScannedItem(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseItem = async () => {
    if (!scannedItem || quantityToUse <= 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URL}/public/barcode/use/${scannedItem.barcode}`,
        { quantity: quantityToUse }
      );
      
      setSuccess(response.data.message);
      // Update the scanned item with new inventory
      setScannedItem({
        ...scannedItem,
        currentInventory: response.data.remainingInventory,
        needsRestock: response.data.needsRestock
      });
      setQuantityToUse(1);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error recording item usage. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPendingPO = async () => {
    if (!scannedItem || restockQuantity <= 0) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post(
        `${API_URL}/public/barcode/add-pending-po/${scannedItem.barcode}`,
        { quantity: restockQuantity }
      );
      
      setSuccess(response.data.message);
      setRestockQuantity(0);
      // Optionally refresh item data
      handleScanBarcode(scannedItem.barcode);
    } catch (err: any) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error adding to Pending PO. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetScanAttempts = () => {
    setScanAttempts(0);
    setError(null);
    setSuccess('Scan attempts reset. Try positioning the barcode again.');
  };

  const addToSearchHistory = (searchedBarcode: string) => {
    const newHistory = [searchedBarcode, ...searchHistory.filter(item => item !== searchedBarcode)].slice(0, 10);
    setSearchHistory(newHistory);
    localStorage.setItem('barcodeSearchHistory', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('barcodeSearchHistory');
  };

  const resetScanner = () => {
    setBarcode('');
    setScannedItem(null);
    setQuantityToUse(1);
    setError(null);
    setSuccess(null);
    setTabValue(0);
    setScanAttempts(0);
    stopScanning();
    clearSearchHistory();
  };

  const manualCapture = async () => {
    if (!videoRef.current || !codeReaderRef.current) return;
    
    try {
      setScanAttempts(prev => prev + 1);
      console.log(`Manual capture attempt #${scanAttempts + 1}`);
      setError(null); // Clear previous errors
      
      // Use canvas-only approach to avoid video playing issues
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        setError('Canvas not supported');
        return;
      }
      
      // Set canvas size to match video
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      
      if (canvas.width === 0 || canvas.height === 0) {
        setError('Video not ready. Wait a moment and try again.');
        return;
      }
      
      // Capture current video frame to canvas
      context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
      
      // Try multiple approaches for better screen barcode detection
      const attempts = [
        // Attempt 1: Normal capture
        () => canvas.toDataURL('image/png'),
        // Attempt 2: Enhanced contrast
        () => {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          // Increase contrast for better barcode detection
          for (let i = 0; i < data.length; i += 4) {
            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            const contrast = gray > 128 ? 255 : 0; // High contrast black/white
            data[i] = data[i + 1] = data[i + 2] = contrast;
          }
          context.putImageData(imageData, 0, 0);
          return canvas.toDataURL('image/png');
        },
        // Attempt 3: Inverted colors (sometimes helps with screen barcodes)
        () => {
          context.drawImage(videoRef.current!, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];     // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
          }
          context.putImageData(imageData, 0, 0);
          return canvas.toDataURL('image/png');
        }
      ];
      
      // Try each approach
      for (let i = 0; i < attempts.length; i++) {
        try {
          const dataUrl = attempts[i]();
          console.log(`Trying ZXing detection method ${i + 1}`);
          
          const result = await codeReaderRef.current.decodeFromImageUrl(dataUrl);
          if (result) {
            const barcodeText = result.getText();
            console.log(`Barcode detected via ZXing method ${i + 1}:`, barcodeText);
            setBarcode(barcodeText);
            handleScanBarcode(barcodeText);
            stopScanning();
            return;
          }
        } catch (methodError) {
          console.log(`ZXing detection method ${i + 1} failed:`, methodError);
        }
      }
      
      // Try QuaggaJS as additional detection method
      try {
        console.log('Trying QuaggaJS detection method');
        const Quagga = await import('quagga');
        
        await new Promise<void>((resolve, reject) => {
          Quagga.default.decodeSingle({
            decoder: {
              readers: [
                'code_128_reader',
                'code_39_reader',
                'code_39_vin_reader',
                'ean_reader',
                'ean_8_reader',
                'code_93_reader',
                'codabar_reader',
                'i2of5_reader'
              ]
            },
            locate: true,
            inputStream: {
              type: 'ImageStream',
              target: canvas,
              constraints: {
                width: canvas.width,
                height: canvas.height
              }
            }
          }, (result: any) => {
            if (result && result.codeResult) {
              const barcodeText = result.codeResult.code;
              console.log('Barcode detected via QuaggaJS:', barcodeText);
              setBarcode(barcodeText);
              handleScanBarcode(barcodeText);
              stopScanning();
              resolve();
            } else {
              console.log('QuaggaJS detection failed');
              resolve();
            }
          });
        });
      } catch (quaggaError) {
        console.log('QuaggaJS detection failed:', quaggaError);
      }
      
      // If all methods fail
      console.log('All detection methods failed - no barcode detected');
      setError('Barcode not detected. For screen barcodes: ensure good lighting, no glare, and try different angles. Consider using manual entry.');
      
    } catch (err) {
      console.log('Manual capture error:', err);
      setError('Capture failed. Try again or adjust barcode position.');
    }
    
    // Important: Do NOT stop scanning on manual capture failure
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <style jsx global>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
      `}</style>
      
      <Typography variant="h4" gutterBottom align="center">
        Inventory Barcode Scanner
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
        Scan or enter a barcode to view item details and record usage
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Scan Barcode" />
          <Tab label="Item Details" disabled={!scannedItem} />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {/* Camera Scanner Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Camera Scanner
                </Typography>
                
                {!isScanning && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <strong>Scanning Tips:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      <li>For physical barcodes: Ensure good lighting and hold 6-12 inches away</li>
                      <li>For screen barcodes: Reduce screen brightness, avoid glare, try angles</li>
                      <li>Hold device steady and make sure barcode is clearly visible</li>
                      <li>Use the "📷 Capture Now" button for better detection</li>
                      <li>If scanning a screen barcode fails, try copying the barcode number manually</li>
                      <li>Scanner attempts every 0.8 seconds automatically</li>
                    </ul>
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                  {isScanning ? (
                    <>
                      <Box sx={{ position: 'relative', display: 'inline-block' }}>
                        <video
                          ref={videoRef}
                          style={{
                            width: '100%',
                            maxWidth: 400,
                            height: 300,
                            backgroundColor: '#000',
                            border: '2px solid #ccc',
                            borderRadius: 8
                          }}
                          autoPlay
                          muted
                          playsInline
                        />
                        {/* Scanning overlay */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '80%',
                            height: '20%',
                            border: '2px solid #ff6b35',
                            borderRadius: 1,
                            pointerEvents: 'none',
                            animation: 'pulse 2s infinite'
                          }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" align="center">
                        Position barcode within the orange frame
                      </Typography>
                      {scanAttempts > 0 && (
                        <Typography variant="caption" color="text.secondary" align="center">
                          Scan attempts: {scanAttempts}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={manualCapture}
                          disabled={!videoRef.current}
                        >
                          📷 Capture Now
                        </Button>
                        {scanAttempts > 5 && (
                          <Button
                            variant="outlined"
                            color="secondary"
                            onClick={resetScanAttempts}
                          >
                            🔄 Reset Attempts
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          onClick={toggleTorch}
                          disabled={!streamRef.current}
                        >
                          {torchEnabled ? '🔦 Flash ON' : '💡 Flash OFF'}
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={stopScanning}
                          startIcon={<StopIcon />}
                        >
                          Stop Scanning
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={startScanning}
                      disabled={loading}
                      startIcon={<CameraIcon />}
                      size="large"
                    >
                      Start Camera Scanner
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Manual Entry Section */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Manual Entry
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    label="Barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleScanBarcode();
                      }
                    }}
                    placeholder="Enter barcode manually..."
                  />
                  <Button
                    variant="contained"
                    onClick={() => handleScanBarcode()}
                    disabled={loading}
                    startIcon={<SearchIcon />}
                  >
                    Search
                  </Button>
                </Box>

                {/* Search History */}
                {searchHistory.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Recent Searches:
                      </Typography>
                      <Button
                        size="small"
                        onClick={clearSearchHistory}
                        color="secondary"
                      >
                        Clear History
                      </Button>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {searchHistory.map((historicalBarcode, index) => (
                        <Chip
                          key={index}
                          label={historicalBarcode}
                          onClick={() => {
                            setBarcode(historicalBarcode);
                            handleScanBarcode(historicalBarcode);
                          }}
                          color="primary"
                          variant="outlined"
                          size="small"
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </Box>
        )}

        {tabValue === 1 && scannedItem && (
          <Box sx={{ p: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h5" component="h2">
                    {scannedItem.name}
                  </Typography>
                  {scannedItem.needsRestock && (
                    <Chip label="Needs Restock" color="warning" size="small" />
                  )}
                </Box>
                
                <Typography color="text.secondary" gutterBottom>
                  Code: {scannedItem.code}
                </Typography>
                
                <Typography color="text.secondary" gutterBottom>
                  Location: {scannedItem.location}
                </Typography>
                
                <Typography variant="h6" color="primary" gutterBottom>
                  Current Inventory: {scannedItem.currentInventory} units
                </Typography>

                {/* Display barcode image */}
                <Box sx={{ my: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Barcode:
                  </Typography>
                  <img 
                    src={`${API_URL}/public/barcode-image/${scannedItem.barcode}`}
                    alt={`Barcode: ${scannedItem.barcode}`}
                    style={{ maxWidth: '100%', height: 60 }}
                  />
                  <Typography variant="caption" color="text.secondary" display="block">
                    {scannedItem.barcode}
                  </Typography>
                </Box>

                {/* Action Mode Toggle */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Select Action:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={actionMode === 'use' ? 'contained' : 'outlined'}
                      onClick={() => setActionMode('use')}
                      color="primary"
                    >
                      Record Usage
                    </Button>
                    <Button
                      variant={actionMode === 'restock' ? 'contained' : 'outlined'}
                      onClick={() => setActionMode('restock')}
                      color="success"
                    >
                      Add to Pending PO
                    </Button>
                  </Box>
                </Box>

                {/* Usage Action */}
                {actionMode === 'use' && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
                    <TextField
                      type="number"
                      label="Quantity to Use"
                      value={quantityToUse}
                      onChange={(e) => setQuantityToUse(Number(e.target.value))}
                      inputProps={{ min: 1, max: scannedItem.currentInventory }}
                      sx={{ width: 150 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleUseItem}
                      disabled={loading || quantityToUse <= 0 || quantityToUse > scannedItem.currentInventory}
                      startIcon={<RemoveIcon />}
                    >
                      Record Usage
                    </Button>
                  </Box>
                )}

                {/* Restock Action */}
                {actionMode === 'restock' && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 3 }}>
                    <TextField
                      type="number"
                      label="Quantity to Add to PO"
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(Number(e.target.value))}
                      inputProps={{ min: 1 }}
                      sx={{ width: 180 }}
                    />
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleAddToPendingPO}
                      disabled={loading || restockQuantity <= 0}
                    >
                      Add to Pending PO
                    </Button>
                  </Box>
                )}

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                {success && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {success}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button variant="outlined" onClick={resetScanner}>
          Reset Scanner
        </Button>
      </Box>
    </Box>
  );
} 