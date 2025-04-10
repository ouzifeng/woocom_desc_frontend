import React, { useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useStoreConnection } from '../contexts/StoreConnectionContext';

const GoogleAnalyticsWarningModal = () => {
  const { hasGoogleAnalytics, loading } = useStoreConnection();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    // Only set open state after loading is complete
    if (!loading) {
      setOpen(!hasGoogleAnalytics);
    }
  }, [hasGoogleAnalytics, loading]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleGoToSettings = () => {
    navigate('/settings');
    handleClose();
  };

  // Don't render anything while loading
  if (loading) {
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
 