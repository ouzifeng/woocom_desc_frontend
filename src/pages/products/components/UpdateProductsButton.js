import * as React from 'react';
import { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const API_URL = process.env.REACT_APP_API_URL;

export default function UpdateProductsButton({ storeUrl, apiId, secretKey, setRefresh }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const updateProducts = async () => {
    console.log('updateProducts function called');
    if (!user) {
      setMessage('User not authenticated');
      return;
    }

    console.log('Starting update...');
    setLoading(true);
    setMessage('Starting update...');

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastImport = userData.lastImport;

        console.log('Sending request to backend:', { storeUrl, apiId, secretKey, lastImport, userId: user.uid });

        const response = await fetch(`${API_URL}/woocommerce/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ storeUrl, apiId, secretKey, lastImport, userId: user.uid }),
        });

        const data = await response.json();
        console.log('Received response:', data);

        if (response.status === 200 && data.result === 'Success') {
          setMessage(`New product check successful. ${data.updatedCount} products imported.`);
          setRefresh((prev) => !prev); // Trigger refresh
        } else {
          setMessage('Failed to update products');
        }
      }
    } catch (err) {
      console.error('Error updating products:', err);
      setMessage('Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button variant="contained" onClick={() => { console.log('Button clicked'); updateProducts(); }} disabled={loading}>
        {loading ? 'Updating...' : 'Update Products'}
      </Button>
      {message && (
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
