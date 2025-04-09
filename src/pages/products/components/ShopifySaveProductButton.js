import * as React from 'react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useToast } from '../../../components/ToasterAlert';

export default function ShopifySaveProductButton({ 
  user, 
  productId, 
  shopifyAccessToken, 
  shopifyShop, 
  description, 
  product,
  setNotificationMessage
}) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (user && productId) {
      setLoading(true);
      try {
        // First update the local database
        const productDocRef = doc(db, 'users', user.uid, 'products', productId);
        await updateDoc(productDocRef, { 
          improved: true,
          description,
          name: product.name
        });

        // Update Shopify if credentials are present
        if (shopifyAccessToken && shopifyShop) {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/shopifyProducts/save-product`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await user.getIdToken()}`
            },
            body: JSON.stringify({
              productId,
              description,
              name: product.name,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to save to Shopify');
          }

          showToast('Product saved to both Ecommander and Shopify!', 'success');
        } else {
          showToast('Product saved to Ecommander!', 'success');
        }
      } catch (err) {
        console.error('Error saving product:', err);
        showToast('Failed to save product', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Button variant="contained" color="primary" onClick={handleSave} disabled={loading}>
      Save
    </Button>
  );
} 