// GoogleAnalyticsCard.jsx
import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Box from '@mui/material/Box';
import GoogleIcon from '@mui/icons-material/Google';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { styled } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

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
  ...theme.applyStyles?.('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function GoogleAnalyticsCard() {
  const [open, setOpen] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [accounts, setAccounts] = React.useState([]);
  const [properties, setProperties] = React.useState([]);
  const [selectedAccount, setSelectedAccount] = React.useState('');
  const [selectedProperty, setSelectedProperty] = React.useState('');

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConnect = async () => {
    // Call backend to get Google OAuth URL
    const res = await fetch('/api/analytics/auth/url');
    const data = await res.json();
    window.location.href = data.url;
  };

  const handleDisconnect = () => {
    // Clear connection state
    setIsConnected(false);
    setAccounts([]);
    setProperties([]);
    setSelectedAccount('');
    setSelectedProperty('');
  };

  const fetchAccounts = async () => {
    const res = await fetch('/api/analytics/accounts');
    const data = await res.json();
    setAccounts(data.accounts);
  };

  const fetchProperties = async (accountId) => {
    const res = await fetch(`/api/analytics/properties?account=${accountId}`);
    const data = await res.json();
    setProperties(data.properties);
  };

  React.useEffect(() => {
    if (isConnected) fetchAccounts();
  }, [isConnected]);

  React.useEffect(() => {
    if (selectedAccount) fetchProperties(selectedAccount);
  }, [selectedAccount]);

  return (
    <>
      <SettingsCard variant="outlined">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6">Google Analytics</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary">
          Connect your Google Analytics account to track performance and insights.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {isConnected ? (
            <>
              <FormControl fullWidth size="small">
                <InputLabel id="account-select-label">Account</InputLabel>
                <Select
                  labelId="account-select-label"
                  value={selectedAccount}
                  label="Account"
                  onChange={(e) => setSelectedAccount(e.target.value)}
                >
                  {accounts.map((acc) => (
                    <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel id="property-select-label">Property</InputLabel>
                <Select
                  labelId="property-select-label"
                  value={selectedProperty}
                  label="Property"
                  onChange={(e) => setSelectedProperty(e.target.value)}
                >
                  {properties.map((prop) => (
                    <MenuItem key={prop.id} value={prop.id}>{prop.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                color="error"
                onClick={handleDisconnect}
                size="small"
              >
                Disconnect
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={handleClickOpen}
              startIcon={<GoogleIcon />}
              size="small"
            >
              Connect Google Analytics
            </Button>
          )}
        </Box>
      </SettingsCard>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <GoogleIcon color="primary" /> Connect Google Analytics
          </Box>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Connect your Google Analytics account to:
          </DialogContentText>
          <Box component="ul" sx={{ mt: 2 }}>
            <Typography component="li">Track performance</Typography>
            <Typography component="li">Get customer insights</Typography>
            <Typography component="li">Monitor traffic</Typography>
            <Typography component="li">Analyze behavior</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            You will be redirected to Google to authorize access.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button 
            onClick={handleConnect}
            variant="contained"
            startIcon={<GoogleIcon />}
          >
            Connect with Google
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}