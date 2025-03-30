import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUp from './pages/sign-up/SignUp';
import SignIn from './pages/sign-in/SignIn';
import Dashboard from './pages/dashboard/Dashboard';
import Home from './pages/dashboard/Home';
import Settings from './pages/dashboard/Settings';
import PrivateRoute from './components/PrivateRoute';
import SettingsPage from './pages/settings/SettingsPage';
import Products from './pages/products/Products';
import BrandSettings from './pages/brandSettings/BrandSettings';
import ProductTranslations from './pages/translations/ProductTranslations';
import ContentStrategy from './pages/strategy/ContentStrategy';
import ContentCreation from './pages/creation/ContentCreation';
import TranslationProductPage from './pages/translations/components/TranslationProductPage';
import BrandStrategyPage from './pages/brand-strategy/BrandStrategyPage';
import KeywordResearchPage from './pages/keyword-research/KeywordResearchPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route path="home" element={<Home />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route
            path="/settings/*"
            element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/products/*"
            element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            }
          />
          <Route
            path="/brandsettings"
            element={
              <PrivateRoute>
                <BrandSettings />
              </PrivateRoute>
            }
          />
          <Route
            path="/translations"
            element={
              <PrivateRoute>
                <ProductTranslations />
              </PrivateRoute>
            }
          />
          <Route
            path="/translations/:productId"
            element={
              <PrivateRoute>
                <TranslationProductPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/strategy"
            element={
              <PrivateRoute>
                <ContentStrategy />
              </PrivateRoute>
            }
          />
          <Route
            path="/creation"
            element={
              <PrivateRoute>
                <ContentCreation />
              </PrivateRoute>
            }
          />
          <Route
            path="/brand-strategy"
            element={
              <PrivateRoute>
                <BrandStrategyPage />
              </PrivateRoute>
            }
          />          
          <Route
            path="/keyword-research"
            element={
              <PrivateRoute>
                <KeywordResearchPage />
              </PrivateRoute>
            }
          /> 
          <Route path="/" element={<SignIn />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
