import * as React from 'react';
import { useState } from 'react';
import {
  TextField,
  Button,
  Typography,
  Alert,
  Card,
  Box,
  FormControl,
  FormLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, setDoc } from 'firebase/firestore';

const API_URL = process.env.REACT_APP_API_URL;
const PLUGIN_URL = 'https://app.ecommander.io/plugins/ecommander_woocommerce.zip';


const SettingsCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(3),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '500px'
  },
  boxShadow: '0px 4px 10px rgba(0,0,0,0.08)',
  overflow: 'auto'
}));

export default function WooCommerceConnectCard() {
  const [user] = useAuthState(auth);
  const [storeUrl, setStoreUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState(null);

  const validateAndFormatUrl = (url) => {
    let trimmed = url.trim();

    if (!/^https:\/\//.test(trimmed)) {
      return { valid: false, error: 'URL must start with https://' };
    }

    if (/\s/.test(trimmed)) {
      return { valid: false, error: 'URL cannot contain spaces' };
    }

    if (trimmed.endsWith('/')) {
      trimmed = trimmed.slice(0, -1);
    }

    try {
      new URL(trimmed);
    } catch (err) {
      return { valid: false, error: 'Invalid URL format' };
    }

    return { valid: true, url: trimmed };
  };

  const handleConnect = async () => {
    setMessage(null);
    const result = validateAndFormatUrl(storeUrl);

    if (!result.valid) {
      setUrlError(result.error);
      return;
    }

    setUrlError('');
    setConnecting(true);

    try {
      const store = result.url;

      // Save wc_url to Firestore now
      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, {
          wc_url: store
        }, { merge: true });
      }

      // Instruct user to activate plugin manually if needed
      window.open(`${store}/wp-admin/plugins.php`, '_blank');

      // Optional: show some message
      setMessage('Once plugin is activated, you can start using the tools.');
    } catch (error) {
      console.error('Connection error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDownloadPlugin = () => {
    const a = document.createElement('a');
    a.href = PLUGIN_URL;
    a.download = 'ecommander_woocommerce.zip';
    a.click();
  };

  return (
    <SettingsCard variant="outlined">
      <Typography variant="h6" gutterBottom align="center">
        Connect Your WooCommerce Store
      </Typography>

      <Typography variant="body2">
        1. Enter your store URL (must start with <strong>https://</strong>)
        <br />
        2. Download and install our plugin
        <br />
        3. Activate it inside your WooCommerce admin
        <br />
        4. Click “Connect Store” to finalize the connection
      </Typography>

      <FormControl>
        <FormLabel htmlFor="storeUrl">Your Store URL</FormLabel>
        <TextField
          id="storeUrl"
          type="url"
          name="storeUrl"
          placeholder="https://yourstore.com"
          fullWidth
          variant="outlined"
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          error={!!urlError}
          helperText={urlError || 'Make sure the URL is correct and live'}
        />
      </FormControl>

      <Button
        variant="outlined"
        onClick={handleDownloadPlugin}
      >
        Download Plugin
      </Button>

      <Button
        variant="contained"
        onClick={handleConnect}
        disabled={!storeUrl || connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Store'}
      </Button>

      {message && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </SettingsCard>
  );
}
