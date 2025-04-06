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
import { auth } from '../../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function ShopifySettingsCard() {
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [testResult, setTestResult] = useState('');
  const user = auth.currentUser;

  const fetchConnectionStatus = async () => {
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shopify/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStatus(data.connected ? 'connected' : 'disconnected');
    } catch (err) {
      console.error('Status check failed:', err);
      setError('Failed to check Shopify status.');
      setStatus('error');
    }
  };

  const disconnect = async () => {
    try {
      setStatus('loading');
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/shopify/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.result === 'Success') {
        setStatus('disconnected');
        setError('');
        setTestResult('');
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
      const res = await fetch(`${API_URL}/shopify/test`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTestResult(data.result === 'Success' ? 'success' : 'fail');
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
      <Stack spacing={1}>
        {status === 'connected' ? (
          <>
            <Button variant="outlined" color="error" onClick={disconnect}>
              Disconnect
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={testConnection}
              disabled={testResult === 'testing'}
            >
              {testResult === 'testing' ? 'Testing…' : 'Test Connection'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              href="https://admin.shopify.com/store/YOUR_STORE_NAME/apps"
              target="_blank"
            >
              Open Shopify App
            </Button>
          </>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={async () => {
              const token = await user.getIdToken();
              window.location.href = `${API_URL}/shopify/install?token=${token}`;
            }}
          >
            Connect Shopify
          </Button>
        )}
      </Stack>
    );
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">Shopify</Typography>
          <Typography variant="body2">
            {status === 'connected'
              ? 'Your store is connected to Ecommander.'
              : 'Not connected. Click below to authorize and install the Ecommander app.'}
          </Typography>

          {error && <Alert severity="error">{error}</Alert>}
          {testResult === 'success' && <Alert severity="success">Connection is valid.</Alert>}
          {testResult === 'fail' && <Alert severity="error">Connection test failed.</Alert>}

          {renderActionButtons()}
        </Stack>
      </CardContent>
    </Card>
  );
}
