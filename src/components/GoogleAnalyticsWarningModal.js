import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStoreConnection } from '../contexts/StoreConnectionContext';

const GoogleAnalyticsWarningModal = () => {
  const { hasGoogleAnalytics, loading } = useStoreConnection();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [delayComplete, setDelayComplete] = useState(false);

  useEffect(() => {
    // Add a delay to prevent flash of modal when GA is connected
    const timer = setTimeout(() => {
      setDelayComplete(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only set open state after loading is complete AND delay has finished
    if (!loading && delayComplete) {
      setOpen(!hasGoogleAnalytics);
    }
  }, [hasGoogleAnalytics, loading, delayComplete]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleGoToSettings = () => {
    navigate('/settings');
    handleClose();
  };

  // Don't render anything while loading or during delay
  if (loading || !delayComplete) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="ga-warning-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="ga-warning-dialog-title">
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
          Google Analytics Required
        </Typography>
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography variant="body1" sx={{ mb: 2 }}>
            To access the dashboard features, you need to connect your Google Analytics account.
          </Typography>
          <Typography variant="body1">
            This will allow us to provide you with valuable insights and analytics about your store's performance.
          </Typography>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleClose} color="primary">
          Maybe Later
        </Button>
        <Button onClick={handleGoToSettings} variant="contained" color="primary">
          Connect Google Analytics
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleAnalyticsWarningModal; 
 