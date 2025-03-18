import * as React from 'react';
import { useState, useEffect } from 'react';
import { TextField, Button, Typography, Alert, Card, Box, FormControl, FormLabel } from '@mui/material';
import { styled } from '@mui/material/styles';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';

const SettingsCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function WooCommerceSettingsCard() {
  const [user] = useAuthState(auth);
  const [storeUrl, setStoreUrl] = useState('');
  const [apiId, setApiId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [urlError, setUrlError] = useState('');

  const validateUrl = (url) => {
    const pattern = /^(http:\/\/|https:\/\/)/;
    if (!pattern.test(url)) {
      return 'URL must start with http:// or https://';
    }
    return '';
  };

  const handleTest = async () => {
    const error = validateUrl(storeUrl);
    if (error) {
      setUrlError(error);
      return;
    }
    setUrlError('');
    setLoading(true);
    try {
      const formattedUrl = storeUrl.endsWith('/') ? storeUrl.slice(0, -1) : storeUrl;
      console.log('Sending request to backend server');
      const response = await fetch('http://localhost:5000/woocommerce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeUrl: formattedUrl, apiId, secretKey }),
      });
      const result = await response.json();
      console.log('Received response from backend server:', result);
      setTestResult(result.result);
    } catch (error) {
      console.error('Error sending request to backend server:', error);
      setTestResult('Failed');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (user) {
      const userDoc = doc(db, 'users', user.uid);
      await setDoc(userDoc, {
        wc_key: apiId,
        wc_secret: secretKey,
        wc_url: storeUrl,
      }, { merge: true });
      setSecretKey('******');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoreUrl(data.wc_url || '');
          setApiId(data.wc_key || '');
          setSecretKey(data.wc_secret ? '**************************' : '');
        }
      }
    };
    fetchData();
  }, [user]);

  return (
    <SettingsCard variant="outlined">
      <Typography variant="h6" gutterBottom align="center">
        WooCommerce Credentials
      </Typography>
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <FormControl>
          <FormLabel htmlFor="storeUrl">Store URL</FormLabel>
          <TextField
            required
            id="storeUrl"
            type="url"
            name="storeUrl"
            placeholder="https://yourstore.com"
            autoComplete="url"
            fullWidth
            variant="outlined"
            value={storeUrl}
            onChange={(e) => setStoreUrl(e.target.value)}
            error={!!urlError}
            helperText={urlError}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="apiId">API ID</FormLabel>
          <TextField
            required
            id="apiId"
            type="text"
            name="apiId"
            placeholder="API ID"
            autoComplete="api-id"
            fullWidth
            variant="outlined"
            value={apiId}
            onChange={(e) => setApiId(e.target.value)}
          />
        </FormControl>
        <FormControl>
          <FormLabel htmlFor="secretKey">Secret Key</FormLabel>
          <TextField
            required
            id="secretKey"
            type="password"
            name="secretKey"
            placeholder="••••••"
            autoComplete="current-password"
            fullWidth
            variant="outlined"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
          />
        </FormControl>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            justifyContent: 'center',
            width: '100%',
            mt: 2,
          }}
        >
          <Button
            variant="contained"
            onClick={handleTest}
            disabled={loading}
            sx={{ flex: 1 }}
          >
            {loading ? 'Testing...' : 'Test'}
          </Button>
          <Button variant="contained" onClick={handleSave} sx={{ flex: 1 }}>
            Save
          </Button>
        </Box>
        {testResult && (
          <Alert
            severity={testResult === 'Success' ? 'success' : 'error'}
            sx={{ width: '100%' }}
          >
            {testResult}
          </Alert>
        )}
      </Box>
    </SettingsCard>
  );
}
