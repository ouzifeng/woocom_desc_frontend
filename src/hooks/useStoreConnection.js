import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function useStoreConnection(user) {
  const [connectionType, setConnectionType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (!user) {
        setConnectionType(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check for WooCommerce connection
          if (userData.wc_url && userData.wc_key && userData.wc_secret) {
            setConnectionType('woocommerce');
          }
          // Check for Shopify connection
          else if (userData.shopify_access_token && userData.shopify_shop) {
            setConnectionType('shopify');
          }
          else {
            setConnectionType(null);
          }
        }
      } catch (error) {
        console.error('Error checking store connection:', error);
        setConnectionType(null);
      } finally {
        setLoading(false);
      }
    };

    checkConnection();
  }, [user]);

  return { connectionType, loading };
} 
 
 