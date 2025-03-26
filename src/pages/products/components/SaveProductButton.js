import * as React from 'react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';



export default function SaveProductButton({ 
  user, 
  productId, 
  storeUrl, 
  apiId, 
  secretKey, 
  description, 
  product,
  setNotificationMessage 
}) {
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (user && productId) {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/woocommerce/update-product`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeUrl,
            apiId,
            secretKey,
            userId: user.uid,
            productId,
            description,
            name: product.name,
          }),
        });

        if (response.status === 200) {
          // Mark the product as improved
          const productDocRef = doc(db, 'users', user.uid, 'products', productId);
          await updateDoc(productDocRef, { improved: true });
          setNotificationMessage('Product saved!');
        } else {
          setNotificationMessage('Failed to update product description on WooCommerce');
        }
      } catch (err) {
        console.error('Error saving product description:', err);
        setNotificationMessage('Failed to update product description');
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