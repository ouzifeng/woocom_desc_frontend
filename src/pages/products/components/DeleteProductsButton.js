import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function DeleteProductsButton({
  setRefresh,
  selectedRows,
  // NEW: pass down from parent
  setNotificationMessage,
}) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      setNotificationMessage('No products selected for deletion');
      return;
    }

    setLoading(true);
    setNotificationMessage('Deleting selected products...');

    try {
      for (const productId of selectedRows) {
        const productDocRef = doc(db, 'users', user.uid, 'products', productId);
        await deleteDoc(productDocRef);
      }
      setNotificationMessage(`Deleted ${selectedRows.length} products successfully`);
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error('Error deleting products:', err);
      setNotificationMessage('Failed to delete products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button size="small" variant="outlined" color="error" onClick={handleDelete} disabled={loading}>
        {loading ? 'Deleting...' : 'Delete'}
      </Button>
    </Box>
  );
}
