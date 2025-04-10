import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function ImportProductsButton({
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
  const [importedCount, setImportedCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const importProducts = async () => {
    if (!user) {
      setNotificationMessage('User not authenticated');
      return;
    }

    if (disabled) {
      if (onClick) onClick();
      return;
    }

    setLoading(true);
    setImportedCount(0);
    setTotalProducts(0);
    setNotificationMessage('Starting import...');

    try {
      // 1) Fetch total product count
      const totalResponse = await fetch(`${API_URL}/woocommerce/total`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeUrl, apiId, secretKey }),
      });
      const totalResult = await totalResponse.json();

      if (totalResult.result === 'Success') {
        setTotalProducts(parseInt(totalResult.totalProducts, 10));
      } else {
        setNotificationMessage('Failed to fetch total products.');
        setLoading(false);
        return;
      }

      // 2) Start importing
      const response = await fetch(`${API_URL}/woocommerce/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeUrl, apiId, secretKey, userId: user.uid }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });

        // The server may send multiple JSON lines in the stream
        const lines = result.split('\n\n');
        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.result === 'Success') {
              setNotificationMessage(`Imported ${data.importedCount} products successfully.`);
              setImportedCount(data.importedCount);
              setLoading(false);
              setRefresh((prev) => !prev);
              return;
            } else if (data.message) {
              // Handle progress messages
              setNotificationMessage(data.message);
              if (data.message.includes('Importing')) {
                const match = data.message.match(/Importing (\d+) of (\d+)/);
                if (match) {
                  setImportedCount(parseInt(match[1]));
                  setTotalProducts(parseInt(match[2]));
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error importing products:', error);
      setNotificationMessage('Failed to import products.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button 
        size="small" 
        variant="contained" 
        onClick={importProducts} 
        disabled={loading || disabled}
      >
        {loading
          ? `Importing ${importedCount}/${totalProducts}`
          : 'Import All Products'}
      </Button>
    </Box>
  );
}
