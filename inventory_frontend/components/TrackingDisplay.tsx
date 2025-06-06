import React from 'react';
import { Box, Typography, Alert } from '@mui/material';

interface TrackingDisplayProps {
  trackingNumber: string;
  compact?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const TrackingDisplay: React.FC<TrackingDisplayProps> = ({
  trackingNumber,
  compact = false
}) => {
  if (compact) {
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Tracking: {trackingNumber}
        </Typography>
        <Alert severity="info" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
          Tracking temporarily disabled
        </Alert>
      </Box>
    );
  }

  return (
    <Alert severity="info" sx={{ mb: 2 }}>
      <Typography variant="body2">
        Tracking functionality is temporarily disabled.
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Tracking Number: {trackingNumber}
      </Typography>
    </Alert>
  );
}; 