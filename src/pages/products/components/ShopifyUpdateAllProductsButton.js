import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function ShopifyUpdateAllProductsButton({
  setRefresh,
  setNotificationMessage,
  disabled,
  onClick,
}) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const updateAllProducts = async () => {
    if (!user) {
      setNotificationMessage('User not authenticated');
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
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/shopifyProducts/update-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
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
      onClick={updateAllProducts}
      disabled={loading || disabled}
      sx={{ minWidth: '150px' }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          {updatedCount > 0 && `${updatedCount}/${totalProducts}`}
        </Box>
      ) : (
        'Update All Products'
      )}
    </Button>
  );
} 