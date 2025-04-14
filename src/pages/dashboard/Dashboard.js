import * as React from 'react';
import { Outlet } from 'react-router-dom';
import './Dashboard.css';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MainGrid from './components/MainGrid'
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import AppNavbar from './components/AppNavbar';
import Header from './components/Header';
import SideMenu from './components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from './theme/customizations';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DashboardGAProvider } from './DashboardGAProvider';
import { useStoreConnection } from '../../contexts/StoreConnectionContext';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Dashboard(props) {
  const [user] = useAuthState(auth);
  const { checkGoogleAnalyticsConnection } = useStoreConnection();

  React.useEffect(() => {
    const checkConnection = async () => {
      if (!user) return;
      const token = await user.getIdToken();
      await checkGoogleAnalyticsConnection(token);
    };

    checkConnection();
  }, [user, checkGoogleAnalyticsConnection]);

  return (
    <DashboardGAProvider>
      <AppTheme {...props} themeComponents={xThemeComponents}>
        <CssBaseline enableColorScheme />
        <Box sx={{ display: 'flex' }}>
          <SideMenu user={user} />
          <AppNavbar />
          {/* Main content */}
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : alpha(theme.palette.background.default, 1),
              overflow: 'auto',
            })}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack
                spacing={2}
                sx={{
                  alignItems: 'center',
                  mx: 3,
                  pb: 5,
                  mt: { xs: 8, md: 0 },
                }}
              >
                <Header />
                <MainGrid />
                <Outlet />
              </Stack>
            </LocalizationProvider>
          </Box>
        </Box>
      </AppTheme>
    </DashboardGAProvider>
  );
}
