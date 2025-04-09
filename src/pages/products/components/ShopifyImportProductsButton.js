import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function ShopifyImportProductsButton({
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
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/shopifyProducts/products`, {
        method: 'GET',
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
            if (data.result === 'Success') {
              setNotificationMessage(`Imported ${data.importedCount} products successfully.`);
              setImportedCount(data.importedCount);
              setTotalProducts(data.totalProducts);
              setLoading(false);
              setRefresh((prev) => !prev);
              return;
            } else {
              setImportedCount(data.importedCount);
              setTotalProducts(data.totalProducts);
              setNotificationMessage(`Importing ${data.importedCount}/${data.totalProducts}`);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error importing Shopify products:', error);
      setNotificationMessage('Failed to import products.');
      setLoading(false);
    }
  };

  return (
    <Button
      variant="contained"
      color="primary"
      onClick={importProducts}
      disabled={loading || disabled}
      sx={{ minWidth: '150px' }}
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 20, height: 20, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          {importedCount > 0 && `${importedCount}/${totalProducts}`}
        </Box>
      ) : (
        'Import Products'
      )}
    </Button>
  );
} 