import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import LoadingSpinner from './components/LoadingSpinner';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Eagerly loaded components (keep authentication and core components)
import SignIn from './pages/sign-in/SignIn';
import SignUp from './pages/sign-up/SignUp';

// Lazy load everything including Dashboard for better performance
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const Products = React.lazy(() => import('./pages/products/Products'));
const ProductPage = React.lazy(() => import('./pages/products/ProductPage'));
const ContentStrategy = React.lazy(() => import('./pages/strategy/ContentStrategy'));
const ContentPage = React.lazy(() => import('./pages/strategy/ContentPage'));
const KeywordResearch = React.lazy(() => import('./pages/keyword-research/KeywordResearchPage'));
const ImageCreation = React.lazy(() => import('./pages/image-creation/ImageCreation'));
const ProductTranslations = React.lazy(() => import('./pages/translations/ProductTranslations'));
const BrandStrategy = React.lazy(() => import('./pages/brand-strategy/BrandStrategyPage'));
const Settings = React.lazy(() => import('./pages/settings/SettingsPage'));
const BrandSettings = React.lazy(() => import('./pages/brandSettings/BrandSettings'));
const TranslationProductPage = React.lazy(() => import('./pages/translations/components/TranslationProductPage'));

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <ThemeProvider theme={createTheme()}>
        <React.Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/sign-in" element={!user ? <SignIn /> : <Navigate to="/dashboard" />} />
            <Route path="/sign-up" element={!user ? <SignUp /> : <Navigate to="/dashboard" />} />
            
            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            {/* Protected Routes with Lazy Loading */}
            {user ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductPage />} />
                <Route path="/strategy" element={<ContentStrategy />} />
                <Route path="/strategy/:id" element={<ContentPage />} />
                <Route path="/keyword-research" element={<KeywordResearch />} />
                <Route path="/image-creation" element={<ImageCreation />} />
                <Route path="/translations" element={<ProductTranslations />} />
                <Route path="/translations/:productId" element={<TranslationProductPage />} />
                <Route path="/brand-strategy" element={<BrandStrategy />} />
                <Route path="/brand-settings" element={<BrandSettings />} />
                <Route path="/settings" element={<Settings />} />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/sign-in" />} />
            )}
          </Routes>
        </React.Suspense>
      </ThemeProvider>
    </Router>
  );
}

export default App;
