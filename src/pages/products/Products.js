import * as React from 'react';
import { useState, useEffect } from 'react';
import { Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
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
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadCSVButton from './components/DownloadCSVButton';
import Tooltip from '@mui/material/Tooltip';

// Lazy load components
const ImportProductsButton = React.lazy(() => import('./components/ImportProductsButton'));
const UpdateProductsButton = React.lazy(() => import('./components/UpdateProductsButton'));
const UpdateAllProductsButton = React.lazy(() => import('./components/UpdateAllProductsButton'));
const ProductsTable = React.lazy(() => import('./components/ProductsTable'));
const ProductPage = React.lazy(() => import('./ProductPage'));
const DeleteProductsButton = React.lazy(() => import('./components/DeleteProductsButton'));
const Instructions = React.lazy(() => import('./components/Instructions'));


// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const xThemeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

export default function Products(props) {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [storeUrl, setStoreUrl] = useState('');
  const [apiId, setApiId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const location = useLocation();
  const [notificationMessage, setNotificationMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hasWooCommerceCredentials, setHasWooCommerceCredentials] = useState(false);

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
          // Check if all WooCommerce credentials are present
          setHasWooCommerceCredentials(!!(data.wc_url && data.wc_key && data.wc_secret));
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

  const handleDisabledButtonClick = () => {
    setNotificationMessage('Please connect your WooCommerce store in Settings first.');
    setTimeout(() => {
      navigate('/settings');
    }, 2000);
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
                <Grid item xs={12} md={12}>
                  {!isProductPage && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <React.Suspense fallback={<CircularProgress size={24} />}>
                          <Tooltip title={!hasWooCommerceCredentials ? "Connect WooCommerce on the integrations pagefirst" : ""}>
                            <span>
                              <ImportProductsButton
                                storeUrl={storeUrl}
                                apiId={apiId}
                                secretKey={secretKey}
                                setRefresh={setRefresh}
                                setNotificationMessage={setNotificationMessage}
                                disabled={!hasWooCommerceCredentials}
                                onClick={!hasWooCommerceCredentials ? handleDisabledButtonClick : undefined}
                              />
                            </span>
                          </Tooltip>
                        </React.Suspense>
                        <React.Suspense fallback={<CircularProgress size={24} />}>
                          <Tooltip title={!hasWooCommerceCredentials ? "Connect WooCommerce on the integrations page first" : ""}>
                            <span>
                              <UpdateProductsButton
                                storeUrl={storeUrl}
                                apiId={apiId}
                                secretKey={secretKey}
                                setRefresh={setRefresh}
                                setNotificationMessage={setNotificationMessage}
                                disabled={!hasWooCommerceCredentials}
                                onClick={!hasWooCommerceCredentials ? handleDisabledButtonClick : undefined}
                              />
                            </span>
                          </Tooltip>
                        </React.Suspense>
                        <React.Suspense fallback={<CircularProgress size={24} />}>
                          <Tooltip title={!hasWooCommerceCredentials ? "Connect WooCommerce on the integrations page first" : ""}>
                            <span>
                              <UpdateAllProductsButton
                                storeUrl={storeUrl}
                                apiId={apiId}
                                secretKey={secretKey}
                                setRefresh={setRefresh}
                                setNotificationMessage={setNotificationMessage}
                                disabled={!hasWooCommerceCredentials}
                                onClick={!hasWooCommerceCredentials ? handleDisabledButtonClick : undefined}
                              />
                            </span>
                          </Tooltip>
                        </React.Suspense>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <DownloadCSVButton
                          selectedRows={selectedRows}
                          setNotificationMessage={setNotificationMessage}
                        />
                        <Button size="small" variant="outlined" onClick={toggleDrawer(true)}>
                          Instructions
                        </Button>
                        <React.Suspense fallback={<CircularProgress size={24} />}>
                          <DeleteProductsButton
                            setRefresh={setRefresh}
                            selectedRows={selectedRows}
                          />
                        </React.Suspense>
                      </Box>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12} md={12}>
                  {notificationMessage && (
                    <Typography variant="body2" color="textSecondary" textAlign={'left'}>
                      {notificationMessage}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={12}>
                  <Outlet />
                </Grid>
                <Grid item xs={12} md={12}>
                  <Routes>
                    <Route
                      path="*"
                      element={
                        <React.Suspense fallback={<LoadingFallback />}>
                          <ProductsTable
                            refresh={refresh}
                            setRefresh={setRefresh}
                            setSelectedRows={setSelectedRows}
                          />
                        </React.Suspense>
                      }
                    />
                    <Route 
                      path=":productId" 
                      element={
                        <React.Suspense fallback={<LoadingFallback />}>
                          <ProductPage />
                        </React.Suspense>
                      } 
                    />
                  </Routes>
                </Grid>
              </Grid>
            </Stack>
          </LocalizationProvider>
        </Box>
      </Box>
      <React.Suspense fallback={<LoadingFallback />}>
        <Instructions drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
      </React.Suspense>
    </AppTheme>
  );
}
