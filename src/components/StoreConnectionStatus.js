import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import { useStoreConnection } from '../contexts/StoreConnectionContext';

const StoreConnectionStatus = () => {
  const { connectedPlatform, hasGoogleAnalytics } = useStoreConnection();

  if (connectedPlatform || hasGoogleAnalytics) {
    return null; // Don't show anything if a store or GA is connected
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity="warning">
        <Typography variant="body1">
          No store connected. Please connect either WooCommerce or Shopify in Settings to use Ecommander.
        </Typography>
      </Alert>
    </Box>
  );
};

export default StoreConnectionStatus; 