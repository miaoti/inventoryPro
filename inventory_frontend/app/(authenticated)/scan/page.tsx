'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { itemsAPI } from '../../services/api';

export default function ScanPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await itemsAPI.scanBarcode(file);
      setSuccess('Barcode scanned successfully!');
      // Handle the scanned item data here
      console.log('Scanned item:', response.data);
    } catch (err) {
      setError('Failed to scan barcode. Please try again.');
      console.error('Error scanning barcode:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Scan Barcode
      </Typography>

      <Paper
        sx={{
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? 'Scanning...' : 'Upload Barcode Image'}
        </Button>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ width: '100%' }}>
            {success}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" align="center">
          Upload an image containing a barcode to scan. Supported formats: JPG, PNG
        </Typography>
      </Paper>
    </Box>
  );
} 