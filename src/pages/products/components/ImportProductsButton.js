import * as React from 'react';
import { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function ImportProductsButton({ storeUrl, apiId, secretKey }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [message, setMessage] = useState('');

  const importProducts = async () => {
    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    setLoading(true);
    setImportedCount(0);
    setTotalProducts(0);
    setMessage('Starting import...');

    try {
      // Fetch the total number of products first
      const totalResponse = await fetch(`${API_URL}/woocommerce/total`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeUrl, apiId, secretKey }),
      });
      const totalResult = await totalResponse.json();

      if (totalResult.result === 'Success') {
        setTotalProducts(totalResult.totalProducts);
      } else {
        setMessage('Failed to fetch total products.');
        setLoading(false);
        return;
      }

      // Start importing products
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

        const lines = result.split('\n\n');
        for (const line of lines) {
          if (line.trim()) {
            const data = JSON.parse(line.replace('data: ', ''));
            if (data.result === 'Success') {
              setMessage(`Imported ${data.importedCount} products successfully.`);
              setImportedCount(data.importedCount);
              setLoading(false);
              return;
            } else {
              setImportedCount(data.importedCount);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error importing products:', error);
      setMessage('Failed to import products.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button variant="contained" onClick={importProducts} disabled={loading}>
        {loading ? `Importing ${importedCount}/${totalProducts}` : 'Import All Products'}
      </Button>
      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <Typography variant="body2" color="textSecondary">{`Importing ${importedCount}/${totalProducts}`}</Typography>
        </Box>
      )}
      {message && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
