import React, { useEffect, useState } from 'react';
import AppNavbar from '../dashboard/components/AppNavbar';
import SideMenu from '../dashboard/components/SideMenu';
import Header from '../dashboard/components/Header';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../shared-theme/AppTheme';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { useBrand } from '../../contexts/BrandContext';
import MaskEditor from './components/MaskEditor';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';

export default function ProductImages() {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [finalImage, setFinalImage] = useState(null);

  useEffect(() => {
    const fetchFirstProduct = async () => {
      if (!user || !activeBrandId) {
        setLoading(false);
        setError('No user or brand selected');
        return;
      }
      setLoading(true);
      try {
        const productsRef = collection(db, 'users', user.uid, 'brands', activeBrandId, 'products');
        const q = query(productsRef, limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setProduct({ id: snap.docs[0].id, ...snap.docs[0].data() });
        } else {
          setProduct(null);
        }
      } catch (e) {
        setError('Failed to fetch product: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFirstProduct();
  }, [user, activeBrandId]);

  const handleEditorResult = (imageUrl) => {
    console.log('Received result image URL in ProductImages:', imageUrl ? imageUrl.substring(0, 50) + '...' : null);
    setFinalImage(imageUrl);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Alert severity="info">No products found. Please add a product with an image first.</Alert>
      </Box>
    );
  }

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Header />
          
          <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, background: 'linear-gradient(to right, #f5f7fa, #eef2f7)' }}>
            <Typography variant="h4" sx={{ fontWeight: 'medium', mb: 1 }}>
              Background Removal Tool
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Remove or modify backgrounds from your product images with our AI-powered editing tool.
            </Typography>
          </Paper>

          <Grid container spacing={3}>
            {/* Product Info */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, height: '100%', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Current Product
                </Typography>
                <Typography fontWeight="bold" sx={{ mb: 2 }}>
                  {product.name || product.id}
                </Typography>
                
                {product.image ? (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Original Image
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        p: 1,
                        border: '1px solid #eee',
                        borderRadius: 1,
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 300,
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="warning">This product has no image</Alert>
                )}
                
                {finalImage && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Background Removed
                    </Typography>
                    <Box 
                      sx={{ 
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                        p: 1,
                        border: '1px solid #eee',
                        borderRadius: 1,
                        backgroundColor: '#f0f9ff',
                      }}
                    >
                      <img
                        key={`final-image-${Date.now()}`}
                        src={finalImage}
                        alt="Background removed"
                        onLoad={() => console.log('Final image loaded successfully')}
                        onError={(e) => console.error('Error loading final image:', e)}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: 300,
                          objectFit: 'contain'
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Paper>
            </Grid>
            
            {/* Editor */}
            <Grid item xs={12} md={8}>
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Background Removal Tool
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Our AI-powered tool automatically removes the background from your product image.
                  Simply click the button below to process your image.
                </Typography>
                
                {product.image ? (
                  <MaskEditor
                    imageUrl={product.image}
                    apiUrl={process.env.REACT_APP_API_URL}
                    onResult={handleEditorResult}
                  />
                ) : (
                  <Alert severity="warning">No image available to edit</Alert>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AppTheme>
  );
}
