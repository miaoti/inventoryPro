'use client';

import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
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
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  InputAdornment,
  Collapse,
  Divider,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  Slide,
  LinearProgress,
  CardHeader,
  Avatar,
  alpha,
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  Person as PersonIcon,
  Inventory as InventoryIcon,
  History as HistoryIcon,
  FlashlightOn as FlashlightOnIcon,
  FlashlightOff as FlashlightOffIcon,
  Stop as StopIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { BrowserMultiFormatReader, BarcodeFormat, DecodeHintType } from '@zxing/library';
import { barcodeAPI, itemsAPI, purchaseOrderAPI, publicItemsAPI } from '../services/api';
import { PurchaseOrder } from '../types/purchaseOrder';
import Layout from '../components/Layout';
// import { TrackingDisplay } from '../../../components/TrackingDisplay';

interface ScannedItem {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  englishDescription?: string;
  currentInventory?: number;
  usedInventory?: number;
  pendingPO?: number;
  location?: string;
  equipment?: string;
  category?: 'A' | 'B' | 'C';
  department?: string;
  displayDepartment?: string;
  barcode?: string;
  needsRestock?: boolean;
  availableQuantity: number;
  safetyStockThreshold?: number;
}

interface SearchResultItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
  englishDescription?: string;
  location?: string;
  equipment?: string;
  category?: 'A' | 'B' | 'C';
  barcode?: string;
  currentInventory?: number;
  score?: number;
}

interface UsageRecord {
  id: number;
  userName: string;
  quantityUsed: number;
  usedAt: string;
  notes?: string;
}

