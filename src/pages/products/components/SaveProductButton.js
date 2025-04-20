import * as React from 'react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useToast } from '../../../components/ToasterAlert';

export default function SaveProductButton({ 
  user, 
  productId, 
  storeUrl, 
  apiId, 
  secretKey, 
  description, 
  product,
  setNotificationMessage,
  activeBrandId
}) {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSave = async () => {
    if (!user || !productId) {
      showToast('Missing user or product ID', 'error');
      return;
    }

    if (!activeBrandId) {
      showToast('No brand selected', 'error');
      return;
    }

    setLoading(true);
    try {
      // Update the product in the brand's products collection
      const productDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'products', productId);
      await updateDoc(productDocRef, { 
        improved: true,
        description,
        name: product.name
      });

      // Only try to update WooCommerce if credentials are present
      if (storeUrl && apiId && secretKey) {
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
            brandId: activeBrandId
          }),
        });

        if (response.status === 200) {
          showToast('Product saved to both Ecommander and WooCommerce!', 'success');
          if (setNotificationMessage) {
            setNotificationMessage('Product saved to both Ecommander and WooCommerce!');
          }
        } else {
          showToast('Product saved to Ecommander but failed to update WooCommerce', 'warning');
          if (setNotificationMessage) {
            setNotificationMessage('Product saved to Ecommander but failed to update WooCommerce');
          }
        }
      } else {
        showToast('Product saved to Ecommander!', 'success');
        if (setNotificationMessage) {
          setNotificationMessage('Product saved to Ecommander!');
        }
      }
    } catch (err) {
      console.error('Error saving product:', err);
      showToast('Failed to save product', 'error');
      if (setNotificationMessage) {
        setNotificationMessage('Error: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleSave} 
      disabled={loading || !activeBrandId}
    >
      {loading ? 'Saving...' : 'Save'}
    </Button>
  );
} 