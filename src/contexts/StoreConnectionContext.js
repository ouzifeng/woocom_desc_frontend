import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';

const StoreConnectionContext = createContext();

export function StoreConnectionProvider({ children }) {
  const [connectedPlatform, setConnectedPlatform] = useState(null);
  const [hasGoogleAnalytics, setHasGoogleAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check connection status on mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        const API_URL = process.env.REACT_APP_API_URL;

        // Check Google Analytics connection
        const gaRes = await fetch(`${API_URL}/analytics/accounts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const gaData = await gaRes.json();
        setHasGoogleAnalytics(gaData.connected || false);

        // Check Shopify connection
        const shopifyRes = await fetch(`${API_URL}/shopify/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const shopifyData = await shopifyRes.json();
        
        if (shopifyData.connected) {
          setConnectedPlatform('shopify');
          setLoading(false);
          return;
        }

        // Check WooCommerce connection
        const wooRes = await fetch(`${API_URL}/woocommerce/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const wooData = await wooRes.json();
        
        if (wooData.connected) {
          setConnectedPlatform('woocommerce');
        } else {
          setConnectedPlatform(null);
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectedPlatform(null);
        setHasGoogleAnalytics(false);
      } finally {
        setLoading(false);
      }
    };

    checkConnectionStatus();
  }, []);

  const value = {
    connectedPlatform,
    setConnectedPlatform,
    hasGoogleAnalytics,
    setHasGoogleAnalytics,
    loading
  };

  return (
    <StoreConnectionContext.Provider value={value}>
      {children}
    </StoreConnectionContext.Provider>
  );
}

export function useStoreConnection() {
  const context = useContext(StoreConnectionContext);
  if (context === undefined) {
    throw new Error('useStoreConnection must be used within a StoreConnectionProvider');
  }
  return context;
} 