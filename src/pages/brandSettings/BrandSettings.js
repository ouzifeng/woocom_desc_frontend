import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Typography from '@mui/material/Typography';
import { useAuthState } from 'react-firebase-hooks/auth';

import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { auth } from '../../firebase';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../dashboard/theme/customizations';

import BrandIdentity from './components/BrandIdentity';
import MarketAudience from './components/MarketAudience';
import ProductPositioning from './components/ProductPositioning';
import ReferencesExamples from './components/ReferencesExamples';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function BrandSettings(props) {
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
                Brand Settings
              </Typography>
              <BrandIdentity />
              <MarketAudience />
              <ProductPositioning />
              <ReferencesExamples />
            </Box>
          </LocalizationProvider>
        </Box>
      </Box>
    </AppTheme>
  );
}
