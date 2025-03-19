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
import UpdateAllProductsButton from './components/UpdateAllProductsButton';
import ProductsTable from './components/ProductsTable';
import ProductPage from './ProductPage';
import DeleteProductsButton from './components/DeleteProductsButton';
import Instructions from './components/Instructions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

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
  const [refresh, setRefresh] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const location = useLocation();

  // NEW: One global notification message
  const [notificationMessage, setNotificationMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);

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
                <Grid item xs={12} md={9}>
                  {!isProductPage && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      {/* Left side: Import + Update buttons */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <ImportProductsButton
                          storeUrl={storeUrl}
                          apiId={apiId}
                          secretKey={secretKey}
                          setRefresh={setRefresh}
                          // pass the setter for notifications
                          setNotificationMessage={setNotificationMessage}
                        />
                        <UpdateProductsButton
                          storeUrl={storeUrl}
                          apiId={apiId}
                          secretKey={secretKey}
                          setRefresh={setRefresh}
                          // pass the setter for notifications
                          setNotificationMessage={setNotificationMessage}
                        />
                        <UpdateAllProductsButton
                          storeUrl={storeUrl}
                          apiId={apiId}
                          secretKey={secretKey}
                          setRefresh={setRefresh}
                          // pass the setter for notifications
                          setNotificationMessage={setNotificationMessage}
                        />
                      </Box>

                      {/* Right side: Instructions + Delete buttons */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button size="small" variant="outlined" onClick={toggleDrawer(true)}>
                          Instructions
                        </Button>
                        <DeleteProductsButton
                          setRefresh={setRefresh}
                          selectedRows={selectedRows}
                          // pass the setter for notifications
                          setNotificationMessage={setNotificationMessage}
                        />
                      </Box>
                    </Box>
                  )}
                </Grid>

                {/* NEW ROW for the global notification */}
                <Grid item xs={12} md={9}>
                  {notificationMessage && (
                    <Typography variant="body2" color="textSecondary" textAlign={'left'}>
                      {notificationMessage}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={9}>
                  <Outlet />
                </Grid>
                <Grid item xs={12} md={9}>
                  <Routes>
                    <Route
                      path="*"
                      element={
                        <ProductsTable
                          refresh={refresh}
                          setRefresh={setRefresh}
                          setSelectedRows={setSelectedRows}
                        />
                      }
                    />
                    <Route path=":productId" element={<ProductPage />} />
                  </Routes>
                </Grid>
              </Grid>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Box>
      <Instructions drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
    </AppTheme>
  );
}
