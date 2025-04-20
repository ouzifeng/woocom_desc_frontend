import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';

const StoreConnectionContext = createContext();

export function StoreConnectionProvider({ children }) {
  const [connectedPlatform, setConnectedPlatform] = useState(null);
  const [hasGoogleAnalytics, setHasGoogleAnalytics] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeBrandId, setActiveBrandId] = useState(null);

  useEffect(() => {
    const savedBrandId = localStorage.getItem('activeBrandId');
    if (savedBrandId) {
      setActiveBrandId(savedBrandId);
    }
  }, []);

  const checkGoogleAnalyticsConnection = async (token, brandId = null) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const targetBrandId = brandId || activeBrandId;
    
    if (!targetBrandId) {
      console.error('No brand ID available for Google Analytics connection check');
      return;
    }
    
    const gaRes = await fetch(`${API_URL}/analytics/accounts?brandId=${targetBrandId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const gaData = await gaRes.json();
    setHasGoogleAnalytics(gaData.connected || false);
  };

  const checkShopifyConnection = async (token, brandId = null) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const targetBrandId = brandId || activeBrandId;
    
    if (!targetBrandId) {
      console.error('No brand ID available for Shopify connection check');
      return;
    }

    const shopifyRes = await fetch(`${API_URL}/shopify/status?brandId=${targetBrandId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const shopifyData = await shopifyRes.json();
    if (shopifyData.connected) {
      setConnectedPlatform('shopify');
    }
  };

  const checkWooCommerceConnection = async (token, brandId = null) => {
    const API_URL = process.env.REACT_APP_API_URL;
    const targetBrandId = brandId || activeBrandId;
    
    if (!targetBrandId) {
      console.error('No brand ID available for WooCommerce connection check');
      return;
    }
    
    try {
      const wooRes = await fetch(`${API_URL}/woocommerce/status?brandId=${targetBrandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const wooData = await wooRes.json();
      if (wooData.connected) {
        setConnectedPlatform('woocommerce');
      }
    } catch (error) {
      console.error('Error checking WooCommerce status:', error);
    }
  };

  useEffect(() => {
    const checkConnectionStatus = async () => {
      try {
        const user = auth.currentUser;
        if (!user || !activeBrandId) {
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();
        await checkGoogleAnalyticsConnection(token, activeBrandId);
        await checkShopifyConnection(token, activeBrandId);
        await checkWooCommerceConnection(token, activeBrandId);
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectedPlatform(null);
        setHasGoogleAnalytics(false);
      } finally {
        setLoading(false);
      }
    };

    if (activeBrandId) {
      checkConnectionStatus();
    } else {
      setLoading(false);
    }
  }, [activeBrandId]);

  const value = {
    connectedPlatform,
    setConnectedPlatform,
    hasGoogleAnalytics,
    setHasGoogleAnalytics,
    loading,
    checkGoogleAnalyticsConnection,
    checkShopifyConnection,
    checkWooCommerceConnection,
    setActiveBrandId,
    activeBrandId
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