import * as React from 'react';
import {
  Card,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { Google as GoogleIcon, Analytics as AnalyticsIcon, CheckCircle } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

const SettingsCard = styled(Card)(({ theme }) => ({
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
  overflow: 'auto'
}));

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://us-central1-apps-84c5e.cloudfunctions.net/api'
  : 'http://localhost:5000';

export default function GoogleAnalyticsCard() {
  const { activeBrandId } = useBrand();
  const [open, setOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [accounts, setAccounts] = React.useState([]);
  const [properties, setProperties] = React.useState([]);
  const [selectedAccount, setSelectedAccount] = React.useState('');
  const [selectedProperty, setSelectedProperty] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [visitors, setVisitors] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  React.useEffect(() => {
    if (activeBrandId) {
      checkConnectionStatus();
      setError(null);
    }
  }, [activeBrandId]);

  const checkConnectionStatus = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/analytics/accounts?brandId=${activeBrandId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch accounts');

      setAccounts(data.accounts || []);
      setIsConnected(data.connected);

      // ✅ Pull saved selections from Firestore and auto-fill
      if (data.accountId) {
        setSelectedAccount(data.accountId);

        // Fetch and set properties
        const propRes = await fetch(`${API_BASE_URL}/analytics/properties?account=${data.accountId}&brandId=${activeBrandId}`, { headers });
        const propData = await propRes.json();
        if (!propRes.ok) throw new Error(propData.error || 'Failed to fetch properties');
        setProperties(propData.properties || []);
        if (data.propertyId) {
          setSelectedProperty(data.propertyId);
        }
      }
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountChange = async (accountId) => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/analytics/properties?account=${accountId}&brandId=${activeBrandId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch properties');
      setSelectedAccount(accountId);
      setProperties(data.properties || []);
      setSelectedProperty('');
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePropertyChange = (event) => {
    setSelectedProperty(event.target.value);
  };

  const handleConnect = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setLoading(true);
      const user = auth.currentUser;
      const idToken = await user.getIdToken();
      const redirectUri = process.env.NODE_ENV === 'production'
        ? 'https://us-central1-apps-84c5e.cloudfunctions.net/api/analytics/auth/callback'
        : 'http://localhost:5000/analytics/auth/callback';
      const url = `${API_BASE_URL}/analytics/auth/url?redirect_uri=${encodeURIComponent(redirectUri)}&token=${encodeURIComponent(idToken)}&brandId=${encodeURIComponent(activeBrandId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get Auth URL');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      await fetch(`${API_BASE_URL}/analytics/disconnect`, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ brandId: activeBrandId })
      });
      setIsConnected(false);
      setAccounts([]);
      setProperties([]);
      setSelectedAccount('');
      setSelectedProperty('');
    } catch (err) {
      setError(err.message);
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setSaving(true);
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/analytics/save-selection`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ 
          accountId: selectedAccount, 
          propertyId: selectedProperty,
          brandId: activeBrandId
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save selection');
      setSnackbar({ open: true, message: 'Saved successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setTesting(true);
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE_URL}/analytics/test?brandId=${activeBrandId}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test failed');
      setVisitors(data.visitors);
      setSnackbar({ open: true, message: `Visitors yesterday: ${data.visitors}`, severity: 'info' });
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setTesting(false);
    }
  };

  if (!activeBrandId) {
    return (
      <SettingsCard variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 4 }}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6">Google Analytics</Typography>
        </Box>
        <Alert severity="warning">Please select a brand to configure Google Analytics.</Alert>
      </SettingsCard>
    );
  }

  return (
    <>
      <SettingsCard variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, marginBottom: 4 }}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6">Google Analytics</Typography>
        </Box>

        {loading && <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress size={24} /></Box>}
        {error && <Alert severity="error">{error}</Alert>}

        {isConnected ? (
          <>
            <FormControl fullWidth size="small">
              <InputLabel id="account-select-label">Account</InputLabel>
              <Select
                labelId="account-select-label"
                value={selectedAccount}
                onChange={(e) => handleAccountChange(e.target.value)}
              >
                {accounts.map((acc) => (
                  <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedAccount && (
              <FormControl fullWidth size="small">
                <InputLabel id="property-select-label">Property</InputLabel>
                <Select
                  labelId="property-select-label"
                  value={selectedProperty}
                  onChange={handlePropertyChange}
                >
                  {properties.map((prop) => (
                    <MenuItem key={prop.id} value={prop.id}>{prop.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                disabled={!selectedAccount || !selectedProperty || saving}
                startIcon={saving && <CircularProgress size={16} />}
              >
                Save Selection
              </Button>
              <Button onClick={handleTest} variant="outlined" disabled={testing} startIcon={testing && <CircularProgress size={16} />}>Test</Button>
              <Button onClick={handleDisconnect} color="error">Disconnect</Button>
            </Box>

            {visitors !== null && (
              <Alert severity="info">Visitors yesterday: {visitors}</Alert>
            )}
          </>
        ) : (
          <Button variant="contained" onClick={() => setOpen(true)} startIcon={<GoogleIcon />}>Connect Google Analytics</Button>
        )}
      </SettingsCard>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Connect Google Analytics</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You'll be redirected to Google to authorize your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConnect} variant="contained" startIcon={<GoogleIcon />}>Connect</Button>
        </DialogActions>
      </Dialog>

    </>
  );
}
