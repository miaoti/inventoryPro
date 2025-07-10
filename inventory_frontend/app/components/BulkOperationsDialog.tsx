'use client';

import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  FileUpload as FileUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { itemsAPI } from '@/services/api';

interface BulkOperationsDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ImportResult {
  message: string;
  totalProcessed: number;
  created: number;
  skippedDuplicates: number;
  departmentFiltered?: number;
  departmentFilterMessage?: string;
  errors: number;
  errorDetails: string[];
}

export default function BulkOperationsDialog({ open, onClose, onSuccess }: BulkOperationsDialogProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
        setError(null);
        setImportResult(null);
      } else {
        setError('Please select a CSV or Excel file');
        setImportFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setError('Please select a file to import');
      return;
    }

    setImporting(true);
    setError(null);
    
    try {
      const response = await itemsAPI.importCSV(importFile);
      const result = response.data || response;
      setImportResult(result);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Import error:', err);
      setError(err.response?.data?.message || err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setImportFile(null);
    setImportResult(null);
    setError(null);
    setImporting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setImportFile(file);
        setError(null);
        setImportResult(null);
      } else {
        setError('Please select a CSV or Excel file');
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <CloudUploadIcon />
          Bulk Import Items from CSV/Excel
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!importResult ? (
          <Box>
            {/* File Upload Area */}
            <Card
              sx={{
                mb: 3,
                border: '2px dashed #ccc',
                borderColor: importFile ? 'primary.main' : '#ccc',
                bgcolor: importFile ? 'primary.50' : 'background.paper',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'primary.50',
                }
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <FileUploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {importFile ? importFile.name : 'Select or drag & drop your file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supported formats: CSV, Excel (.xlsx, .xls)
                </Typography>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </CardContent>
            </Card>

            {/* Instructions */}
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                File Format Requirements:
              </Typography>
              <Typography variant="body2" component="div">
                • Required columns: name, quantity, minQuantity, location, category
                <br />
                • Optional columns: description, englishDescription, code, equipment, department
                <br />
                • Category values: A, B, or C
                <br />
                • Department: leave empty for public items
              </Typography>
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {importing && (
              <Box sx={{ mt: 2 }}>
                <LinearProgress />
                <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                  Importing items... Please wait.
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          /* Import Results */
          <Box>
            <Alert severity={importResult.errors > 0 ? 'warning' : 'success'} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Import Complete
              </Typography>
              <Typography variant="body2">
                {importResult.message}
              </Typography>
            </Alert>

            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Import Summary
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip 
                    icon={<CheckCircleIcon />} 
                    label={`${importResult.created} Created`} 
                    color="success" 
                  />
                  <Chip 
                    label={`${importResult.skippedDuplicates} Skipped (Duplicates)`} 
                    color="default" 
                  />
                  {importResult.errors > 0 && (
                    <Chip 
                      icon={<ErrorIcon />} 
                      label={`${importResult.errors} Errors`} 
                      color="error" 
                    />
                  )}
                  <Chip 
                    label={`${importResult.totalProcessed} Total Processed`} 
                    color="info" 
                  />
                </Box>

                {importResult.departmentFilterMessage && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {importResult.departmentFilterMessage}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {importResult.errorDetails.length > 0 && (
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="error">
                    Error Details
                  </Typography>
                  <List dense>
                    {importResult.errorDetails.map((error, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemText primary={error} />
                        </ListItem>
                        {index < importResult.errorDetails.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            )}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />}>
          {importResult ? 'Close' : 'Cancel'}
        </Button>
        {!importResult && (
          <Button 
            onClick={handleImport} 
            variant="contained" 
            disabled={!importFile || importing}
            startIcon={importing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {importing ? 'Importing...' : 'Import Items'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 