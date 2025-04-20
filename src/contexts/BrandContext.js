import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { 
  collection, 
  query, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { useStoreConnection } from './StoreConnectionContext';

// Create the context
const BrandContext = createContext();

// Custom hook to use the brand context
export const useBrand = () => {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
};

// Provider component
export const BrandProvider = ({ children }) => {
  const [user] = useAuthState(auth);
  const [userBrands, setUserBrands] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [integrationStatus, setIntegrationStatus] = useState({});
  
  // Get StoreConnection context
  const { 
    checkWooCommerceConnection, 
    checkShopifyConnection, 
    checkGoogleAnalyticsConnection,
    setConnectedPlatform,
    setHasGoogleAnalytics,
    setActiveBrandId: setStoreActiveBrandId 
  } = useStoreConnection();

  // Clear any existing state when user logs out
  useEffect(() => {
    if (!user) {
      setUserBrands([]);
      setActiveBrandId(null);
      setActiveBrand(null);
      setLoading(false);
      setIntegrationStatus({});
      localStorage.removeItem('activeBrandId');
    }
  }, [user]);

  // Load brands from Firestore when user is authenticated
  useEffect(() => {
    if (!user) return;

    console.log("Loading brands for user:", user.uid);
    setLoading(true);
    
    try {
      // Set up listener for user's brands
      const brandsRef = collection(db, `users/${user.uid}/brands`);
      const q = query(brandsRef);
      
      console.log("Setting up brands listener at:", `users/${user.uid}/brands`);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        console.log("Brands snapshot received, count:", querySnapshot.size);
        const brands = [];
        querySnapshot.forEach((doc) => {
          brands.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        
        console.log("Brands loaded:", brands);
        setUserBrands(brands);
        setLoading(false);
        
        // Initialize active brand if needed
        if (brands.length > 0) {
          // Check if there's a saved brand ID in localStorage
          const savedBrandId = localStorage.getItem('activeBrandId');
          console.log("Saved brand ID from localStorage:", savedBrandId);
          
          // Verify the saved brand still exists in the user's brands
          const brandExists = savedBrandId && brands.some(brand => brand.id === savedBrandId);
          
          // Set active brand to saved one or default to first brand
          const brandToActivate = brandExists ? savedBrandId : brands[0].id;
          console.log("Activating brand:", brandToActivate);
          
          // Set active brand
          setActiveBrandId(brandToActivate);
          setActiveBrand(brands.find(b => b.id === brandToActivate));
          
          // Save to localStorage
          localStorage.setItem('activeBrandId', brandToActivate);
        } else {
          console.log("No brands available for this user");
        }
      }, (error) => {
        console.error("Error fetching brands:", error);
        setError(error.message);
        setLoading(false);
      });
      
      // Clean up listener on unmount
      return () => {
        console.log("Cleaning up brands listener");
        unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up brands listener:", error);
      setError(error.message);
      setLoading(false);
    }
  }, [user]);

  // Update active brand when activeBrandId changes
  useEffect(() => {
    if (!activeBrandId || !userBrands.length) return;
    
    console.log("Active brand ID changed:", activeBrandId);
    const brand = userBrands.find(b => b.id === activeBrandId);
    if (brand) {
      console.log("Setting active brand:", brand);
      setActiveBrand(brand);
      setError(null); // Clear any previous errors
      
      // Update StoreConnectionContext with the current brand ID
      if (setStoreActiveBrandId) {
        setStoreActiveBrandId(activeBrandId);
      }
      
      // Check integration status for this brand if we don't have recent data
      checkIntegrationStatus(activeBrandId);
    } else {
      console.warn("Brand not found for ID:", activeBrandId);
      // Don't set error - this is likely a temporary state during brand creation
    }
  }, [activeBrandId, userBrands, setStoreActiveBrandId]);

  // Function to check integration status for a brand
  const checkIntegrationStatus = async (brandId) => {
    if (!user || !brandId) return;
    
    // Check if we have recent cached status (within last hour)
    const currentStatus = integrationStatus[brandId];
    const now = new Date().getTime();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    if (currentStatus && currentStatus.lastChecked > oneHourAgo) {
      // Use cached status if recent
      console.log("Using cached integration status for brand:", brandId);
      updateGlobalIntegrationStatus(currentStatus);
      return currentStatus;
    }
    
    try {
      console.log("Checking integration status for brand:", brandId);
      // Fetch brand integration data
      const brandRef = doc(db, `users/${user.uid}/brands/${brandId}`);
      const brandDoc = await getDoc(brandRef);
      
      if (!brandDoc.exists()) {
        console.error("Brand not found:", brandId);
        throw new Error('Brand not found');
      }
      
      const brandData = brandDoc.data();
      console.log("Brand data retrieved:", brandData);
      
      // Check WooCommerce connection
      const hasWooCommerce = !!(brandData.wc_url && brandData.wc_key && brandData.wc_secret);
      
      // Get auth token for external API calls
      const token = await user.getIdToken();
      
      // Check connections with the API
      if (hasWooCommerce) {
        console.log("Checking WooCommerce connection");
        await checkWooCommerceConnection(token);
      }
      
      // Check Shopify connection (assuming similar structure)
      if (brandData.shopify_domain && brandData.shopify_token) {
        console.log("Checking Shopify connection");
        await checkShopifyConnection(token);
      }
      
      // Check Google Analytics connection
      console.log("Checking Google Analytics connection");
      await checkGoogleAnalyticsConnection(token);
      
      // Update integration status with timestamp
      const status = {
        woocommerce: { connected: hasWooCommerce },
        shopify: { connected: !!(brandData.shopify_domain && brandData.shopify_token) },
        // GA status is handled by StoreConnectionContext
        lastChecked: now
      };
      
      console.log("Integration status updated:", status);
      
      // Update state
      setIntegrationStatus(prev => ({
        ...prev,
        [brandId]: status
      }));
      
      // Update global integration status
      updateGlobalIntegrationStatus(status);
      
      return status;
    } catch (error) {
      console.error('Error checking integration status:', error);
      setError(error.message);
      return null;
    }
  };

  // Helper to update global integration status
  const updateGlobalIntegrationStatus = (status) => {
    // Update StoreConnectionContext based on the current brand's status
    if (status.woocommerce?.connected) {
      setConnectedPlatform('woocommerce');
    } else if (status.shopify?.connected) {
      setConnectedPlatform('shopify');
    } else {
      setConnectedPlatform(null);
    }
    
    // GA status is handled directly by the StoreConnectionContext
  };

  // Function to switch active brand
  const switchBrand = async (brandId) => {
    if (!user || !brandId) return;
    
    console.log("Switching to brand:", brandId);
    
    // Verify brand exists in user's brands
    const brandExists = userBrands.some(brand => brand.id === brandId);
    if (!brandExists) {
      console.error("Brand not found in userBrands array:", brandId);
      // Check if this is a newly created brand that might not be in state yet
      try {
        // Try to verify the brand exists in Firestore directly
        const brandRef = doc(db, `users/${user.uid}/brands/${brandId}`);
        const brandDoc = await getDoc(brandRef);
        
        if (brandDoc.exists()) {
          console.log("Brand exists in Firestore but not in state yet. Setting activeBrandId anyway.");
          // Brand exists in Firestore but not in our state yet
          // This is likely due to a race condition during brand creation
          setActiveBrandId(brandId);
          // Also update StoreConnectionContext
          if (setStoreActiveBrandId) {
            setStoreActiveBrandId(brandId);
          }
          localStorage.setItem('activeBrandId', brandId);
          return true;
        } else {
          // Brand truly doesn't exist
          setError('Brand not found');
          return false;
        }
      } catch (error) {
        console.error("Error verifying brand existence:", error);
        setError("Error switching brand: " + error.message);
        return false;
      }
    }
    
    try {
      // Update active brand
      setActiveBrandId(brandId);
      
      // Save to localStorage for persistence
      localStorage.setItem('activeBrandId', brandId);
      console.log("Active brand ID saved to localStorage:", brandId);
      
      // Check integration status for this brand
      await checkIntegrationStatus(brandId);
      
      // Return success
      return true;
    } catch (error) {
      console.error('Error switching brand:', error);
      setError(error.message);
      return false;
    }
  };

  // Function to update brand name
  const updateBrandName = async (brandId, newName) => {
    if (!user || !brandId) return false;
    
    console.log("Updating brand name:", brandId, newName);
    
    try {
      const brandRef = doc(db, `users/${user.uid}/brands/${brandId}`);
      await updateDoc(brandRef, { name: newName });
      console.log("Brand name updated successfully");
      return true;
    } catch (error) {
      console.error('Error updating brand name:', error);
      setError(error.message);
      return false;
    }
  };

  // Function to create a new brand
  const createBrand = async (brandName) => {
    if (!user) return false;
    
    console.log("Creating new brand:", brandName);
    
    try {
      // Create a unique ID for the brand (timestamp + random chars)
      const brandId = `brand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      
      // Create brand document
      const brandRef = doc(db, `users/${user.uid}/brands/${brandId}`);
      await setDoc(brandRef, {
        name: brandName,
        ownerId: user.uid,
        createdAt: new Date(),
        wc_url: '',
        wc_key: '',
        wc_secret: ''
      });
      
      console.log("Brand document created:", brandId);
      
      // Add user as member
      const memberRef = doc(db, `users/${user.uid}/brands/${brandId}/members/${user.uid}`);
      await setDoc(memberRef, {
        role: 'owner',
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        joinedAt: new Date()
      });
      
      console.log("User added as member to brand");
      
      // Save brandId to localStorage - we'll let the Firestore listener handle the state update
      localStorage.setItem('activeBrandId', brandId);
      console.log("Saved new brand ID to localStorage:", brandId);
      
      // Don't immediately switch to the brand - the Firestore listener will update
      // userBrands and then useEffect will set the active brand based on localStorage
      
      return true;
    } catch (error) {
      console.error('Error creating brand:', error);
      setError(error.message);
      return false;
    }
  };

  // Provide the brand context to children components
  return (
    <BrandContext.Provider
      value={{
        userBrands,
        activeBrand,
        activeBrandId,
        integrationStatus,
        loading,
        error,
        switchBrand,
        updateBrandName,
        createBrand,
        checkIntegrationStatus
      }}
    >
      {children}
    </BrandContext.Provider>
  );
};

export default BrandContext;
