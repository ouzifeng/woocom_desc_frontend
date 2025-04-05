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
const PLUGIN_URL = 'https://app.ecommander.io/public/plugins/ecommander_woocommerce.zip';

const SettingsCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px'
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

      if (user) {
        const userDoc = doc(db, 'users', user.uid);
        await setDoc(userDoc, { wc_url: store }, { merge: true });

        const pluginInstallUrl = `${store}/wp-admin/plugin-install.php?plugin_url=${encodeURIComponent(PLUGIN_URL)}&user_id=${user.uid}`;
        window.open(pluginInstallUrl, '_blank', 'width=600,height=800');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setMessage('Something went wrong. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <SettingsCard variant="outlined">
      <Typography variant="h6" gutterBottom align="center">
        Connect Your WooCommerce Store
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
        variant="contained"
        onClick={handleConnect}
        disabled={!storeUrl || connecting}
      >
        {connecting ? 'Redirecting...' : 'Connect Store'}
      </Button>
      {message && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {message}
        </Alert>
      )}
    </SettingsCard>
  );
}
