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
  TextField,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { auth } from '../../../firebase';
import { useStoreConnection } from '../../../contexts/StoreConnectionContext';
import { useBrand } from '../../../contexts/BrandContext';
import { useToast } from '../../../components/ToasterAlert';

const API_URL = process.env.REACT_APP_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://us-central1-apps-84c5e.cloudfunctions.net/api'
    : 'http://localhost:5000'
);

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

export default function ShopifySettingsCard() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const user = auth.currentUser;
  const { connectedPlatform, setConnectedPlatform } = useStoreConnection();
  const { activeBrandId } = useBrand();
  const { showToast } = useToast();

  const cleanUrl = (url) => {
    // Remove protocol and www
    let cleaned = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Remove trailing slash
    cleaned = cleaned.replace(/\/$/, '');
    // Remove any paths or query params
    cleaned = cleaned.split('/')[0];
    return cleaned.trim();
  };

  const validateUrl = (url) => {
    if (!url) return 'Please enter your store URL';
    
    const cleaned = cleanUrl(url);
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(cleaned)) {
      return 'Please enter a valid domain (e.g., yourstore.com or yourstore.myshopify.com)';
    }

    return null;
  };

  const fetchConnectionStatus = async () => {
    if (!activeBrandId) {
      console.log('No active brand selected for Shopify status check');
      setStatus('no-brand');
      return;
    }
    
    try {
      console.log(`Checking Shopify connection status for brand: ${activeBrandId}`);
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shopify/status?brandId=${activeBrandId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to check connection status');
      }
      
      const data = await res.json();
      const isConnected = data.connected;
      console.log(`Shopify connection status for brand ${activeBrandId}: ${isConnected ? 'Connected' : 'Not connected'}`);
      setStatus(isConnected ? 'connected' : 'disconnected');
      
      // Update the global connection state
      if (isConnected) {
        setConnectedPlatform('shopify');
      } else if (connectedPlatform === 'shopify') {
        setConnectedPlatform(null);
      }
    } catch (err) {
      console.error('Shopify status check failed:', err);
      setError('Failed to check Shopify status.');
      setStatus('error');
    }
  };

  const disconnect = async () => {
    if (!activeBrandId) {
      setError('No brand selected');
      return;
    }
    
    try {
      console.log(`Disconnecting Shopify for brand: ${activeBrandId}`);
      setStatus('loading');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shopify/disconnect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brandId: activeBrandId
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Disconnection failed');
      }
      
      const data = await res.json();
      if (data.result === 'Success') {
        console.log(`Successfully disconnected Shopify for brand: ${activeBrandId}`);
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
      setError('No brand selected');
      return;
    }
    
    try {
      console.log(`Testing Shopify connection for brand: ${activeBrandId}`);
      setTestResult('testing');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shopify/test?brandId=${activeBrandId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Test connection failed');
      }
      
      const data = await res.json();
      console.log(`Shopify test result for brand ${activeBrandId}:`, data.result);
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

  const handleConnect = async () => {
    if (!activeBrandId) {
      setError('No brand selected. Please select a brand before connecting Shopify.');
      return;
    }
    
    const cleaned = cleanUrl(storeUrl);
    const validationError = validateUrl(storeUrl);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      console.log(`Connecting Shopify for brand: ${activeBrandId}, shop: ${cleaned}`);
      setIsConnecting(true);
      setError('');
      const token = await user.getIdToken();
      window.location.href = `${API_URL}/shopify/install?token=${token}&shop=${encodeURIComponent(cleaned)}&brandId=${encodeURIComponent(activeBrandId)}`;
    } catch (err) {
      console.error('Failed to start connection:', err);
      setError('Failed to start Shopify connection');
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (user && activeBrandId) {
      console.log('Initializing Shopify settings card with brand:', activeBrandId);
      fetchConnectionStatus();
    }
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
            <TextField
              label="Your Store URL"
              placeholder="yourstore.com"
              value={storeUrl}
              onChange={(e) => {
                setStoreUrl(e.target.value);
                setError(''); // Clear error when user types
              }}
              fullWidth
              disabled={connectedPlatform === 'woocommerce' || !activeBrandId}
              error={!!error}
              helperText={error || "Enter your store's domain (e.g., yourstore.com)"}
            />
            <Tooltip 
              title={
                !activeBrandId 
                  ? "Please select a brand first" 
                  : connectedPlatform === 'woocommerce' 
                    ? "Disconnect WooCommerce first to connect Shopify" 
                    : ""
              }
              placement="top"
              arrow
            >
              <span style={{ width: '100%' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleConnect}
                  disabled={connectedPlatform === 'woocommerce' || isConnecting || !activeBrandId}
                  fullWidth
                >
                  {isConnecting ? 'Connecting...' : 'Connect Shopify'}
                </Button>
              </span>
            </Tooltip>
          </>
        )}
      </Stack>
    );
  };

  const isDisabled = connectedPlatform === 'woocommerce' || !activeBrandId;

  return (
    <SettingsCard variant="outlined" disabled={isDisabled}>
      <Stack spacing={2}>
        <Typography variant="h6">Shopify</Typography>
        <Typography variant="body2">
          {status === 'connected'
            ? 'Your store is connected to Ecommander.'
            : status === 'no-brand'
            ? 'Please select a brand to manage Shopify connection.'
            : connectedPlatform === 'woocommerce'
              ? 'WooCommerce is already connected. Disconnect it first to connect Shopify.'
              : 'Not connected. Enter your store\'s domain below (e.g., yourstore.com) to connect your Shopify store.'}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        {renderActionButtons()}
      </Stack>
    </SettingsCard>
  );
}
