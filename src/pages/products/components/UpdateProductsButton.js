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
  // NEW: pass down from parent
  setNotificationMessage,
}) {
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
          body: JSON.stringify({
            storeUrl,
            apiId,
            secretKey,
            lastImport,
            userId: user.uid,
          }),
        });

        const data = await response.json();
        if (response.status === 200 && data.result === 'Success') {
          setNotificationMessage(
            `New product check successful. ${data.updatedCount} products imported.`
          );
          setRefresh((prev) => !prev);
        } else {
          setNotificationMessage('Failed to update products');
        }
      }
    } catch (err) {
      console.error('Error updating products:', err);
      setNotificationMessage('Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button variant="contained" onClick={updateProducts} disabled={loading}>
        {loading ? 'Updating...' : 'Update Products'}
      </Button>
    </Box>
  );
}
