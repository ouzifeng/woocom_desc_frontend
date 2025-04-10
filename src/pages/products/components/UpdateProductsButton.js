import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const API_URL = process.env.REACT_APP_API_URL;

export default function UpdateProductsButton({ 
  storeUrl, 
  apiId, 
  secretKey, 
  setRefresh, 
  setNotificationMessage,
  disabled,
  onClick,
}) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const updateProducts = async () => {
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
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastImport = userData.lastImport;

        const response = await fetch(`${API_URL}/woocommerce/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storeUrl, apiId, secretKey, lastImport, userId: user.uid }),
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
              if (data.result === 'Success') {
                setNotificationMessage(`Updated ${data.updatedCount} products successfully.`);
                setUpdatedCount(data.updatedCount);
                setTotalProducts(data.totalProducts);
                setLoading(false);
                setRefresh((prev) => !prev);
                return;
              } else if (data.message) {
                setNotificationMessage(data.message);
                if (data.message.includes('Updating')) {
                  const match = data.message.match(/Updating (\d+) of (\d+)/);
                  if (match) {
                    setUpdatedCount(parseInt(match[1]));
                    setTotalProducts(parseInt(match[2]));
                  }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Error updating products:', err);
      setNotificationMessage('Failed to update products');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button 
        size="small" 
        variant="outlined" 
        onClick={updateProducts} 
        disabled={loading || disabled}
      >
        {loading ? `Updating ${updatedCount}/${totalProducts}` : 'Import New Products'}
      </Button>
    </Box>
  );
}