export default function BarcodeScanner() {
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const theme = useTheme();
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItem, setScannedItem] = useState<ScannedItem | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [userName, setUserName] = useState('');
  const [quantityToUse, setQuantityToUse] = useState(1);
  const [notes, setNotes] = useState('');
  const [department, setDepartment] = useState('');
  const [dNumber, setDNumber] = useState('');
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showChoiceDialog, setShowChoiceDialog] = useState(false);
  const [usageHistory, setUsageHistory] = useState<UsageRecord[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddQuantityOption, setShowAddQuantityOption] = useState(false);
  const [quantityToAdd, setQuantityToAdd] = useState(0);
  const [quantityToAddToPO, setQuantityToAddToPO] = useState(0);
  const [editCurrentQuantity, setEditCurrentQuantity] = useState(0);
  const [editPendingPO, setEditPendingPO] = useState(0);
  const [originalScannedCode, setOriginalScannedCode] = useState('');
  
  // New PO-related state
  const [pendingPOs, setPendingPOs] = useState<PurchaseOrder[]>([]);
  const [showPODialog, setShowPODialog] = useState(false);
  const [showCreatePODialog, setShowCreatePODialog] = useState(false);
  const [newPOQuantity, setNewPOQuantity] = useState(0);
  const [newPOTrackingNumber, setNewPOTrackingNumber] = useState('');
  
  // New navigation state for better UX
  const [currentView, setCurrentView] = useState<'main' | 'usage' | 'edit'>('main');
  const [editTabValue, setEditTabValue] = useState(0);
  
  // PO editing state
  const [showEditPODialog, setShowEditPODialog] = useState(false);
  const [editingPO, setEditingPO] = useState<PurchaseOrder | null>(null);
  const [editPOQuantity, setEditPOQuantity] = useState(0);
  const [editPOTrackingNumber, setEditPOTrackingNumber] = useState('');
  const [editPOOrderDate, setEditPOOrderDate] = useState('');
  
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // State for number inputs to allow temporary empty states
  const [quantityToUseInput, setQuantityToUseInput] = useState('1');
  const [addQuantityInput, setAddQuantityInput] = useState('0');
  const [newPOQuantityInput, setNewPOQuantityInput] = useState('0');
  const [editPOQuantityInput, setEditPOQuantityInput] = useState('0');
  const [editCurrentQuantityInput, setEditCurrentQuantityInput] = useState('0');

  // Helper function for better number input handling
  const handleNumberInputChange = (value: string, setter: (val: number) => void, inputSetter: (val: string) => void, min: number = 0, max?: number) => {
    // Allow empty string or partial numbers during typing
    inputSetter(value);
    
    // Only parse and validate if it's a complete number
    if (value === '') {
      setter(min);
    } else {
      const parsed = parseInt(value);
      if (!isNaN(parsed)) {
        const finalValue = Math.max(min, max ? Math.min(max, parsed) : parsed);
        setter(finalValue);
      }
    }
  };

  // Remove file input - focus on live camera scanning only

  useEffect(() => {
    // Only use Redux store to determine admin status - no fallbacks for security
    console.log('Checking admin/owner status for user:', userName);
    console.log('User from Redux store:', user);
    
    // Only check from authenticated user in Redux store
    if (user && user.role) {
      const isAdminFromStore = user.role === 'ADMIN' || user.role === 'OWNER';
      console.log('Is admin/owner from Redux store:', isAdminFromStore);
      setIsAdmin(isAdminFromStore);
      
      // Auto-fill userName with user's full name
      if (user.fullName) {
        const fullName = `${user.fullName}`.trim();
        console.log('Auto-filling userName with:', fullName);
        setUserName(fullName);
      } else if (user.email) {
        // Fallback to email if no name is available
        setUserName(user.email);
      }
    } else {
      console.log('❌ No authenticated user found in store');
      setIsAdmin(false);
      setUserName(''); // Clear userName if no user
    }

    // Note: Camera access will work on HTTP for development/testing
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isHTTPS = window.location.protocol === 'https:';
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    console.log('Security check:', { isIOS, isMobile, isHTTPS, isLocalhost, protocol: window.location.protocol, hostname: window.location.hostname });
    
    // Allow HTTP for all devices (remove HTTPS requirement)
    console.log('✅ Camera access enabled for HTTP connections');

    // Don't rely on stored camera permission for iOS devices
    if (!isIOS) {
      const previousPermission = localStorage.getItem('cameraPermissionGranted');
      if (previousPermission === 'true') {
        console.log('Camera permission was previously granted');
      }
    }

    return () => {
      stopScanning();
    };
  }, [user]); // Removed userName dependency to avoid infinite loop

  // Smart search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 300); // 300ms debounce
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setSearchLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Smart search function
  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true);
      setError('');
      
      // Get all items using public API and perform client-side smart search
      const response = await publicItemsAPI.searchItems();
      const items = (response as any)?.data || response || [];
      
      const searchResults = performSmartSearch(items, query);
      setSearchResults(searchResults.slice(0, 10)); // Limit to top 10 results
      setShowSearchResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search items. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Smart search algorithm (same as items page)
  const performSmartSearch = (itemsList: any[], query: string): SearchResultItem[] => {
    if (!query.trim()) return [];

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

      return { 
        ...item,
        score, 
        exactMatches, 
        partialMatches 
      };
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
        return (a.name || '').localeCompare(b.name || '');
      });
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSearchResultClick = async (item: SearchResultItem) => {
    try {
      setError('');
      setSuccess('');
      
      // Use the barcode to get full item details like when scanning
      const response = await barcodeAPI.scanBarcode(item.barcode || item.code || item.id.toString());
      const itemData = (response as any)?.data || response;
      
      setScannedItem(itemData);
      setOriginalScannedCode(item.barcode || item.code || item.id.toString());
      
      // Fetch usage history for this item
      if (itemData.id) {
        await fetchUsageHistory(itemData.id);
      }
      
      // Show choice dialog for admin, usage dialog for regular users
      if (isAdmin) {
        setShowChoiceDialog(true);
      } else {
        setShowUsageDialog(true);
      }
      
      // Clear search
      clearSearch();
    } catch (error: any) {
      console.error('Error getting item details:', error);
      setError(error.response?.data?.message || 'Item not found or barcode not configured');
    }
  };

  const startScanning = async () => {
    if (!userName.trim()) {
      setError('User name not loaded. Please refresh the page.');
      return;
    }

    try {
      setError('');
      setCameraError('');

      // Detect device type for better camera handling
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
      
      console.log('Device detection:', { isIOS, isMobile, isIOSSafari, userAgent: navigator.userAgent });
      
      // Check secure context first
      const isSecureContext = window.isSecureContext;
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      
      console.log('Security context check:', {
        isSecureContext,
        protocol,
        hostname,
        location: window.location.href
      });
      
      // Check if camera API is available
      console.log('Checking camera API availability:', {
        hasNavigator: !!navigator,
        hasMediaDevices: !!navigator.mediaDevices,
        hasGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
        isSecureContext
      });
      
      // Check if we're on HTTPS - required for camera access in most browsers
      if (!isSecureContext && !isLocalhost) {
        console.log('⚠️ Camera access requires HTTPS. Checking if HTTPS is available...');
        
        // Try to redirect to HTTPS if not already there
        if (window.location.protocol === 'http:') {
          console.log('Redirecting to HTTPS for camera access...');
          const httpsUrl = window.location.href.replace('http:', 'https:');
          window.location.href = httpsUrl;
          return;
        }
      }
      
      console.log('Attempting camera access on current protocol:', window.location.protocol);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Try to polyfill for older browsers
        const nav = navigator as any;
        console.log('Attempting to use legacy getUserMedia API...');
        
        if (nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia) {
          console.log('Found legacy getUserMedia API, creating polyfill');
          (navigator as any).mediaDevices = {
            getUserMedia: function(constraints: MediaStreamConstraints) {
              const getUserMedia = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia;
              return new Promise<MediaStream>((resolve, reject) => {
                getUserMedia.call(navigator, constraints, resolve, reject);
              });
            }
          };
        } else {
          console.error('No camera API found:', {
            mediaDevices: !!navigator.mediaDevices,
            getUserMedia: !!navigator.mediaDevices?.getUserMedia,
            legacyGetUserMedia: !!nav.getUserMedia,
            webkitGetUserMedia: !!nav.webkitGetUserMedia,
            mozGetUserMedia: !!nav.mozGetUserMedia,
            isSecureContext,
            protocol,
            hostname
          });
          
          // Force enable camera API for HTTP - create polyfill
          console.log('🔧 Creating getUserMedia polyfill for HTTP...');
          const getUserMedia = nav.getUserMedia || nav.webkitGetUserMedia || nav.mozGetUserMedia;
          if (getUserMedia) {
            (navigator as any).mediaDevices = {
              getUserMedia: function(constraints: MediaStreamConstraints) {
                return new Promise<MediaStream>((resolve, reject) => {
                  getUserMedia.call(navigator, constraints, resolve, reject);
                });
              }
            };
            console.log('✅ Polyfill created successfully');
          } else {
            throw new Error('No camera API available on this browser/device');
          }
        }
      } else {
        console.log('✅ Modern camera API available');
      }
      
      // Allow camera access on HTTP for all devices
      console.log('Attempting camera access on current protocol:', window.location.protocol);
      
      // Define constraints based on device
      let constraints: MediaStreamConstraints;
      
      if (isIOS) {
        // iOS-specific constraints - start with minimal for better compatibility
        constraints = {
          video: {
            facingMode: 'environment',
            // Don't specify too many constraints initially for iOS
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        };
        console.log('Using iOS-optimized constraints:', constraints);
      } else {
        // Standard constraints for other devices
        constraints = {
          video: {
            facingMode: { ideal: 'environment' },
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
            aspectRatio: { ideal: 16/9 },
            frameRate: { ideal: 30, max: 60 },
          }
        };
        console.log('Using standard constraints:', constraints);
      }

      // Request camera access
      try {
        console.log('Requesting camera access...');
        const testStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('✅ Camera access granted successfully');
        
        // Stop the test stream immediately
        testStream.getTracks().forEach(track => track.stop());
        
        // Store permission in localStorage for future use (but not for iOS as it's unreliable)
        if (!isIOS) {
          localStorage.setItem('cameraPermissionGranted', 'true');
        }
        
      } catch (permError: any) {
        console.error('Camera permission error:', permError);
        
        // Clear any stored permission as it's not valid
        localStorage.removeItem('cameraPermissionGranted');
        
        let errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
        
        if (permError instanceof Error) {
          console.log('Camera error details:', { 
            name: permError.name, 
            message: permError.message,
            isIOS: isIOS 
          });
          
          if (permError.name === 'NotAllowedError') {
            if (isIOS) {
              errorMessage = 'Camera access denied. On iPhone:\n1. Tap "Allow" when prompted\n2. If no prompt appears, go to Settings > Safari > Camera and select "Allow"\n3. Refresh this page and try again';
            } else {
              errorMessage = 'Camera access denied. Please:\n1. Click the camera icon in your browser\'s address bar\n2. Select "Allow" for camera access\n3. Refresh the page and try again';
            }
          } else if (permError.name === 'NotFoundError') {
            errorMessage = 'No camera found on this device.';
          } else if (permError.name === 'NotSupportedError') {
            errorMessage = 'Camera is not supported on this device/browser.';
          } else if (permError.name === 'NotReadableError') {
            errorMessage = 'Camera is being used by another application. Please close other camera apps and try again.';
          } else if (permError.name === 'AbortError') {
            errorMessage = 'Camera access request was cancelled. Please try again.';
          } else if (permError.name === 'OverconstrainedError') {
            if (isIOS) {
              // Try multiple fallback strategies for iOS
              console.log('Trying fallback constraints for iOS...');
              let fallbackWorked = false;
              
              // Strategy 1: Basic video constraints
              try {
                const fallbackConstraints1 = { video: { facingMode: 'environment' } };
                const fallbackStream1 = await navigator.mediaDevices.getUserMedia(fallbackConstraints1);
                console.log('✅ iOS fallback strategy 1 worked (basic environment)');
                fallbackStream1.getTracks().forEach(track => track.stop());
                fallbackWorked = true;
              } catch (fallbackError1) {
                console.log('iOS fallback strategy 1 failed, trying strategy 2...');
                
                // Strategy 2: Minimal video constraints
                try {
                  const fallbackConstraints2 = { video: true };
                  const fallbackStream2 = await navigator.mediaDevices.getUserMedia(fallbackConstraints2);
                  console.log('✅ iOS fallback strategy 2 worked (minimal)');
                  fallbackStream2.getTracks().forEach(track => track.stop());
                  fallbackWorked = true;
                } catch (fallbackError2) {
                  console.log('iOS fallback strategy 2 failed, trying strategy 3...');
                  
                  // Strategy 3: Try with specific width/height only
                  try {
                    const fallbackConstraints3 = { 
                      video: { 
                        width: 640, 
                        height: 480 
                      } 
                    };
                    const fallbackStream3 = await navigator.mediaDevices.getUserMedia(fallbackConstraints3);
                    console.log('✅ iOS fallback strategy 3 worked (basic dimensions)');
                    fallbackStream3.getTracks().forEach(track => track.stop());
                    fallbackWorked = true;
                  } catch (fallbackError3) {
                    console.error('All iOS fallback strategies failed:', { fallbackError1, fallbackError2, fallbackError3 });
                  }
                }
              }
              
              if (!fallbackWorked) {
                errorMessage = 'Camera setup failed on iPhone. Please ensure you have a camera and Safari has camera permissions enabled in Settings > Safari > Camera > Allow.';
                setCameraError(errorMessage);
                return;
              }
            } else {
              errorMessage = 'Camera constraints not supported. Please try again.';
            }
          } else if (permError.name === 'TypeError' && permError.message.includes('getUserMedia')) {
            if (!isSecureContext) {
              errorMessage = 'Camera access requires HTTPS. Please access this page using https:// instead of http://';
            } else {
              errorMessage = 'Camera API not available. Please ensure you\'re using a supported browser.';
            }
          }
        }
        
        if (permError.name !== 'OverconstrainedError' || !isIOS) {
          setCameraError(errorMessage);
          return;
        }
      }

      setIsScanning(true);

      // Wait for video element to be rendered in DOM and accessible
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Ensure video element exists before proceeding
      const videoCheck = document.getElementById('video-element');
      if (!videoCheck) {
        throw new Error('Video element not found in DOM. Please try again.');
      }

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

      // Get video element
      const videoElement = document.getElementById('video-element') as HTMLVideoElement;
      if (!videoElement) {
        throw new Error('Video element not found');
      }

      // Start continuous scanning
      try {
        // First try using ZXing's built-in camera handling
        try {
          await codeReader.decodeFromVideoDevice(null, 'video-element', (result, error) => {
            if (result) {
              console.log('✅ Barcode detected:', result.getText());
              stopScanning();
              handleBarcodeScanned(result.getText());
            }
            if (error && !(error.name === 'NotFoundException')) {
              console.debug('Scan attempt error:', error.message);
            }
          });
          console.log('✅ ZXing camera initialization successful');
        } catch (zxingError) {
          const errorMessage = zxingError instanceof Error ? zxingError.message : String(zxingError);
          console.log('❌ ZXing camera failed, trying manual approach:', errorMessage);
          
          // Manual approach: get stream manually and connect to video element
          let stream;
          
          // Try different constraint combinations
          const constraintOptions = [
            { video: { facingMode: 'environment' } },
            { video: { facingMode: 'user' } },
            { video: true }
          ];
          
          for (const constraints of constraintOptions) {
            try {
              console.log('Trying constraints:', constraints);
              
              if (navigator.mediaDevices?.getUserMedia) {
                stream = await navigator.mediaDevices.getUserMedia(constraints);
              } else {
                // Use polyfilled mediaDevices
                const polyfillMediaDevices = (navigator as any).mediaDevices;
                if (polyfillMediaDevices?.getUserMedia) {
                  stream = await polyfillMediaDevices.getUserMedia(constraints);
                } else {
                  throw new Error('No getUserMedia available');
                }
              }
              
              console.log('✅ Got camera stream with constraints:', constraints);
              break;
                         } catch (constraintError) {
               const constraintErrorMessage = constraintError instanceof Error ? constraintError.message : String(constraintError);
               console.log('Failed with constraints:', constraints, constraintErrorMessage);
               continue;
             }
          }
          
          if (!stream) {
            throw new Error('Could not get camera stream with any constraints');
          }
          
          // Set up video element manually
          videoElement.srcObject = stream;
          videoElement.style.display = 'block';
          
          // Wait for video to load and start playing
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000);
            
            videoElement.onloadedmetadata = async () => {
              try {
                await videoElement.play();
                console.log('✅ Video is playing');
                clearTimeout(timeout);
                resolve();
              } catch (playError) {
                clearTimeout(timeout);
                reject(playError);
              }
            };
            
            videoElement.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Video load error'));
            };
          });
          
                     // Now decode from the video element - use continuous scanning
           const scanVideo = async () => {
             if (!codeReaderRef.current || !isScanning) return;
             
             try {
               const result = await codeReader.decodeFromVideoElement(videoElement);
               if (result) {
                 console.log('✅ Barcode detected via manual setup:', result.getText());
                 stopScanning();
                 handleBarcodeScanned(result.getText());
                 return;
               }
             } catch (error) {
               // Ignore "not found" errors and continue scanning
               if (error instanceof Error && !error.message.includes('No MultiFormat Readers were able to detect the code')) {
                 console.debug('Manual scan attempt error:', error.message);
               }
             }
             
             // Continue scanning if no result found
             if (isScanning) {
               setTimeout(scanVideo, 100); // Scan every 100ms
             }
           };
           
           // Start the scanning loop
           scanVideo();
          
          console.log('✅ Manual camera setup successful');
        }
      } catch (scanError) {
        console.error('❌ All scanning methods failed:', scanError);
        const scanErrorMessage = scanError instanceof Error ? scanError.message : String(scanError);
        setCameraError(`Failed to initialize camera: ${scanErrorMessage}. Try refreshing the page or check camera permissions.`);
        setIsScanning(false);
      }

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

  // File input removed - focusing on live camera scanning only

  const handleBarcodeScanned = async (barcode: string) => {
    console.log(`📱 Scanned barcode: ${barcode}`);
    
    try {
      setScannedItem(null);
      
      // Clear previous state
      setShowUsageDialog(false);
      setQuantityToUse(1);
      setQuantityToUseInput('1');
      setUserName('');
      setDepartment('');
      setDNumber('');
      setNotes('');
      setError('');
      setSuccess('');
      
      const response = await barcodeAPI.scanBarcode(barcode);
      const itemData = (response as any)?.data || response;
      
      setScannedItem(itemData);
      setOriginalScannedCode(barcode);
      
      // Fetch usage history for this item
      if (itemData.id) {
        await fetchUsageHistory(itemData.id);
        // Also fetch pending POs for admin users
        if (isAdmin) {
          await fetchPendingPOs(itemData.id);
        }
      }
      
      // Show choice dialog for admin, usage dialog for regular users
      if (isAdmin) {
        setShowChoiceDialog(true);
      } else {
        setShowUsageDialog(true);
      }
      
    } catch (error: any) {
      console.error('Error scanning barcode:', error);
      if (error.response?.status === 404) {
        setError(`No item found with barcode/code: ${barcode}`);
      } else {
        setError('Error scanning barcode. Please try again.');
      }
      // Clear the original scanned code on error
      setOriginalScannedCode('');
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
      // For now, we'll skip usage history since it's not implemented in the API
      // In a real implementation, you'd have an endpoint like /api/usage/item/{itemId}
      setUsageHistory([]);
    } catch (err) {
      console.error('Error fetching usage history:', err);
      setUsageHistory([]);
    }
  };

  const recordUsage = async () => {
    // Add debug logging for validation
    console.log('=== VALIDATION DEBUG ===');
    console.log('dNumber state before validation:', dNumber);
    console.log('dNumber.trim() result:', dNumber.trim());
    console.log('dNumber.trim() length:', dNumber.trim().length);
    console.log('!dNumber.trim():', !dNumber.trim());
    console.log('========================');
    
    if (!scannedItem || !userName.trim() || !department.trim() || !dNumber.trim()) {
      setError('Missing required information (name, department, and D number)');
      return;
    }

    // Validate that quantity to use doesn't exceed current inventory (not available quantity)
    const currentInventory = scannedItem.currentInventory || 0;
    if (quantityToUse > currentInventory) {
      setError(`Cannot use ${quantityToUse} units. Only ${currentInventory} units are currently available in inventory. (Note: Pending PO quantities cannot be used until received)`);
      return;
    }

    if (quantityToUse <= 0) {
      setError('Please enter a valid quantity to use');
      return;
    }

    try {
      const usageData = {
        barcode: originalScannedCode,
        userName: userName.trim(),
        quantityUsed: quantityToUse,
        notes: notes.trim(),
        department: department.trim(),
        dNumber: dNumber.trim() // Include D number as separate field
      };

      // Add detailed frontend debug logging
      console.log('=== FRONTEND USAGE DATA DEBUG ===');
      console.log('dNumber state value:', dNumber);
      console.log('dNumber after trim:', dNumber.trim());
      console.log('dNumber type:', typeof dNumber);
      console.log('dNumber === null:', dNumber === null);
      console.log('dNumber === "null":', dNumber === 'null');
      console.log('dNumber length:', dNumber.length);
      console.log('Complete usageData object:', usageData);
      console.log('JSON.stringify(usageData):', JSON.stringify(usageData));
      console.log('================================');

      const response = await barcodeAPI.recordUsage(usageData);
      
      setSuccess(`Successfully recorded usage: ${quantityToUse} units used by ${userName} (${department} - ${dNumber})`);
      
      // Reset form but keep dialog open to show updated quantities
      setQuantityToUse(1);
      setNotes('');
      setDepartment('');
      setDNumber('');
      setError(''); // Clear any previous errors
      
      // Refresh the item data to show updated quantities and check for alerts
      try {
        const refreshResponse = await barcodeAPI.scanBarcode(originalScannedCode);
        const refreshData = (refreshResponse as any)?.data || refreshResponse;
        setScannedItem(refreshData);
      } catch (refreshError) {
        console.error('Error refreshing item data:', refreshError);
      }
      
    } catch (err: any) {
      // Extract error message from the response
      let errorMsg = 'Error recording usage';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const addQuantityToItem = async () => {
    if (!scannedItem || quantityToAdd <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    try {
      const newQuantity = (scannedItem.currentInventory || 0) + quantityToAdd;
      
      await itemsAPI.update(scannedItem.id, {
        name: scannedItem.name || '',
        description: scannedItem.description || '',
        englishDescription: scannedItem.englishDescription || '',
        code: scannedItem.code || '',
        quantity: newQuantity,
        minQuantity: scannedItem.safetyStockThreshold || 0,
        pendingPO: scannedItem.pendingPO || 0,
        location: scannedItem.location || '',
        equipment: scannedItem.equipment || '',
        category: scannedItem.category || 'C',
        weeklyData: '',
      });
      
      setSuccess(`Added ${quantityToAdd} units to inventory!`);
      setQuantityToAdd(0);
      setAddQuantityInput('0');
      
      // Refresh the item data
      try {
        const refreshResponse = await barcodeAPI.scanBarcode(originalScannedCode);
        const refreshData = (refreshResponse as any)?.data || refreshResponse;
        setScannedItem(refreshData);
      } catch (refreshError) {
        console.error('Error refreshing item data:', refreshError);
      }
      
    } catch (error: any) {
      console.error('Error adding quantity:', error);
      setError('Error adding quantity. Please try again.');
    }
  };

  // Fetch pending POs for an item
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

  // Create a new purchase order
  const createPurchaseOrder = async () => {
    if (!scannedItem || newPOQuantity <= 0) {
      setError('Please enter a valid PO quantity');
      return;
    }

    try {
      const response = await barcodeAPI.createPurchaseOrder(scannedItem.barcode || '', {
        quantity: newPOQuantity,
        trackingNumber: newPOTrackingNumber || undefined,
      });

      setSuccess(`Created Purchase Order for ${newPOQuantity} units of ${scannedItem.name}`);
      
      // Update the scanned item state with new pending PO total
      const responseData = (response as any)?.data || response || {};
      if (responseData.item) {
        setScannedItem({
          ...scannedItem,
          pendingPO: responseData.item.pendingPO,
        });
      }
      
      // Refresh pending POs list
      await fetchPendingPOs(scannedItem.id);
      
      setNewPOQuantity(0);
      setNewPOTrackingNumber('');
    } catch (error) {
      console.error('Error creating PO:', error);
      setError('Failed to create Purchase Order. Please try again.');
    }
  };

  const handleEditPO = (po: PurchaseOrder) => {
    setEditingPO(po);
    setEditPOQuantity(po.quantity);
    setEditPOQuantityInput(po.quantity.toString());
    setEditPOTrackingNumber(po.trackingNumber || '');
    setEditPOOrderDate(po.orderDate.split('T')[0]);
    setShowEditPODialog(true);
  };

  const updatePurchaseOrder = async () => {
    if (!editingPO || !scannedItem) return;

    try {
      await purchaseOrderAPI.update(scannedItem.id, editingPO.id, {
        quantity: editPOQuantity,
        trackingNumber: editPOTrackingNumber,
        orderDate: editPOOrderDate ? `${editPOOrderDate}T00:00:00` : undefined,
      });

      await fetchPendingPOs(scannedItem.id);
      setSuccess('Purchase order updated successfully!');
      setShowEditPODialog(false);
      setEditingPO(null);
      // Reset form
      setEditPOQuantity(0);
      setEditPOTrackingNumber('');
      setEditPOOrderDate('');
    } catch (error) {
      console.error('Error updating purchase order:', error);
      setError('Failed to update purchase order');
    }
  };

  // Mark a purchase order as arrived
  const markPOAsArrived = async (purchaseOrderId: number) => {
    try {
      const response = await barcodeAPI.markPurchaseOrderAsArrived(purchaseOrderId);
      const responseData = (response as any)?.data || response || {};
      
      setSuccess(`Purchase Order marked as arrived. Added ${responseData.arrivedQuantity || 0} units to inventory.`);
      
      // Update the scanned item state
      if (responseData.item && scannedItem) {
        setScannedItem({
          ...scannedItem,
          currentInventory: responseData.item.currentInventory,
          pendingPO: responseData.item.pendingPO,
          availableQuantity: responseData.item.currentInventory,
        });
      }
      
      // Refresh pending POs list
      await fetchPendingPOs(scannedItem!.id);
    } catch (error) {
      console.error('Error marking PO as arrived:', error);
      setError('Failed to mark Purchase Order as arrived. Please try again.');
    }
  };

  // Legacy function for backward compatibility
  const addQuantityToPO = async () => {
    if (!scannedItem || quantityToAddToPO <= 0) {
      setError('Please enter a valid PO quantity');
      return;
    }

    try {
      const response = await barcodeAPI.createPurchaseOrder(scannedItem.barcode || '', {
        quantity: quantityToAddToPO,
      });

      setSuccess(`Created Purchase Order for ${quantityToAddToPO} units of ${scannedItem.name}`);
      
      // Update the scanned item state
      const responseData = (response as any)?.data || response || {};
      if (responseData.item) {
      setScannedItem({
        ...scannedItem,
          pendingPO: responseData.item.pendingPO,
      });
      }
      
      setQuantityToAddToPO(0);
      setShowAddQuantityOption(false);
    } catch (error) {
      console.error('Error adding PO quantity:', error);
      setError('Failed to add PO quantity. Please try again.');
    }
  };

  const closeUsageDialog = () => {
    setShowUsageDialog(false);
    setShowEditDialog(false);
    setShowChoiceDialog(false);
    setShowPODialog(false);
    setShowCreatePODialog(false);
    setScannedItem(null);
    setOriginalScannedCode('');
    setQuantityToUse(1);
    setNotes('');
    setDepartment('');
    setDNumber('');
    setError('');
    setSuccess('');
    setUsageHistory([]);
    setQuantityToAdd(0);
    setQuantityToAddToPO(0);
    setEditCurrentQuantity(0);
    setEditPendingPO(0);
    setPendingPOs([]);
    setNewPOQuantity(0);
    setNewPOTrackingNumber('');
  };

  const handleChoiceUsage = () => {
    setShowChoiceDialog(false);
    setCurrentView('usage');
    setShowUsageDialog(true);
  };

  const handleChoiceEdit = () => {
    setShowChoiceDialog(false);
    setCurrentView('edit');
    openEditDialog();
  };

  const handleGoBack = () => {
    if (currentView === 'usage' || currentView === 'edit') {
      // Go back to the item card view
      setCurrentView('main');
      setShowUsageDialog(false);
      setShowEditDialog(false);
      setShowPODialog(false);
      setShowCreatePODialog(false);
      setEditTabValue(0);
      setError('');
      setSuccess('');
      // Keep the scannedItem and show the choice dialog again
      if (scannedItem) {
        setShowChoiceDialog(true);
      }
    } else {
      // Close everything and go back to scanner
      closeUsageDialog();
    }
  };

  const openEditDialog = () => {
    if (scannedItem) {
      setEditCurrentQuantity(scannedItem.currentInventory || 0);
      setEditCurrentQuantityInput((scannedItem.currentInventory || 0).toString());
      setEditTabValue(0);
      setShowEditDialog(true);
    }
  };

  const closeEditDialog = () => {
    setShowEditDialog(false);
    setEditCurrentQuantity(0);
    setEditPendingPO(0);
    setEditTabValue(0);
    setNewPOQuantity(0);
    setNewPOTrackingNumber('');
    setError('');
    setSuccess('');
  };

  const saveItemEdits = async () => {
    if (!scannedItem) {
      setError('No item selected for editing');
      return;
    }

    try {
      await itemsAPI.update(scannedItem.id, {
        name: scannedItem.name || '',
        description: scannedItem.description || '',
        englishDescription: scannedItem.englishDescription || '',
        code: scannedItem.code || '',
        quantity: editCurrentQuantity,
        minQuantity: scannedItem.safetyStockThreshold || 0,
        pendingPO: editPendingPO,
        location: scannedItem.location || '',
        equipment: scannedItem.equipment || '',
        category: scannedItem.category || 'C',
        department: scannedItem.department || '', // Include department field
        weeklyData: '',
      });

      setSuccess(`Successfully updated ${scannedItem.name}. Current: ${editCurrentQuantity}, PO: ${editPendingPO}`);
      
      // Update the scanned item state
      setScannedItem({
        ...scannedItem,
        currentInventory: editCurrentQuantity,
        pendingPO: editPendingPO,
        availableQuantity: editCurrentQuantity + editPendingPO,
      });
      
      closeEditDialog();
    } catch (error: any) {
      console.error('Error updating item:', error);
      
      let errorMessage = 'Failed to update item. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data && typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      
      // Auto-clear error after 6 seconds
      setTimeout(() => {
        setError('');
      }, 6000);
    }
  };

  const scannerContent = (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
      p: { xs: 2, sm: 3, md: 4 },
    }}>
      {/* Enhanced Header Section */}
      <Fade in timeout={800}>
        <Paper 
          elevation={0}
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
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
                <ScannerIcon sx={{ fontSize: 32 }} />
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
                  Barcode Scanner
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.9rem', md: '1rem' }
                  }}
                >
                  Scan items to track usage and manage inventory
                </Typography>
              </Box>
            </Box>
            {error && (
              <Zoom in>
                <Alert 
                  severity="error" 
                  onClose={() => setError('')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    '& .MuiAlert-icon': { color: 'white' },
                    borderRadius: 2,
                  }}
                >
                  {error}
                </Alert>
              </Zoom>
            )}
            {success && (
              <Zoom in>
                <Alert 
                  severity="success" 
                  onClose={() => setSuccess('')}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'white',
                    '& .MuiAlert-icon': { color: 'white' },
                    borderRadius: 2,
                  }}
                >
                  {success}
                </Alert>
              </Zoom>
            )}
          </Box>
        </Paper>
      </Fade>

      {/* Enhanced User Name Display */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '200ms' }}>
        <Card sx={{
          mb: 4,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.08)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${alpha(theme.palette.info.main, 0.15)}`,
          }
        }}>
          <CardHeader
            avatar={
              <Avatar sx={{
                background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
                color: 'white',
              }}>
                <PersonIcon />
              </Avatar>
            }
            title={
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                User Identification
              </Typography>
            }
            subheader={
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                {user ? "Authenticated user session" : "Manual identification required"}
              </Typography>
            }
            action={
              isAdmin && (
                <Chip 
                  label="ADMIN" 
                  color="error" 
                  variant="filled"
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.3)}`,
                  }}
                />
              )
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <TextField
              fullWidth
              label={user ? "Logged in as" : "Your name"}
              value={userName}
              placeholder={user ? "Loading user name..." : "Enter your name to start scanning"}
              variant={user ? "filled" : "outlined"}
              onChange={(e) => {
                if (!user) {
                  setUserName(e.target.value);
                }
              }}
              InputProps={{
                readOnly: !!user,
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ 
                      color: userName ? theme.palette.info.main : theme.palette.action.disabled,
                      fontSize: 20
                    }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: userName ? alpha(theme.palette.info.light, 0.1) : 'transparent',
                  borderColor: userName ? alpha(theme.palette.info.main, 0.3) : alpha(theme.palette.divider, 0.23),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: userName ? theme.palette.info.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  }
                },
                '& .MuiFilledInput-root': {
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.info.light, 0.15),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.light, 0.2),
                  },
                  '&.Mui-focused': {
                    backgroundColor: alpha(theme.palette.info.light, 0.2),
                  }
                },
                '& .MuiInputBase-input': {
                  color: 'text.primary',
                  fontWeight: 500,
                  fontSize: '1rem',
                }
              }}
            />
            <Alert 
              severity={user ? "success" : "info"}
              icon={user ? undefined : <PersonIcon />}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(user ? theme.palette.success.main : theme.palette.info.main, 0.3)}`,
                background: `linear-gradient(135deg, ${alpha(user ? theme.palette.success.light : theme.palette.info.light, 0.1)} 0%, ${alpha(user ? theme.palette.success.light : theme.palette.info.light, 0.05)} 100%)`,
                '& .MuiAlert-message': {
                  fontWeight: 500,
                }
              }}
            >
              {user 
                ? "Your name is automatically set from your account and will be recorded with each item usage for tracking purposes."
                : "Please enter your name - it will be recorded with each item usage for tracking purposes."
              }
              {isAdmin && (
                <Box component="span" sx={{ color: theme.palette.error.main, fontWeight: 700, ml: 1 }}>
                  (Admin privileges active)
                </Box>
              )}
            </Alert>
          </CardContent>
        </Card>
      </Slide>

      {/* Enhanced Smart Search */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '400ms' }}>
        <Box>
          <Card sx={{
          mb: 4,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
          border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 25px ${alpha(theme.palette.secondary.main, 0.15)}`,
          }
        }}>
          <CardHeader
            avatar={
              <Avatar sx={{
                background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                color: 'white',
              }}>
                <SearchIcon />
              </Avatar>
            }
            title={
              <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                Smart Item Search
              </Typography>
            }
            subheader={
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                Find items by name, code, or description without scanning
              </Typography>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search items by name, code, description... (e.g., 'white belt', 'B001')"
              value={searchQuery}
              onChange={handleSearchChange}
              disabled={!userName.trim()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ 
                      color: searchQuery ? theme.palette.secondary.main : theme.palette.action.disabled,
                      fontSize: 20
                    }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={clearSearch} 
                      size="small" 
                      edge="end"
                      sx={{
                        color: theme.palette.secondary.main,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                        }
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: searchQuery ? alpha(theme.palette.secondary.light, 0.1) : 'transparent',
                  borderColor: searchQuery ? alpha(theme.palette.secondary.main, 0.3) : alpha(theme.palette.divider, 0.23),
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: searchQuery ? theme.palette.secondary.main : theme.palette.primary.main,
                  },
                  '&.Mui-focused': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: alpha(theme.palette.action.disabledBackground, 0.5),
                  }
                }
              }}
            />

            {searchQuery && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                mb: 2,
                p: 2,
                borderRadius: 2,
                background: alpha(theme.palette.secondary.light, 0.1),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {searchLoading ? (
                    <>
                      <LinearProgress sx={{ width: 20, height: 4, borderRadius: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Searching...
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.secondary.main }}>
                        Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                      </Typography>
                      {searchResults.length > 0 && (
                        <Chip 
                          label={`${searchResults.length} items`}
                          size="small"
                          color="secondary"
                          sx={{ fontWeight: 500 }}
                        />
                      )}
                    </>
                  )}
                </Box>
                <IconButton 
                  onClick={() => setShowSearchResults(!showSearchResults)}
                  disabled={searchResults.length === 0}
                  sx={{
                    color: theme.palette.secondary.main,
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    }
                  }}
                >
                  {showSearchResults ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
            )}

            <Collapse in={showSearchResults && searchResults.length > 0} timeout={300}>
              <Paper 
                variant="outlined" 
                sx={{ 
                  maxHeight: 350, 
                  overflow: 'auto',
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  mb: 2,
                }}
              >
                <List dense>
                  {searchResults.map((item, index) => (
                    <Box key={item.id}>
                      <ListItemButton
                        onClick={() => handleSearchResultClick(item)}
                        sx={{
                          py: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                            transform: 'translateX(4px)',
                          }
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600 }}>
                                {item.name}
                              </Typography>
                              {item.code && (
                                <Chip 
                                  label={item.code} 
                                  size="small" 
                                  variant="outlined"
                                  color="secondary"
                                  sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                                />
                              )}
                              {item.category && (
                                <Chip 
                                  label={`Cat ${item.category}`}
                                  size="small"
                                  color={item.category === 'A' ? 'error' : item.category === 'B' ? 'warning' : 'success'}
                                  sx={{ fontSize: '0.7rem', fontWeight: 500 }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              {item.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                  {item.description}
                                </Typography>
                              )}
                              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                {item.location && (
                                  <Chip
                                    label={`📍 ${item.location}`}
                                    variant="outlined"
                                    size="small"
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                )}
                                {item.currentInventory !== undefined && (
                                  <Chip
                                    label={`📦 Stock: ${item.currentInventory}`}
                                    variant="outlined"
                                    size="small"
                                    color={item.currentInventory > 0 ? 'success' : 'error'}
                                    sx={{ fontSize: '0.7rem' }}
                                  />
                                )}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItemButton>
                      {index < searchResults.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Paper>
            </Collapse>

            <Alert 
              severity="info"
              icon={<SearchIcon />}
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                background: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.1)} 0%, ${alpha(theme.palette.info.light, 0.05)} 100%)`,
                '& .MuiAlert-message': {
                  fontWeight: 500,
                }
              }}
            >
              Click on any search result to view item details and record usage, just like scanning a barcode.
            </Alert>
          </CardContent>
        </Card>
        </Box>
      </Slide>

      {/* Enhanced Scanner Controls */}
      <Slide in direction="up" timeout={600} style={{ transitionDelay: '600ms' }}>
        <Box>
          <Card sx={{
            mb: 4,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
            }
          }}>
            <CardHeader
              avatar={
                <Avatar sx={{
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                }}>
                  <ScannerIcon />
                </Avatar>
              }
              title={
                <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                  Camera Scanner
                </Typography>
              }
              subheader={
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                  Use your device camera to scan barcodes
                </Typography>
              }
            />
            <CardContent sx={{ pt: 0 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ScannerIcon />}
                  onClick={isScanning ? stopScanning : startScanning}
                  disabled={!userName.trim()}
                  sx={{
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                    '&:hover': {
                      background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                    },
                    '&:disabled': {
                      background: theme.palette.action.disabledBackground,
                      color: theme.palette.action.disabled,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {isScanning ? 'Stop Scanning' : 'Start Camera Scan'}
                </Button>
                
                {isScanning && (
                  <Zoom in>
                    <IconButton 
                      onClick={toggleTorch} 
                      sx={{
                        bgcolor: torchEnabled ? alpha(theme.palette.warning.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                        border: `2px solid ${torchEnabled ? theme.palette.warning.main : theme.palette.grey[400]}`,
                        color: torchEnabled ? theme.palette.warning.main : theme.palette.grey[600],
                        '&:hover': {
                          bgcolor: torchEnabled ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.grey[500], 0.2),
                          transform: 'scale(1.1)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {torchEnabled ? <FlashlightOnIcon /> : <FlashlightOffIcon />}
                    </IconButton>
                  </Zoom>
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

          {/* Manual Entry
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
          </Box> */}
        </Box>
      </Paper>

      {/* Success Messages - Only show if dialog is NOT open */}
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
        onClose={closeUsageDialog} 
        maxWidth="md" 
        fullWidth
        fullScreen={isXsScreen} // Full screen on mobile
        PaperProps={{
          sx: {
            margin: { xs: 1, sm: 2 }, // Reduced margin on mobile
            maxHeight: { xs: '95vh', sm: '90vh' }, // Better height management
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Record Item Usage</Typography>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleGoBack}
              sx={{ minWidth: 'auto', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
            >
              ← Back
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 1, sm: 3 } }}>
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
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    mb: 2,
                    wordBreak: 'break-word'
                  }}>
                    {scannedItem.name || 'Unknown Item'}
                  </Typography>
                  
                  {/* Mobile-first responsive grid */}
                  <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
                    {/* 
                      Display fields are controlled by Admin Settings -> Item Display Configuration
                      The backend only returns fields that are configured to be shown.
                      These conditional renders ensure we only show fields that exist in the response.
                    */}
                    {scannedItem.code && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          <strong>Code:</strong> {scannedItem.code}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.location && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}>
                          <strong>Location:</strong> {scannedItem.location}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.description && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}>
                          <strong>Description:</strong> {scannedItem.description}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.englishDescription && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}>
                          <strong>English Description:</strong> {scannedItem.englishDescription}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.equipment && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          wordBreak: 'break-word'
                        }}>
                          <strong>Equipment:</strong> {scannedItem.equipment}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.category && (
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            <strong>Category:</strong>
                          </Typography>
                          <Chip 
                            label={scannedItem.category} 
                            size="small"
                            color={scannedItem.category === 'A' ? 'error' : 
                                   scannedItem.category === 'B' ? 'warning' : 'success'}
                            sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                          />
                        </Box>
                      </Grid>
                    )}
                    {scannedItem.currentInventory !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          <strong>Current Inventory:</strong> {scannedItem.currentInventory}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.safetyStockThreshold !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          <strong>Safety Stock:</strong> {scannedItem.safetyStockThreshold}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.pendingPO !== undefined && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                          <strong>Pending PO:</strong> {scannedItem.pendingPO}
                        </Typography>
                      </Grid>
                    )}
                    {scannedItem.barcode && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          wordBreak: 'break-all' // Force break for long barcodes
                        }}>
                          <strong>Barcode:</strong> {scannedItem.barcode}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                  
                  {/* <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <Chip 
                      icon={<InventoryIcon />}
                      label={`Available: ${scannedItem.currentInventory}`}
                      color={scannedItem.availableQuantity > 0 ? 'success' : 'error'}
                    />
                  </Box> */}
                </CardContent>
              </Card>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Quantity to Use"
                  type="number"
                  value={quantityToUseInput}
                  onChange={(e) => handleNumberInputChange(
                    e.target.value, 
                    setQuantityToUse, 
                    setQuantityToUseInput, 
                    1, 
                    scannedItem?.currentInventory || 999999
                  )}
                  onBlur={(e) => {
                    // Ensure valid value on blur
                    const maxVal = scannedItem?.currentInventory || 999999;
                    const value = parseInt(e.target.value) || 1;
                    const finalValue = Math.max(1, Math.min(maxVal, value));
                    setQuantityToUse(finalValue);
                    setQuantityToUseInput(finalValue.toString());
                  }}
                  inputProps={{ min: 1, max: scannedItem?.currentInventory || 999999 }}
                  size="small"
                  fullWidth
                  placeholder="Enter quantity"
                />
                
                <FormControl size="small" required fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    label="Department"
                  >
                    <MenuItem value="Equipment">Equipment</MenuItem>
                    <MenuItem value="Production">Production</MenuItem>
                    <MenuItem value="Process">Process</MenuItem>
                    <MenuItem value="Quality">Quality</MenuItem>
                    <MenuItem value="Facility">Facility</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
                
                <TextField
                  label="D Number"
                  value={dNumber}
                  onChange={(e) => setDNumber(e.target.value)}
                  placeholder="e.g., D001, D123"
                  size="small"
                  required
                  fullWidth
                />
                
                <TextField
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={2}
                  size="small"
                  fullWidth
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Button onClick={closeUsageDialog} fullWidth sx={{ order: { xs: 2, sm: 1 } }}>
            Close
          </Button>
          <Button 
            onClick={recordUsage} 
            variant="contained"
            disabled={!userName.trim() || !department.trim() || !dNumber.trim() || quantityToUse <= 0 || (scannedItem ? quantityToUse > (scannedItem.currentInventory || 0) : false)}
            fullWidth
            sx={{ order: { xs: 1, sm: 2 } }}
          >
            Record Usage
          </Button>
        </DialogActions>
      </Dialog>

      {/* Admin Choice Dialog */}
      <Dialog 
        open={showChoiceDialog} 
        onClose={closeUsageDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isXsScreen} // Full screen on mobile
        PaperProps={{
          sx: {
            margin: { xs: 1, sm: 2 },
            maxHeight: { xs: '95vh', sm: '90vh' },
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Select Action</Typography>
            <Chip label="Admin" color="primary" size="small" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }} />
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          {scannedItem && (
            <Box sx={{ py: 2 }}>
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    fontSize: { xs: '1.1rem', sm: '1.25rem' },
                    wordBreak: 'break-word',
                    mb: 2
                  }}>
                    {scannedItem.name || 'Unknown Item'}
                  </Typography>
                  
                  {/* Mobile-optimized chip display */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    flexWrap: 'wrap',
                    '& .MuiChip-root': {
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 24, sm: 32 }
                    }
                  }}>
                    {scannedItem.code && (
                      <Chip 
                        label={`Code: ${scannedItem.code}`} 
                        variant="outlined" 
                        size="small"
                        sx={{ maxWidth: { xs: '100%', sm: 'none' } }}
                      />
                    )}
                    {scannedItem.currentInventory !== undefined && (
                      <Chip 
                        label={`Available: ${scannedItem.currentInventory}`} 
                        color={scannedItem.currentInventory > 0 ? "success" : "error"} 
                        size="small"
                        sx={{ maxWidth: { xs: '100%', sm: 'none' } }}
                      />
                    )}
                    {scannedItem.location && (
                      <Chip 
                        label={`📍 ${scannedItem.location}`} 
                        variant="outlined" 
                        size="small"
                        sx={{ 
                          maxWidth: { xs: '100%', sm: 'none' },
                          '& .MuiChip-label': {
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: { xs: '180px', sm: 'none' }
                          }
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="body1" gutterBottom sx={{ 
                mb: 3,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>
                What would you like to do with this item?
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleChoiceUsage}
                  startIcon={<InventoryIcon />}
                  sx={{ 
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                  fullWidth
                >
                  Record Item Usage
                </Button>
                
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  onClick={handleChoiceEdit}
                  startIcon={<EditIcon />}
                  sx={{ 
                    py: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                  fullWidth
                >
                  Edit Item & Manage POs
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button onClick={closeUsageDialog} fullWidth>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Modern Item Management Dialog */}
      <Dialog 
        open={showEditDialog} 
        onClose={closeEditDialog} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isXsScreen} // Full screen on mobile
        PaperProps={{
          sx: { 
            borderRadius: { xs: 0, sm: 4 },
            minHeight: { xs: '100vh', sm: '85vh' },
            bgcolor: '#f8fafc',
            margin: { xs: 0, sm: 2 }
          }
        }}
      >
        {/* Modern Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            right: 0,
            width: { xs: 100, sm: 200 },
            height: { xs: 100, sm: 200 },
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            transform: 'translate(50%, -50%)'
          }} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton 
                onClick={handleGoBack} 
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.15)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  mb: 0.5,
                  fontSize: { xs: '1.5rem', sm: '2.125rem' }
                }}>
                  Item Management Hub
                </Typography>
                <Typography variant="subtitle1" sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  wordBreak: 'break-word'
                }}>
                  {scannedItem?.name || 'Manage inventory and purchase orders'}
                </Typography>
          </Box>
            </Box>
          </Box>
        </Box>

        <DialogContent sx={{ p: 0, bgcolor: '#f8fafc' }}>
          {/* Success/Error Messages */}
          {(success || error) && (
            <Box sx={{ p: { xs: 2, sm: 3 }, pb: 0 }}>
          {success && (
                <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}
          {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
              )}
            </Box>
          )}

          {scannedItem && (
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
              {/* Item Overview Card */}
              <Card sx={{ 
                mb: 4, 
                borderRadius: { xs: 2, sm: 3 },
                background: 'linear-gradient(135deg, #ffffff 0%, #f0f4f8 100%)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.3)'
              }}>
                <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                  <Grid container spacing={{ xs: 2, sm: 4 }} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Typography variant="h4" sx={{ 
                        fontWeight: 700, 
                        color: '#2d3748',
                        mb: 2,
                        fontSize: { xs: '1.5rem', sm: '2.125rem' },
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        wordBreak: 'break-word'
                      }}>
                        {scannedItem.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: { xs: 2, sm: 3 }, mb: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'primary.main' 
                          }} />
                          <Typography variant="body1" color="text.secondary" sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            wordBreak: 'break-word'
                          }}>
                            <strong>Code:</strong> {scannedItem.code || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: 'success.main' 
                          }} />
                          <Typography variant="body1" color="text.secondary" sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            wordBreak: 'break-word'
                          }}>
                            <strong>Location:</strong> {scannedItem.location || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ 
                            width: 8, 
                            height: 8, 
                            borderRadius: '50%', 
                            bgcolor: scannedItem.displayDepartment === 'Public' ? 'info.main' : 'warning.main'
                          }} />
                          <Typography variant="body1" color="text.secondary" sx={{ 
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            wordBreak: 'break-word'
                          }}>
                            <strong>Department:</strong> {scannedItem.displayDepartment || 'Public (No Department)'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Inventory Stats */}
                  <Grid container spacing={{ xs: 1, sm: 2 }}>
                        <Grid item xs={4}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: { xs: 1, sm: 2 }, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                            color: 'white',
                            minHeight: { xs: 60, sm: 80 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography 
                              variant="h3" 
                              sx={{ 
                                fontWeight: 800, 
                                mb: 0.5,
                                fontSize: { xs: '1.2rem', sm: '2rem', md: '3rem' },
                                lineHeight: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {scannedItem.currentInventory || 0}
                        </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.9, 
                                fontWeight: 600,
                                fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                lineHeight: 1
                              }}
                            >
                              IN STOCK
                            </Typography>
                          </Box>
                      </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: { xs: 1, sm: 2 }, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                            color: 'white',
                            minHeight: { xs: 60, sm: 80 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography 
                              variant="h3" 
                              sx={{ 
                                fontWeight: 800, 
                                mb: 0.5,
                                fontSize: { xs: '1.2rem', sm: '2rem', md: '3rem' },
                                lineHeight: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {scannedItem.pendingPO || 0}
                        </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.9, 
                                fontWeight: 600,
                                fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                lineHeight: 1
                              }}
                            >
                              PENDING
                            </Typography>
                          </Box>
                      </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: { xs: 1, sm: 2 }, 
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #e53e3e 0%, #c53030 100%)',
                            color: 'white',
                            minHeight: { xs: 60, sm: 80 },
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                          }}>
                            <Typography 
                              variant="h3" 
                              sx={{ 
                                fontWeight: 800, 
                                mb: 0.5,
                                fontSize: { xs: '1.2rem', sm: '2rem', md: '3rem' },
                                lineHeight: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {scannedItem.safetyStockThreshold || 0}
                        </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.9, 
                                fontWeight: 600,
                                fontSize: { xs: '0.6rem', sm: '0.75rem' },
                                lineHeight: 1
                              }}
                            >
                              MIN STOCK
                            </Typography>
                          </Box>
                      </Grid>
                      </Grid>
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center',
                        p: 3,
                        borderRadius: 2,
                        bgcolor: 'grey.50',
                        border: '2px dashed',
                        borderColor: 'grey.300'
                      }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          📊 Barcode
                        </Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                          {scannedItem.barcode || originalScannedCode}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Action Selection */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ 
                  display: 'flex',
                  gap: 2,
                  p: 1,
                  bgcolor: 'white',
                  borderRadius: 3,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                }}>
                  <Button
                    variant={editTabValue === 0 ? "contained" : "text"}
                    onClick={() => setEditTabValue(0)}
                    sx={{ 
                      flex: pendingPOs.length === 0 ? 1 : 0.6,
                      py: 2,
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      ...(editTabValue === 0 && {
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
                      })
                    }}
                  >
                    📝 Edit Inventory
                  </Button>
                  {(pendingPOs.length > 0 || editTabValue === 1) && (
                    <Button
                      variant={editTabValue === 1 ? "contained" : "text"}
                      onClick={() => setEditTabValue(1)}
                      sx={{ 
                        flex: 1,
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: '1rem',
                        textTransform: 'none',
                        ...(editTabValue === 1 && {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          boxShadow: '0 4px 15px rgba(102,126,234,0.4)'
                        })
                      }}
                    >
                      🛒 Purchase Orders {pendingPOs.length > 0 && `(${pendingPOs.length})`}
                    </Button>
                  )}
                  {pendingPOs.length === 0 && editTabValue !== 1 && (
                    <Button
                      variant="outlined"
                      onClick={() => setEditTabValue(1)}
                      sx={{ 
                        flex: 0.4,
                        py: 2,
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        textTransform: 'none',
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#764ba2',
                          backgroundColor: 'rgba(102,126,234,0.04)'
                        }
                      }}
                    >
                      + Create PO
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Tab Content */}
              {editTabValue === 0 && (
                <Card sx={{ 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ 
                      fontWeight: 700, 
                      mb: 3, 
                      color: '#2d3748',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}>
                      🔧 Inventory Adjustment
                  </Typography>
                    
                    <Grid container spacing={3} alignItems="flex-end">
                      <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                          label="New Quantity"
                    type="number"
                    value={editCurrentQuantityInput}
                    onChange={(e) => handleNumberInputChange(e.target.value, setEditCurrentQuantity, setEditCurrentQuantityInput, 0)}
                    onBlur={(e) => {
                      // Ensure minimum value on blur
                      const val = parseInt(e.target.value) || 0;
                      setEditCurrentQuantity(Math.max(0, val));
                      setEditCurrentQuantityInput(Math.max(0, val).toString());
                    }}
                    inputProps={{ min: 0 }}
                          sx={{ 
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              fontSize: '1.2rem',
                              fontWeight: 600,
                              '& fieldset': {
                                borderWidth: 2
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          variant="contained"
                          size="large"
                          fullWidth
                          onClick={saveItemEdits}
                          sx={{ 
                            py: 2,
                            borderRadius: 2,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                            boxShadow: '0 4px 15px rgba(72,187,120,0.4)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)'
                            }
                          }}
                        >
                          💾 Save Changes
                        </Button>
                      </Grid>
                    </Grid>

                    {editCurrentQuantity !== (scannedItem.currentInventory || 0) && (
                      <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                        <Typography variant="body1">
                          <strong>Change Summary:</strong> {scannedItem.currentInventory || 0} → {editCurrentQuantity}
                          <span style={{ 
                            color: editCurrentQuantity > (scannedItem.currentInventory || 0) ? '#38a169' : '#e53e3e',
                            fontWeight: 700,
                            marginLeft: 8
                          }}>
                            ({editCurrentQuantity > (scannedItem.currentInventory || 0) ? '+' : ''}{editCurrentQuantity - (scannedItem.currentInventory || 0)})
                          </span>
                  </Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {editTabValue === 1 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {/* Create New PO */}
                  <Card sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow: '0 15px 35px rgba(102,126,234,0.4)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        ✨ Create New Purchase Order
                  </Typography>
                      
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                            label="Order Quantity"
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
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(255,255,255,0.95)',
                                borderRadius: 3,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                '& fieldset': {
                                  borderWidth: 2,
                                  borderColor: 'rgba(255,255,255,0.8)'
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255,255,255,1)'
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'rgba(255,255,255,1)'
                                }
                              },
                              '& .MuiInputLabel-root': {
                                color: '#2d3748',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(102,126,234,0.3)',
                                '&.Mui-focused': {
                                  color: '#667eea',
                                  backgroundColor: 'rgba(255,255,255,1)',
                                  border: '1px solid rgba(102,126,234,0.5)'
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Tracking Number (Optional)"
                            value={newPOTrackingNumber}
                            onChange={(e) => setNewPOTrackingNumber(e.target.value)}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                bgcolor: 'rgba(255,255,255,0.95)',
                                borderRadius: 3,
                                fontSize: '1.2rem',
                                fontWeight: 600,
                                '& fieldset': {
                                  borderWidth: 2,
                                  borderColor: 'rgba(255,255,255,0.8)'
                                },
                                '&:hover fieldset': {
                                  borderColor: 'rgba(255,255,255,1)'
                                },
                                '&.Mui-focused fieldset': {
                                  borderColor: 'rgba(255,255,255,1)'
                                }
                              },
                              '& .MuiInputLabel-root': {
                                color: '#2d3748',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(102,126,234,0.3)',
                                '&.Mui-focused': {
                                  color: '#667eea',
                                  backgroundColor: 'rgba(255,255,255,1)',
                                  border: '1px solid rgba(102,126,234,0.5)'
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            variant="contained"
                            size="medium"
                            onClick={createPurchaseOrder}
                            disabled={!newPOQuantity || newPOQuantity <= 0}
                            sx={{ 
                              bgcolor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              px: 4,
                              py: 2,
                              borderRadius: 2,
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              border: '2px solid rgba(255,255,255,0.3)',
                              '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.3)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                              },
                              '&:disabled': {
                                bgcolor: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.5)'
                              }
                            }}
                          >
                            🚀 Create Purchase Order
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  {/* Existing POs */}
                  <Card sx={{ 
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #ffffff 0%, #f7fafc 100%)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 700, 
                        mb: 4, 
                        color: '#2d3748',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2
                      }}>
                        📋 Active Purchase Orders
                  </Typography>
                      
                      {pendingPOs.length > 0 ? (
                        <Grid container spacing={3}>
                          {pendingPOs.map((po) => (
                            <Grid item xs={12} md={6} key={po.id}>
                              <Card sx={{ 
                                borderRadius: 3,
                                border: '2px solid',
                                borderColor: po.arrived ? '#48bb78' : '#ed8936',
                                background: po.arrived 
                                  ? 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)'
                                  : 'linear-gradient(135deg, #fffaf0 0%, #fbd38d 100%)',
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                  transform: 'translateY(-4px)',
                                  boxShadow: '0 12px 30px rgba(0,0,0,0.15)'
                                }
                              }}>
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#2d3748' }}>
                                      PO #{po.id}
                                    </Typography>
                                    <Chip
                                      label={po.arrived ? '✅ Arrived' : '⏳ Pending'}
                                      color={po.arrived ? 'success' : 'warning'}
                                      sx={{ fontWeight: 700, fontSize: '0.8rem' }}
                                    />
                                  </Box>
                                  
                                  <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#4a5568' }}>
                                      📦 Quantity: <span style={{ color: '#2d3748' }}>{po.quantity}</span>
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                                      📅 Ordered: {new Date(po.orderDate).toLocaleDateString()}
                  </Typography>
                                                                        {po.trackingNumber && (
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                          🚚 Tracking: {po.trackingNumber}
                                        </Typography>
                                        {/* <TrackingDisplay trackingNumber={po.trackingNumber} compact /> */}
                                      </Box>
                                    )}
                                    {po.createdBy && (
                                      <Typography variant="body2" color="text.secondary">
                                        👤 Created by: {po.createdBy}
                                      </Typography>
                                    )}
              </Box>

                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => handleEditPO(po)}
                                      sx={{ 
                                        borderRadius: 2, 
                                        fontWeight: 600,
                                        borderWidth: 2,
                                        '&:hover': {
                                          borderWidth: 2
                                        }
                                      }}
                                    >
                                      ✏️ Edit
                                    </Button>
                                    {!po.arrived && (
                                      <Button
                                        variant="contained"
                                        color="success"
                                        size="small"
                                        onClick={() => markPOAsArrived(po.id)}
                                        sx={{ 
                                          borderRadius: 2, 
                                          fontWeight: 600,
                                          background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                                          '&:hover': {
                                            background: 'linear-gradient(135deg, #38a169 0%, #2f855a 100%)'
                                          }
                                        }}
                                      >
                                        ✅ Mark Arrived
                                      </Button>
                                    )}
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      ) : (
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 8,
                          bgcolor: '#f7fafc',
                          borderRadius: 3,
                          border: '3px dashed',
                          borderColor: '#cbd5e0'
                        }}>
                          <Typography variant="h4" sx={{ mb: 2, opacity: 0.6 }}>
                            📭
                          </Typography>
                          <Typography variant="h6" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                            No Purchase Orders
                          </Typography>
                          <Typography variant="body1" color="text.secondary">
                            Create your first purchase order above to get started
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Order Dialog */}
      <Dialog 
        open={showEditPODialog} 
        onClose={() => setShowEditPODialog(false)}
        maxWidth="sm"
        fullWidth
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
              size="small"
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

    </Box>
  );

  // Conditionally wrap with Layout if user is authenticated
  if (isAuthenticated) {
    return <Layout>{scannerContent}</Layout>;
  }

  // Return content without layout for non-authenticated users
  return scannerContent;
} 