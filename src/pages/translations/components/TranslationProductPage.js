import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';

// Lazy load components
const ProductDetails = React.lazy(() => import('../../products/components/ProductDetails'));
const ProductEditor = React.lazy(() => import('../../products/components/ProductEditor'));

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

export default function TranslationProductPage() {
  const { productId } = useParams();
  const location = useLocation();
  const languageCode = location.pathname.split('_')[1]; // Extract language code from URL
  const [user] = useAuthState(auth);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (user && productId) {
        try {
          const productDocRef = doc(db, 'users', user.uid, 'products', productId);
          const productDoc = await getDoc(productDocRef);
          if (productDoc.exists()) {
            const productData = productDoc.data();
            setProduct({
              ...productData,
              name: productData[`${languageCode}_name`] || productData.name,
              description: productData[`${languageCode}_description`] || productData.description,
              originalName: productData.name,
              originalDescription: productData.description
            });
            setDescription(productData[`${languageCode}_description`] || productData.description);
          } else {
            setError('Product not found');
          }
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Error fetching product');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProduct();
  }, [user, productId, languageCode]);

  const handleSave = async () => {
    if (!user || !productId) return;

    try {
      const productDocRef = doc(db, 'users', user.uid, 'products', productId);
      await updateDoc(productDocRef, {
        [`${languageCode}_name`]: product.name,
        [`${languageCode}_description`]: description,
        translated: true
      });
      setNotificationMessage('Translation saved successfully!');
    } catch (err) {
      console.error('Error saving translation:', err);
      setNotificationMessage('Error saving translation');
    }
  };

  if (loading) return <LoadingFallback />;
  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="body2" color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Translating: {product.originalName}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
            >
              Save Translation
            </Button>
          </Box>
          {notificationMessage && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {notificationMessage}
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2 }}>Original Content</Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1">Name:</Typography>
            <Typography>{product.originalName}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1">Description:</Typography>
            <Typography
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                minHeight: '200px'
              }}
            >
              {product.originalDescription}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2 }}>Translated Content</Typography>
          <React.Suspense fallback={<LoadingFallback />}>
            <ProductDetails 
              product={product} 
              setProduct={setProduct}
              isTranslation={true}
            />
          </React.Suspense>
          <React.Suspense fallback={<LoadingFallback />}>
            <ProductEditor 
              description={description} 
              setDescription={setDescription}
              isTranslation={true}
            />
          </React.Suspense>
        </Grid>
      </Grid>
    </Box>
  );
} 