import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useAuthState } from 'react-firebase-hooks/auth';
import ShopifySettingsCard from './components/ShopifySettingsCard';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { auth } from '../../firebase';
import WooCommerceSettingsCard from './components/WooCommerceSettingsCard';
import CsvImport from './components/CsvImport';
import GoogleAnalyticsCard from './components/GoogleAnalyticsCard';
import StoreConnectionStatus from '../../components/StoreConnectionStatus';
import SettingsInstructions from './components/SettingsInstructions';
import { useBrand } from '../../contexts/BrandContext';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../dashboard/theme/customizations';
import { useStoreConnection } from '../../contexts/StoreConnectionContext';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const CARD_HEIGHT = 550; // Fixed height for all cards

export default function SettingsPage(props) {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { checkGoogleAnalyticsConnection, checkShopifyConnection, checkWooCommerceConnection } = useStoreConnection();

  useEffect(() => {
    const checkConnections = async () => {
      if (!user || !activeBrandId) return;
      const token = await user.getIdToken();
      await checkGoogleAnalyticsConnection(token, activeBrandId);
      await checkShopifyConnection(token, activeBrandId);
      await checkWooCommerceConnection(token, activeBrandId);
    };

    checkConnections();
  }, [user, activeBrandId, checkGoogleAnalyticsConnection, checkShopifyConnection, checkWooCommerceConnection]);

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <AppTheme {...props} themeComponents={xThemeComponents}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu user={user} />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            width: '100%',
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ p: 3, width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1">
                  Store Settings
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={toggleDrawer(true)}
                  sx={{ ml: 2 }}
                >
                  Instructions
                </Button>
              </Box>
              <StoreConnectionStatus />
              <Grid container spacing={3}>
                <Grid item xs={12} md={3} sx={{ height: CARD_HEIGHT }}>
                  <Box sx={{ height: '100%' }}>
                    <WooCommerceSettingsCard />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3} sx={{ height: CARD_HEIGHT }}>
                  <Box sx={{ height: '100%' }}>
                    <CsvImport />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3} sx={{ height: CARD_HEIGHT }}>
                  <Box sx={{ height: '100%' }}>
                    <GoogleAnalyticsCard />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3} sx={{ height: CARD_HEIGHT }}>
                  <Box sx={{ height: '100%' }}>
                    <Outlet />
                  </Box>
                </Grid>
                <Grid item xs={12} md={3} sx={{ height: CARD_HEIGHT }}>
                  <Box sx={{ height: '100%' }}>
                    <ShopifySettingsCard />
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </LocalizationProvider>
        </Box>
      </Box>
      <SettingsInstructions drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
    </AppTheme>
  );
}
