import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';

const StoreConnectionContext = createContext();

export function StoreConnectionProvider({ children }) {
  const [connectedPlatform, setConnectedPlatform] = useState(null);
  const [hasGoogleAnalytics, setHasGoogleAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkGoogleAnalyticsConnection = async (token) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const gaRes = await fetch(`${API_URL}/analytics/accounts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const gaData = await gaRes.json();
    setHasGoogleAnalytics(gaData.connected || false);
  };

  const checkShopifyConnection = async (token) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const shopifyRes = await fetch(`${API_URL}/shopify/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const shopifyData = await shopifyRes.json();
    if (shopifyData.connected) {
      setConnectedPlatform('shopify');
    }
  };

  const checkWooCommerceConnection = async (token) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const wooRes = await fetch(`${API_URL}/woocommerce/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const wooData = await wooRes.json();
    if (wooData.connected) {
      setConnectedPlatform('woocommerce');
    }
  };

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        await checkGoogleAnalyticsConnection(token);
        await checkShopifyConnection(token);
        await checkWooCommerceConnection(token);
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
    loading,
    checkGoogleAnalyticsConnection,
    checkShopifyConnection,
    checkWooCommerceConnection
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