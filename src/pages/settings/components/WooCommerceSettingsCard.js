import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material';
import { auth } from '../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function WooCommerceSettingsCard() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [user] = auth.currentUser ? [auth.currentUser] : [null];

  const fetchConnectionStatus = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setStatus(data.connected ? 'connected' : 'disconnected');
    } catch (err) {
      console.error(err);
      setError('Failed to check WooCommerce status.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (user) fetchConnectionStatus();
  }, [user]);

  const disconnect = async () => {
    try {
      setStatus('loading');
      const token = await user.getIdToken();
      await fetch(`${API_URL}/woocommerce/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setStatus('disconnected');
    } catch (err) {
      console.error(err);
      setError('Failed to disconnect.');
    }
  };

  const renderAction = () => {
    if (status === 'loading') return <CircularProgress size={24} />;
    if (status === 'connected') {
      return (
        <Button variant="outlined" color="error" onClick={disconnect}>
          Disconnect
        </Button>
      );
    }
    return (
      <Button
        variant="contained"
        color="primary"
        href="https://shimeruknives.co.uk/wp-admin/admin.php?page=ecommander-settings"
      >
        Connect Plugin
      </Button>
    );
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">WooCommerce</Typography>
          <Typography variant="body2">
            {status === 'connected'
              ? 'Store is connected to Ecommander.'
              : 'This store is not connected. Please install and activate the plugin.'}
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          {renderAction()}
        </Stack>
      </CardContent>
    </Card>
  );
}
