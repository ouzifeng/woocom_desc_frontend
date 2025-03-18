import * as React from 'react';
import { useState, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from '../dashboard/theme/customizations';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ImportProductsButton from './components/ImportProductsButton';
import UpdateProductsButton from './components/UpdateProductsButton';
import ProductsTable from './components/ProductsTable';
import ProductPage from './ProductPage';

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Products(props) {
  const [user] = useAuthState(auth);
  const [storeUrl, setStoreUrl] = useState('');
  const [apiId, setApiId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [refresh, setRefresh] = useState(false); // Add this line
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setStoreUrl(data.wc_url || '');
          setApiId(data.wc_key || '');
          setSecretKey(data.wc_secret || '');
        }
      }
    };
    fetchData();
  }, [user]);

  const isProductPage = location.pathname.includes('/products/');

  return (
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
              <Grid container spacing={3}>
                <Grid item xs={12} md={3}>
                  {!isProductPage && (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <ImportProductsButton storeUrl={storeUrl} apiId={apiId} secretKey={secretKey} setRefresh={setRefresh} />
                      <UpdateProductsButton storeUrl={storeUrl} apiId={apiId} secretKey={secretKey} setRefresh={setRefresh} />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={9}>
                  <Outlet />
                </Grid>
                <Grid item xs={12} md={9}>
                  <Routes>
                    <Route path="*" element={<ProductsTable refresh={refresh} setRefresh={setRefresh} />} />
                    <Route path=":productId" element={<ProductPage />} />
                  </Routes>
                </Grid>
              </Grid>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Box>
    </AppTheme>
  );
}
