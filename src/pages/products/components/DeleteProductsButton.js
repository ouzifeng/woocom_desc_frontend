import * as React from 'react';
import { useState } from 'react';
import { Button, Box, Tooltip } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useBrand } from '../../../contexts/BrandContext';

export default function DeleteProductsButton({
  setRefresh,
  selectedRows,
  // NEW: pass down from parent
  setNotificationMessage,
}) {
  const [user] = useAuthState(auth);
  const { activeBrandId, activeBrand } = useBrand();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!activeBrandId) {
      setNotificationMessage('Please select a brand to delete products');
      return;
    }
    
    if (selectedRows.length === 0) {
      setNotificationMessage('No products selected for deletion');
      return;
    }

    // Ask for confirmation
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedRows.length} products from the "${activeBrand?.name}" brand?`);
    if (!confirmDelete) {
      return;
    }

    setLoading(true);
    setNotificationMessage(`Deleting ${selectedRows.length} products from ${activeBrand?.name}...`);

    try {
      for (const productId of selectedRows) {
        // Update path to include the brand ID
        const productDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'products', productId);
        await deleteDoc(productDocRef);
      }
      setNotificationMessage(`Deleted ${selectedRows.length} products successfully from ${activeBrand?.name}`);
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error('Error deleting products:', err);
      setNotificationMessage('Failed to delete products: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Tooltip title={!activeBrandId ? "Select a brand first" : (selectedRows.length === 0 ? "Select products to delete" : "")}>
        <span>
          <Button 
            size="small" 
            variant="outlined" 
            color="error" 
            onClick={handleDelete} 
            disabled={loading || !activeBrandId || selectedRows.length === 0}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </span>
      </Tooltip>
    </Box>
  );
}
