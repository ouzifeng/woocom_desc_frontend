import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ToastProvider, useToast } from './components/ToasterAlert';
import { StoreConnectionProvider } from './contexts/StoreConnectionContext';
import { BrandProvider } from './contexts/BrandContext';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import GlobalInviteBanner from './components/GlobalInviteBanner';


// Eagerly loaded components (keep authentication and core components)
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';


// Lazy load everything including Dashboard for better performance
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const Products = React.lazy(() => import('./pages/products/Products'));
const ProductPage = React.lazy(() => import('./pages/products/ProductPage'));
const ProductsTable = React.lazy(() => import('./pages/products/components/ProductsTable'));
const ContentStrategy = React.lazy(() => import('./pages/strategy/ContentStrategy'));
const ContentPage = React.lazy(() => import('./pages/strategy/ContentPage'));
const KeywordResearch = React.lazy(() => import('./pages/keyword-research/KeywordResearchPage'));
const ImageCreation = React.lazy(() => import('./pages/image-creation/ImageCreation'));
const StockImages = React.lazy(() => import('./pages/stock-images/components/stockImages'));
const ProductTranslations = React.lazy(() => import('./pages/translations/ProductTranslations'));
const Settings = React.lazy(() => import('./pages/settings/SettingsPage'));
const BrandSettings = React.lazy(() => import('./pages/brandSettings/BrandSettings'));
const TranslationProductPage = React.lazy(() => import('./pages/translations/components/TranslationProductPage'));
const Checkout = React.lazy(() => import('./pages/checkout/Checkout'));
const WooCommerceConnectRoute = React.lazy(() => import('./pages/settings/WooCommerceConnectRoute'));
const YourBrands = React.lazy(() => import('./pages/your-brands/YourBrands'));
const AcceptInvite = React.lazy(() => import('./pages/AcceptInvite'));
const ProductImages = React.lazy(() => import('./pages/product-images/ProductImages'));


function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <ThemeProvider theme={createTheme()}>
        <ToastProvider>
          {/* Global Invite Notification Banner */}
          <GlobalInviteBanner />
          <StoreConnectionProvider>
            <BrandProvider>
              <React.Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/sign-in" element={!user ? <SignIn /> : <Navigate to="/dashboard" />} />
                  <Route path="/sign-up" element={!user ? <SignUp /> : <Navigate to="/settings" />} />

                  <Route path="/woocommerce/receive" element={<WooCommerceConnectRoute />} />
                  <Route path="/accept-invite" element={<AcceptInvite />} />
                  
                  {/* Redirect root to dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  
                  {/* Protected Routes with Lazy Loading */}
                  {user ? (
                    <>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/products" element={<Products />}>
                        <Route index element={<ProductsTable />} />
                        <Route path=":productId" element={<ProductPage />} />
                        <Route path=":productId_:lang" element={<ProductPage />} />
                      </Route>
                      <Route path="/strategy" element={<ContentStrategy />} />
                      <Route path="/strategy/:id" element={<ContentPage />} />
                      <Route path="/keyword-research" element={<KeywordResearch />} />
                      <Route path="/image-creation" element={<ImageCreation />} />
                      <Route path="/stock-images" element={<StockImages />} />
                      <Route path="/translations" element={<ProductTranslations />} />
                      <Route path="/translations/:productId" element={<TranslationProductPage />} />
                      <Route path="/brand-settings" element={<BrandSettings />} />
                      <Route path="/your-brands" element={<YourBrands />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/product-images" element={<ProductImages />} />
                    </>
                  ) : (
                    <Route path="*" element={<Navigate to="/sign-in" />} />
                  )}
                </Routes>
              </React.Suspense>
            </BrandProvider>
          </StoreConnectionProvider>
        </ToastProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
