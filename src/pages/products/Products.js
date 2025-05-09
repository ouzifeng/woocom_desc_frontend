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
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
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
import Alert from '@mui/material/Alert';
import DownloadCSVButton from './components/DownloadCSVButton';
import Tooltip from '@mui/material/Tooltip';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../components/ToasterAlert';
import StoreConnectionStatus from '../../components/StoreConnectionStatus';
import { useStoreConnection } from '../../contexts/StoreConnectionContext';
import { useBrand } from '../../contexts/BrandContext';

// Lazy load components
const ImportProductsButton = React.lazy(() => import('./components/ImportProductsButton'));
const UpdateProductsButton = React.lazy(() => import('./components/UpdateProductsButton'));
const UpdateAllProductsButton = React.lazy(() => import('./components/UpdateAllProductsButton'));
const ShopifyImportProductsButton = React.lazy(() => import('./components/ShopifyImportProductsButton'));
const ShopifyUpdateProductsButton = React.lazy(() => import('./components/ShopifyUpdateProductsButton'));
const ShopifyUpdateAllProductsButton = React.lazy(() => import('./components/ShopifyUpdateAllProductsButton'));
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
  const { showToast } = useToast();
  const [user] = useAuthState(auth);
  const { activeBrandId, activeBrand } = useBrand();
  const navigate = useNavigate();
  const [storeUrl, setStoreUrl] = useState('');
  const [apiId, setApiId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [refresh, setRefresh] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const location = useLocation();
  const [notificationMessage, setNotificationMessage] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = React.useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const { connectedPlatform, checkShopifyConnection, checkWooCommerceConnection } = useStoreConnection();

  useEffect(() => {
    const checkConnections = async () => {
      if (!user || !activeBrandId) return;
      try {
        console.log('Checking store connections for brand:', activeBrandId);
        const token = await user.getIdToken();
        await Promise.all([
          checkShopifyConnection(token, activeBrandId),
          checkWooCommerceConnection(token, activeBrandId)
        ]);
      } catch (error) {
        console.error('Error checking connections:', error);
      }
    };

    checkConnections();
  }, [user, activeBrandId, checkShopifyConnection, checkWooCommerceConnection]);

  React.useEffect(() => {
    const fetchWooCommerceCredentials = async () => {
      setLoading(true);
      try {
        if (user && activeBrandId && connectedPlatform === 'woocommerce') {
          console.log('Fetching WooCommerce credentials for brand:', activeBrandId);
          const brandDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId);
          const docSnap = await getDoc(brandDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setStoreUrl(data.wc_url || '');
            setApiId(data.wc_key || '');
            setSecretKey(data.wc_secret || '');
          }
        }
      } catch (error) {
        console.error('Error fetching WooCommerce credentials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWooCommerceCredentials();
  }, [user, activeBrandId, connectedPlatform]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      if (!activeBrandId) {
        console.log('No active brand selected, skipping product fetch');
        setLoading(false);
        return;
      }

      try {
        console.log(`Fetching improved products for brand: ${activeBrandId}`);
        // Update path to include the brand ID
        const productsRef = collection(db, 'users', user.uid, 'brands', activeBrandId, 'products');
        const q = query(productsRef, where('improved', '==', true));
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log(`Found ${productsData.length} improved products for brand ${activeBrandId}`);
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to fetch products');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, activeBrandId]);

  const isProductPage = location.pathname.includes('/products/');

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleDisabledButtonClick = () => {
    showToast('Please connect either WooCommerce or Shopify store in Settings first.', 'warning');
    setTimeout(() => {
      navigate('/settings');
    }, 2000);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const isWooCommerceConnected = connectedPlatform === 'woocommerce';
  const isShopifyConnected = connectedPlatform === 'shopify';
  const isAnyStoreConnected = isWooCommerceConnected || isShopifyConnected;

  console.log('Connection status:', { connectedPlatform, isWooCommerceConnected, isShopifyConnected, isAnyStoreConnected });

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
                {!activeBrandId && (
                  <Grid item xs={12}>
                    <Alert severity="warning">
                      Please select a brand to view and manage products.
                    </Alert>
                  </Grid>
                )}
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
                        {isWooCommerceConnected ? (
                          <>
                            <React.Suspense fallback={<CircularProgress size={24} />}>
                              <Tooltip title={!isWooCommerceConnected ? "Connect WooCommerce on the integrations page first" : ""}>
                                <span>
                                  <ImportProductsButton
                                    storeUrl={storeUrl}
                                    apiId={apiId}
                                    secretKey={secretKey}
                                    setRefresh={setRefresh}
                                    setNotificationMessage={(msg) => showToast(msg)}
                                    disabled={!isWooCommerceConnected || !activeBrandId}
                                    onClick={!isWooCommerceConnected ? handleDisabledButtonClick : undefined}
                                  />
                                </span>
                              </Tooltip>
                            </React.Suspense>
                            <React.Suspense fallback={<CircularProgress size={24} />}>
                              <Tooltip title={!isWooCommerceConnected ? "Connect WooCommerce on the integrations page first" : ""}>
                                <span>
                                  <UpdateProductsButton
                                    storeUrl={storeUrl}
                                    apiId={apiId}
                                    secretKey={secretKey}
                                    setRefresh={setRefresh}
                                    setNotificationMessage={(msg) => showToast(msg)}
                                    disabled={!isWooCommerceConnected || !activeBrandId}
                                    onClick={!isWooCommerceConnected ? handleDisabledButtonClick : undefined}
                                  />
                                </span>
                              </Tooltip>
                            </React.Suspense>
                            <React.Suspense fallback={<CircularProgress size={24} />}>
                              <Tooltip title={!isWooCommerceConnected ? "Connect WooCommerce on the integrations page first" : ""}>
                                <span>
                                  <UpdateAllProductsButton
                                    storeUrl={storeUrl}
                                    apiId={apiId}
                                    secretKey={secretKey}
                                    setRefresh={setRefresh}
                                    setNotificationMessage={(msg) => showToast(msg)}
                                    disabled={!isWooCommerceConnected || !activeBrandId}
                                    onClick={!isWooCommerceConnected ? handleDisabledButtonClick : undefined}
                                  />
                                </span>
                              </Tooltip>
                            </React.Suspense>
                          </>
                        ) : isShopifyConnected ? (
                          <>
                            <React.Suspense fallback={<CircularProgress size={24} />}>
                              <Tooltip title={!isShopifyConnected ? "Connect Shopify on the integrations page first" : ""}>
                                <span>
                                  <ShopifyImportProductsButton
                                    setRefresh={setRefresh}
                                    setNotificationMessage={(msg) => showToast(msg)}
                                    disabled={!isShopifyConnected || !activeBrandId}
                                    onClick={!isShopifyConnected ? handleDisabledButtonClick : undefined}
                                  />
                                </span>
                              </Tooltip>
                            </React.Suspense>
                            <React.Suspense fallback={<CircularProgress size={24} />}>
                              <Tooltip title={!isShopifyConnected ? "Connect Shopify on the integrations page first" : ""}>
                                <span>
                                  <ShopifyUpdateProductsButton
                                    setRefresh={setRefresh}
                                    setNotificationMessage={(msg) => showToast(msg)}
                                    disabled={!isShopifyConnected || !activeBrandId}
                                    onClick={!isShopifyConnected ? handleDisabledButtonClick : undefined}
                                  />
                                </span>
                              </Tooltip>
                            </React.Suspense>
                            <React.Suspense fallback={<CircularProgress size={24} />}>
                              <Tooltip title={!isShopifyConnected ? "Connect Shopify on the integrations page first" : ""}>
                                <span>
                                  <ShopifyUpdateAllProductsButton
                                    setRefresh={setRefresh}
                                    setNotificationMessage={(msg) => showToast(msg)}
                                    disabled={!isShopifyConnected || !activeBrandId}
                                    onClick={!isShopifyConnected ? handleDisabledButtonClick : undefined}
                                  />
                                </span>
                              </Tooltip>
                            </React.Suspense>
                          </>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Please connect either WooCommerce or Shopify in Settings.
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <DownloadCSVButton
                          selectedRows={selectedRows}
                          setNotificationMessage={(msg) => showToast(msg)}
                        />
                        <Button size="small" variant="outlined" onClick={toggleDrawer(true)}>
                          Instructions
                        </Button>
                        <React.Suspense fallback={<CircularProgress size={24} />}>
                          <DeleteProductsButton
                            setRefresh={setRefresh}
                            selectedRows={selectedRows}
                            setNotificationMessage={(msg) => showToast(msg)}
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
                  <Outlet context={{ refresh, setRefresh, setSelectedRows }} />
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
