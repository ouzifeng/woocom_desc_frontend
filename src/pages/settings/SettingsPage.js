import React from 'react';
import { Outlet } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Typography from '@mui/material/Typography';
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
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../dashboard/theme/customizations';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

const CARD_HEIGHT = 550; // Fixed height for all cards

export default function SettingsPage(props) {
  const [user] = useAuthState(auth);

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
              <Header />
              <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
                Store Settings
              </Typography>

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
    </AppTheme>
  );
}
