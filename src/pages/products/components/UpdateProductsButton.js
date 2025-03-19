import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const API_URL = process.env.REACT_APP_API_URL;

export default function UpdateProductsButton({ storeUrl, apiId, secretKey, setRefresh, setNotificationMessage }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);

  const updateProducts = async () => {
    if (!user) {
      setNotificationMessage('User not authenticated');
      return;
    }

    setLoading(true);
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

          // The server may send multiple JSON lines in the stream
          const lines = result.split('\n\n');
          for (const line of lines) {
            if (line.trim()) {
              const data = JSON.parse(line.replace('data: ', ''));
              if (data.result === 'Success') {
                setNotificationMessage(`Update successful. ${data.updatedCount} products updated.`);
                setLoading(false);
                setRefresh((prev) => !prev);
                return;
              } else {
                // If streaming partial updates, you can set a partial message:
                setNotificationMessage(`Updating ${data.updatedCount}...`);
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
      <Button size="small" variant="outlined" onClick={updateProducts} disabled={loading}>
        {loading ? 'Updating...' : 'Import New Products'}
      </Button>
    </Box>
  );
}
