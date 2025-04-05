import * as React from 'react';
import { Button, Typography, Alert, Card, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

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
        1. Download and install the plugin below<br />
        2. Go to your WooCommerce Admin and activate the plugin<br />
        3. The plugin will automatically connect your store to Ecommander
      </Typography>

      <Button
        variant="contained"
        onClick={handleDownloadPlugin}
      >
        Download Plugin
      </Button>

      <Alert severity="info">
        You’ll be redirected back here automatically once connected.
      </Alert>
    </SettingsCard>
  );
}
