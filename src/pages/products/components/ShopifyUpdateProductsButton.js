import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useBrand } from '../../../contexts/BrandContext';

const API_URL = process.env.REACT_APP_API_URL;

export default function ShopifyUpdateProductsButton({
  setRefresh,
  setNotificationMessage,
  disabled,
  onClick,
}) {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [loading, setLoading] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const updateProducts = async () => {
    if (!user) {
      setNotificationMessage('User not authenticated');
      return;
    }

    if (!activeBrandId) {
      setNotificationMessage('No brand selected');
      return;
    }

    if (disabled) {
      if (onClick) onClick();
      return;
    }

    setLoading(true);
    setUpdatedCount(0);
    setTotalProducts(0);
    setNotificationMessage('Starting update...');

    try {
      // Get lastImport timestamp from Firestore brand document
      const brandDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId);
      const brandDoc = await getDoc(brandDocRef);
      if (!brandDoc.exists()) {
        throw new Error('Brand not found');
      }
      const brandData = brandDoc.data();
      const lastImport = brandData.lastImport;

      if (!lastImport) {
        setNotificationMessage('No previous import found. Please use Import All Products first.');
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/shopifyProducts/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          lastImport,
          brandId: activeBrandId
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });

        const lines = result.split('\n\n');
        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line.replace('data: ', ''));
            
            // Update total products if available
            if (data.totalProducts) {
              setTotalProducts(data.totalProducts);
            }

            // Update updated count if available
            if (data.updatedCount) {
              setUpdatedCount(data.updatedCount);
            }

            // Show the message
            setNotificationMessage(data.message);

            // Handle completion
            if (data.result === 'Success') {
              setLoading(false);
              setRefresh((prev) => !prev);
              return;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating Shopify products:', error);
      setNotificationMessage('Failed to update products.');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={updateProducts}
      disabled={loading || disabled || !activeBrandId}
      sx={{ minWidth: '150px' }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          {updatedCount > 0 && `${updatedCount}/${totalProducts}`}
        </Box>
      ) : (
        'Import New Products'
      )}
    </Button>
  );
} 