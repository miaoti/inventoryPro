'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Container,
  useTheme,
  useMediaQuery,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  Inventory as InventoryIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { publicQRAPI } from '../../services/api';

interface ItemInfo {
  id: number;
  name?: string;
  code?: string;
  description?: string;
  englishDescription?: string;
  location?: string;
  equipment?: string;
  category?: string;
  currentInventory?: number;
  availableQuantity: number;
  needsRestock: boolean;
  qrCodeId: string;
}

export default function QRUsagePage() {
  const params = useParams();
  const qrCodeId = params.qrCodeId as string;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [item, setItem] = useState<ItemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [userName, setUserName] = useState('');
  const [department, setDepartment] = useState('');
  const [dNumber, setDNumber] = useState('');
  const [quantityToUse, setQuantityToUse] = useState(1);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchItemInfo = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await publicQRAPI.getItemByQRCode(qrCodeId);
        const itemData = (response as any)?.data || response;
        setItem(itemData);
      } catch (err: any) {
        console.error('Error fetching item info:', err);
        if (err.response?.status === 404) {
          setError('Item not found. This QR code may be invalid or outdated.');
        } else {
          setError('Failed to load item information. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (qrCodeId) {
      fetchItemInfo();
    }
  }, [qrCodeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item) return;
    
    // Validation
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!department.trim()) {
      setError('Please enter your department');
      return;
    }
    
    if (!dNumber.trim()) {
      setError('Please enter your D number');
      return;
    }
    
    if (quantityToUse <= 0) {
      setError('Please enter a valid quantity');
      return;
    }
    
    if (quantityToUse > item.availableQuantity) {
      setError(`Cannot use ${quantityToUse} units. Only ${item.availableQuantity} units are available.`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      const usageData = {
        userName: userName.trim(),
        department: department.trim(),
        dNumber: dNumber.trim(),
        quantityUsed: quantityToUse,
        notes: notes.trim() || undefined,
      };

      const response = await publicQRAPI.recordUsageByQRCode(qrCodeId, usageData);
      const result = (response as any)?.data || response;
      
      setSuccess(`Successfully recorded: ${quantityToUse} units used by ${userName} (${department} - ${dNumber})`);
      
      // Update item data with new quantities
      if (result.item) {
        setItem(prev => prev ? {
          ...prev,
          currentInventory: result.item.currentInventory,
          availableQuantity: result.item.availableQuantity,
        } : null);
      }
      
      // Reset form
      setQuantityToUse(1);
      setNotes('');
      
    } catch (err: any) {
      console.error('Error recording usage:', err);
      let errorMsg = 'Failed to record usage. Please try again.';
      if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={60} />
          <Typography variant="h6" color="text.secondary">
            Loading item information...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error && !item) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <QrCodeIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="error">
            QR Code Error
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.history.back()}
          >
            Go Back
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <QrCodeIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
        <Typography variant="h4" gutterBottom>
          Item Usage
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Scan successful! Record your usage below.
        </Typography>
      </Box>

      {item && (
        <>
          {/* Item Information Card */}
          <Card sx={{ mb: 3, bgcolor: 'background.paper', boxShadow: 2 }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <InventoryIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" component="div">
                  {item.name || 'Unknown Item'}
                </Typography>
              </Box>
              
              {item.code && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Code: {item.code}
                </Typography>
              )}
              
              {item.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {item.description}
                </Typography>
              )}
              
              {item.englishDescription && item.englishDescription !== item.description && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {item.englishDescription}
                </Typography>
              )}
              
              {(item.location || item.equipment) && (
                <Box mt={2}>
                  {item.location && (
                    <Chip 
                      label={`Location: ${item.location}`} 
                      size="small" 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                  )}
                  {item.equipment && (
                    <Chip 
                      label={`Equipment: ${item.equipment}`} 
                      size="small" 
                      sx={{ mr: 1, mb: 1 }} 
                    />
                  )}
                </Box>
              )}

              <Divider sx={{ my: 2 }} />
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">
                  <strong>Available: {item.availableQuantity} units</strong>
                </Typography>
                {item.needsRestock && (
                  <Chip 
                    icon={<WarningIcon />}
                    label="Low Stock" 
                    color="warning" 
                    size="small" 
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Usage Form */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Record Usage
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="D Number"
                value={dNumber}
                onChange={(e) => setDNumber(e.target.value)}
                required
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BadgeIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Quantity to Use"
                type="number"
                value={quantityToUse}
                onChange={(e) => setQuantityToUse(parseInt(e.target.value) || 1)}
                required
                margin="normal"
                inputProps={{ min: 1, max: item.availableQuantity }}
                helperText={`Maximum available: ${item.availableQuantity} units`}
              />
              
              <TextField
                fullWidth
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                margin="normal"
                multiline
                rows={2}
                placeholder="Add any additional notes..."
              />

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert 
                  severity="success" 
                  icon={<CheckCircleIcon />}
                  sx={{ mt: 2 }}
                >
                  {success}
                </Alert>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={submitting || item.availableQuantity === 0}
                sx={{ mt: 3 }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Recording Usage...
                  </>
                ) : item.availableQuantity === 0 ? (
                  'Out of Stock'
                ) : (
                  'Record Usage'
                )}
              </Button>
            </Box>
          </Paper>
        </>
      )}
    </Container>
  );
} 