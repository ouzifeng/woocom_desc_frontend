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
import { useBrand } from '../../../contexts/BrandContext';
import { useToast } from '../../../components/ToasterAlert';

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
  const { activeBrandId } = useBrand();
  const { showToast } = useToast();

  const fetchConnectionStatus = async () => {
    if (!activeBrandId) {
      setStatus('no-brand');
      return;
    }
    
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/status?brandId=${activeBrandId}`, {
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
    if (!activeBrandId) {
      setError('No brand selected.');
      return;
    }
    
    try {
      setStatus('loading');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: activeBrandId
        }),
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
    if (!activeBrandId) {
      setError('No brand selected.');
      return;
    }
    
    try {
      setTestResult('testing');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/woocommerce/test?brandId=${activeBrandId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.result === 'Success') {
        setTestResult('success');
        showToast('Connection is valid', 'success');
      } else {
        setTestResult('fail');
        showToast('Connection test failed', 'error');
      }
    } catch (err) {
      console.error('Test connection failed:', err);
      setTestResult('fail');
      showToast('Connection test failed', 'error');
    }
  };

  useEffect(() => {
    if (user) fetchConnectionStatus();
  }, [user, activeBrandId]);

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
            : status === 'no-brand'
            ? 'Please select a brand to manage WooCommerce connection.'
            : connectedPlatform === 'shopify'
              ? 'Shopify is already connected. Disconnect it first to connect WooCommerce.'
              : 'Not connected. To connect your store, download the plugin, upload, install and activate it on your WordPress site.'}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {renderActionButtons()}
      </Stack>
    </SettingsCard>
  );
}
