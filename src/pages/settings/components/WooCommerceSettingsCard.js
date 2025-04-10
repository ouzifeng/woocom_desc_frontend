import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Stack,
  Alert,
  Tooltip,
  Box,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { auth } from '../../../firebase';
import { useStoreConnection } from '../../../contexts/StoreConnectionContext';

const API_URL = process.env.REACT_APP_API_URL;

const SettingsCard = styled(Card)(({ theme, disabled }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow: '0px 4px 10px rgba(0,0,0,0.08)',
  overflow: 'auto',
  backgroundColor: '#fff',
  opacity: disabled ? 0.6 : 1,
  transition: 'opacity 0.3s ease',
  pointerEvents: disabled ? 'none' : 'auto',
}));

export default function WooCommerceSettingsCard() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState('');
  const user = auth.currentUser;
  const { connectedPlatform, setConnectedPlatform } = useStoreConnection();

  const fetchConnectionStatus = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      const isConnected = data.connected;
      setStatus(isConnected ? 'connected' : 'disconnected');
      
      // Update the global connection state
      if (isConnected) {
        setConnectedPlatform('woocommerce');
      } else if (connectedPlatform === 'woocommerce') {
        setConnectedPlatform(null);
      }
    } catch (err) {
      console.error('Status check failed:', err);
      setError('Failed to check WooCommerce status.');
      setStatus('error');
    }
  };

  const disconnect = async () => {
    try {
      setStatus('loading');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.result === 'Success') {
        setStatus('disconnected');
        setError('');
        setTestResult('');
        setConnectedPlatform(null);
      } else {
        setError(data.message || 'Disconnection failed.');
        setStatus('connected');
      }
    } catch (err) {
      console.error('Disconnect error:', err);
      setError('Failed to disconnect.');
      setStatus('connected');
    }
  };

  const testConnection = async () => {
    try {
      setTestResult('testing');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.result === 'Success') {
        setTestResult('success');
      } else {
        setTestResult('fail');
      }
    } catch (err) {
      console.error('Test connection failed:', err);
      setTestResult('fail');
    }
  };

  useEffect(() => {
    if (user) fetchConnectionStatus();
  }, [user]);

  const renderActionButtons = () => {
    if (status === 'loading') return <CircularProgress size={24} />;

    return (
      <Stack spacing={1} width="100%">
        {status === 'connected' ? (
          <>
            <Button variant="outlined" color="error" onClick={disconnect} fullWidth>
              Disconnect
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={testConnection}
              disabled={testResult === 'testing'}
              fullWidth
            >
              {testResult === 'testing' ? 'Testing…' : 'Test Connection'}
            </Button>
          </>
        ) : (
          <>
            <Tooltip 
              title={connectedPlatform === 'shopify' ? "Disconnect Shopify first to connect WooCommerce" : ""}
              placement="top"
              arrow
            >
              <span style={{ width: '100%' }}>
                <Button
                  variant="contained"
                  color="primary"
                  href="https://shimeruknives.co.uk/wp-admin/admin.php?page=ecommander-settings"
                  target="_blank"
                  disabled={connectedPlatform === 'shopify'}
                  fullWidth
                >
                  Connect Plugin
                </Button>
              </span>
            </Tooltip>
            <Button
              variant="outlined"
              color="secondary"
              component="a"
              href="/plugins/ecommander_woocommerce_plugin.zip"
              download
              fullWidth
            >
              Download Plugin
            </Button>
          </>
        )}
      </Stack>
    );
  };

  const isDisabled = connectedPlatform === 'shopify';

  return (
    <SettingsCard variant="outlined" disabled={isDisabled}>
      <Stack spacing={2}>
        <Typography variant="h6">WooCommerce</Typography>
        <Typography variant="body2">
          {status === 'connected'
            ? 'Your store is connected to Ecommander.'
            : connectedPlatform === 'shopify'
              ? 'Shopify is already connected. Disconnect it first to connect WooCommerce.'
              : 'Not connected. To connect your store, download the plugin, install and activate it on your WordPress site.'}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}
        {testResult === 'success' && <Alert severity="success">Connection is valid.</Alert>}
        {testResult === 'fail' && <Alert severity="error">Connection test failed.</Alert>}

        {renderActionButtons()}
      </Stack>
    </SettingsCard>
  );
}
