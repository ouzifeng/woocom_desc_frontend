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
          <Route path="/" element={<SignIn />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
