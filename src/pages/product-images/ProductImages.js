import React, { useState, useEffect } from 'react';
import AppNavbar from '../dashboard/components/AppNavbar';
import SideMenu from '../dashboard/components/SideMenu';
import Header from '../dashboard/components/Header';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import CssBaseline from '@mui/material/CssBaseline';
import AppTheme from '../shared-theme/AppTheme';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useBrand } from '../../contexts/BrandContext';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useToast } from '../../components/ToasterAlert';

// Import our new components
import ImageProcessingPanel from './components/ImageProcessingPanel';
import ProductsTable from './components/ProductsTable';
import InstructionsDrawer from './components/InstructionsDrawer';

export default function ProductImages() {
  // Auth and brand context
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const { showToast } = useToast();
  
  // State variables
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [removing, setRemoving] = useState(false);
  const [removedUrl, setRemovedUrl] = useState(null);
  const [removeError, setRemoveError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [useOriginalImage, setUseOriginalImage] = useState(true);
  const [refreshTable, setRefreshTable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Track modified products for CSV export
  const [modifiedProducts, setModifiedProducts] = useState([]);
  const [exportType, setExportType] = useState('woocommerce'); // 'woocommerce' or 'shopify'
  
  // Drawer toggle function
  const toggleDrawer = (open) => (event) => {
    if (event && event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
  
  // Helper function to format CSV content
  const formatCSV = (products) => {
    if (!products || !products.length) return '';
    
    // Common headers for both platforms
    const headers = ['ID', 'Image URL', 'Product Name'];
    const rows = products.map(product => {
      return [
        product.id,
        product.processedImage,
        product.name || ''
      ];
    });
    
    // Convert to CSV
    const headerRow = headers.join(',');
    const dataRows = rows.map(row => row.join(',')).join('\n');
    
    return `${headerRow}\n${dataRows}`;
  };
  
  // Generate and download CSV file
  const downloadCSV = () => {
    if (!modifiedProducts.length) {
      showToast('No modified products to export', 'warning');
      return;
    }
    
    const csvContent = formatCSV(modifiedProducts);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `processed-images-${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast(`CSV with ${modifiedProducts.length} products exported successfully`, 'success');
  };
  
  // Clear the modified products list
  const clearModifiedList = () => {
    const count = modifiedProducts.length;
    setModifiedProducts([]);
    
    if (user && activeBrandId) {
      const modifiedKey = `modified-products-${user.uid}-${activeBrandId}`;
      localStorage.removeItem(modifiedKey);
      
      if (count > 0) {
        showToast(`Cleared ${count} products from the export list`, 'info');
      }
    }
  };
  
  // Load cached product and image from localStorage on initial render
  useEffect(() => {
    if (!user || !activeBrandId) return;
    
    const cacheKey = `product-images-cache-${user.uid}-${activeBrandId}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const { product, processedImageUrl } = JSON.parse(cachedData);
        
        if (product) {
          console.log('Restored cached product:', product.id);
          setSelectedProduct(product);
          
          if (processedImageUrl) {
            console.log('Restored cached processed image');
            setRemovedUrl(processedImageUrl);
          }
        }
      } catch (err) {
        console.error('Error parsing cached product data:', err);
      }
    }
    
    // Load previously modified products from localStorage
    const modifiedKey = `modified-products-${user.uid}-${activeBrandId}`;
    const modifiedData = localStorage.getItem(modifiedKey);
    
    if (modifiedData) {
      try {
        const modified = JSON.parse(modifiedData);
        setModifiedProducts(modified);
        console.log('Loaded modified products list:', modified.length);
      } catch (err) {
        console.error('Error parsing modified products data:', err);
      }
    }
  }, [user, activeBrandId]);
  
  // Save product and processed image to localStorage when they change
  useEffect(() => {
    if (!user || !activeBrandId) return;
    if (!selectedProduct) return;
    
    const cacheKey = `product-images-cache-${user.uid}-${activeBrandId}`;
    const dataToCache = {
      product: selectedProduct,
      processedImageUrl: removedUrl
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    console.log('Cached product and image data');
  }, [user, activeBrandId, selectedProduct, removedUrl]);
  
  // Save modified products list to localStorage when it changes
  useEffect(() => {
    if (!user || !activeBrandId || !modifiedProducts.length) return;
    
    const modifiedKey = `modified-products-${user.uid}-${activeBrandId}`;
    localStorage.setItem(modifiedKey, JSON.stringify(modifiedProducts));
    console.log('Saved modified products list:', modifiedProducts.length);
  }, [user, activeBrandId, modifiedProducts]);

  // Fetch product details
  const fetchProductDetails = async (productId) => {
    if (!user || !activeBrandId) return;
    
    // Ensure the product ID is a string
    const productIdString = String(productId || '');
    console.log("Fetching product details for ID:", productIdString);
    
    // Check if we're already loading this product from Firestore (prevents duplicate fetches)
    if (selectedProduct?.id === productIdString && selectedProduct.loadingFromFirestore) {
      console.log("Already loading product from Firestore, skipping duplicate fetch");
      return;
    }
    
    try {
      const token = await user.getIdToken();
      
      // First try fetching from API
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/product/${productIdString}?brandId=${activeBrandId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const product = await response.json();
        
        setSelectedProduct(product);
        setRemovedUrl(null);
        setRemoveError(null);
        setUploadedImage(null);
        setUseOriginalImage(true);
        
        // Load the processed image if available
        if (product.processedImage) {
          console.log('Found processed image in API response:', product.processedImage);
          setRemovedUrl(product.processedImage);
        }
        
        return;
      } catch (apiError) {
        console.warn('Failed to fetch from API, trying Firestore:', apiError);
        
        // Let UI know we're loading from Firestore to prevent duplicate calls
        setSelectedProduct(prev => ({
          ...(prev || {}),
          id: productIdString,
          loadingFromFirestore: true
        }));
        
        // If API fails, try fetching directly from Firestore as fallback
        // Ensure all IDs are strings
        const userId = String(user.uid || '');
        const brandId = String(activeBrandId || '');
        
        const productRef = doc(db, 'users', userId, 'brands', brandId, 'products', productIdString);
        const productSnap = await getDoc(productRef);
        
        if (productSnap.exists()) {
          const productData = productSnap.data();
          setSelectedProduct({
            id: productId,
            ...productData,
            loadingFromFirestore: false // Clear the loading flag
          });
          
          // Load the processed image if available
          if (productData.processedImage) {
            console.log('Found processed image in Firestore:', productData.processedImage);
            setRemovedUrl(productData.processedImage);
          } else {
            setRemovedUrl(null);
          }
          
          setRemoveError(null);
          setUploadedImage(null);
          setUseOriginalImage(true);
          return;
        } else {
          // If product not found in Firestore either, clear the loading flag
          setSelectedProduct(prev => prev?.id === productIdString ? null : prev);
          throw new Error(`Product not found in database. ID: ${productIdString}`);
        }
      }
    } catch (err) {
      console.error('Error fetching product details:', err);
      setRemoveError(`Could not load product: ${err.message}`);
      // Don't clear the selected product if it's just a refresh error
      if (!selectedProduct || selectedProduct.id !== productId) {
        setSelectedProduct(null);
      } else {
        // Clear the loading flag if we still have the selected product
        setSelectedProduct(prev => ({
          ...(prev || {}),
          loadingFromFirestore: false
        }));
      }
    }
  };

  // Handle remove background
  const handleRemoveBackground = async () => {
    const imageUrl = useOriginalImage ? selectedProduct?.image : uploadedImage;
    if (!imageUrl) return;
    
    setRemoving(true);
    setRemoveError(null);
    setRemovedUrl(null);
    
    try {
      const idToken = await user.getIdToken();
      
      // Extract original filename if we have it
      const originalFilename = selectedProduct?.image ? 
        selectedProduct.image.substring(selectedProduct.image.lastIndexOf('/') + 1) : 
        null;
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/runware/remove-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          imageUrl, 
          brandId: activeBrandId,
          originalFilename: originalFilename // Pass original filename to API
        })
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to remove background');
      }
      setRemovedUrl(data.url);
    } catch (err) {
      setRemoveError(err.message);
    } finally {
      setRemoving(false);
    }
  };

  // Handle upload image
  const handleUploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setRemoveError(null); // Clear previous errors
    
    try {
      const storage = getStorage();
      // Use the public folder so images are accessible to the API
      const storageRef = ref(storage, `public/product-uploads/${activeBrandId}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Show upload progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }
      );

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          reject,
          () => resolve()
        );
      });

      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      setUploadedImage(downloadURL);
      setUseOriginalImage(false);
    } catch (err) {
      console.error('Error uploading image:', err);
      
      // More specific error messages based on Firebase error codes
      let errorMessage = 'Failed to upload image: ';
      
      if (err.code === 'storage/unauthorized') {
        errorMessage += 'You don\'t have permission to upload to this location. Please check your Firebase Storage rules.';
      } else if (err.code === 'storage/canceled') {
        errorMessage += 'Upload was canceled.';
      } else if (err.code === 'storage/unknown') {
        errorMessage += 'Unknown error occurred during upload.';
      } else {
        errorMessage += err.message;
      }
      
      setRemoveError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Clear cache when changing products to prevent stale data
  const clearProductImageCache = (productId) => {
    if (!user || !activeBrandId) return;
    
    const cacheKey = `product-images-cache-${user.uid}-${activeBrandId}`;
    
    try {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        const parsedData = JSON.parse(cachedData);
        // If the cached product is the one we're clearing, remove it
        if (parsedData.product && parsedData.product.id === productId) {
          console.log('Clearing image cache for product:', productId);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (err) {
      console.error('Error clearing cached product data:', err);
    }
  };
  
  // Handle product selection from table
  const handleProductSelect = (product) => {
    // If we're changing products, clear cache for the previous product
    if (selectedProduct && selectedProduct.id !== product?.id) {
      clearProductImageCache(selectedProduct.id);
    }
    
    // Clear state first
    setRemovedUrl(null);
    setRemoveError(null);
    setUploadedImage(null);
    setUseOriginalImage(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    // Then set the selected product
    setSelectedProduct(product);
    
    // Check if we have a cached processed image for this product
    if (user && activeBrandId && product) {
      const cacheKey = `product-images-cache-${user.uid}-${activeBrandId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { product: cachedProduct, processedImageUrl } = JSON.parse(cachedData);
          if (cachedProduct && cachedProduct.id === product.id && processedImageUrl) {
            console.log('Loading cached processed image for product');
            setRemovedUrl(processedImageUrl);
          }
        } catch (err) {
          console.error('Error parsing cached product data:', err);
        }
      }
    }
  };

  // Update product after save
  const updateProductAfterSave = async (productId, processedImageUrl, backgroundColor) => {
    try {
      // Update the selected product in the state
      setSelectedProduct(prevProduct => {
        if (prevProduct && prevProduct.id === productId) {
          const updatedProduct = {
            ...prevProduct,
            processedImage: processedImageUrl,
            image: processedImageUrl, // Update main image as well
            backgroundColor: backgroundColor,
            imageModified: true // Flag that this product has a modified image
          };
          console.log('Updated product state after save:', updatedProduct);
          return updatedProduct;
        }
        return prevProduct;
      });
      
      // Also re-verify from Firestore to ensure data consistency
      await verifyImageSaved(productId);
    } catch (err) {
      console.error('Error updating product after save:', err);
    }
  };
  
  // Add product to modified list for CSV export
  const addToModifiedList = (product, processedImageUrl) => {
    if (!product || !processedImageUrl) return;
    
    setModifiedProducts(prev => {
      // Check if already in the list
      const exists = prev.some(p => p.id === product.id);
      
      if (exists) {
        // Update the existing entry
        return prev.map(p => 
          p.id === product.id 
            ? { 
                ...p, 
                processedImage: processedImageUrl, 
                originalImage: product.originalImage || product.image,
                name: product.name,
                modified: new Date().toISOString()
              } 
            : p
        );
      } else {
        // Add new entry
        return [...prev, {
          id: product.id,
          name: product.name,
          processedImage: processedImageUrl,
          originalImage: product.originalImage || product.image,
          modified: new Date().toISOString()
        }];
      }
    });
  };
  
  // Save the processed image
  const handleSaveChanges = async (backgroundEnabled, backgroundTab, backgroundColor) => {
    if (!selectedProduct?.id || !removedUrl) return;
    
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    // Clear any existing cache to ensure we save fresh data
    clearProductImageCache(selectedProduct.id);
    
    // Capture original image before we change it
    const originalImage = selectedProduct.originalImage || selectedProduct.image;
    
    try {
      // First check if user has enough credits
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || userDoc.data().credits < 1) {
        showToast('You need at least 1 credit to save a processed image', 'error');
        setSaving(false);
        return;
      }

      // Deduct one credit
      await updateDoc(userDocRef, {
        credits: userDoc.data().credits - 1
      });
      
      // Ensure all IDs are strings
      const userId = String(user?.uid || '');
      const brandId = String(activeBrandId || '');
      const productId = String(selectedProduct.id || '');
      
      if (!userId || !brandId || !productId) {
        throw new Error('Missing required ID: ' + 
          (!userId ? 'user ' : '') + 
          (!brandId ? 'brand ' : '') + 
          (!productId ? 'product' : '')
        );
      }
      
      console.log('Saving to Firestore with params:', {
        userId,
        brandId,
        productId,
        processedImage: removedUrl ? 'present' : 'missing',
        backgroundColor: backgroundEnabled && backgroundTab === 'color' ? backgroundColor : null
      });
      
      const productRef = doc(db, 'users', userId, 'brands', brandId, 'products', productId);
      
      // First verify the product exists
      const productDoc = await getDoc(productRef);
      if (!productDoc.exists()) {
        // Refund the credit if product doesn't exist
        await updateDoc(userDocRef, {
          credits: userDoc.data().credits + 1
        });
        throw new Error(`Product with ID ${productId} not found in Firestore`);
      }
      
      // Update the document with processed image
      await updateDoc(productRef, {
        processedImage: removedUrl,
        image: removedUrl, // Also update the main image field
        originalImage: originalImage, // Store the original image URL
        backgroundColor: backgroundEnabled && backgroundTab === 'color' ? backgroundColor : null,
        imageModified: true, // Flag that this image has been modified
        lastUpdated: new Date().toISOString()
      });
      
      // Verify the update worked by reading the document back
      const updatedDoc = await getDoc(productRef);
      const updatedData = updatedDoc.data();
      
      if (updatedData.processedImage !== removedUrl || updatedData.image !== removedUrl) {
        // Refund the credit if update verification fails
        await updateDoc(userDocRef, {
          credits: userDoc.data().credits + 1
        });
        console.error('Document update verification failed - image not updated correctly');
        console.error('Expected:', removedUrl);
        console.error('Got processedImage:', updatedData.processedImage);
        console.error('Got image:', updatedData.image);
        throw new Error('Document failed to update properly in database');
      }
      
      console.log('Successfully saved to Ecommander database:', updatedData);
      
      // Update the product in state
      const bgColor = backgroundEnabled && backgroundTab === 'color' ? backgroundColor : null;
      await updateProductAfterSave(productId, removedUrl, bgColor);
      
      // Add to modified products list for CSV export
      addToModifiedList(
        { 
          ...selectedProduct, 
          originalImage: originalImage 
        }, 
        removedUrl
      );
      
      // Update UI
      setRefreshTable(prev => !prev);
      showToast('Image saved successfully!', 'success');
      
      // Re-fetch the product details to ensure UI is up-to-date
      setTimeout(() => {
        fetchProductDetails(productId);
      }, 1000);
    } catch (err) {
      console.error('Error saving to Ecommander:', err);
      setSaveError(`Failed to save: ${err.message || 'Unknown error'}`);
      showToast(`Failed to save: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Debug function to check if an image was properly saved
  const verifyImageSaved = async (productId) => {
    if (!user || !activeBrandId) return;
    
    try {
      const userId = String(user.uid);
      const brandId = String(activeBrandId);
      const productIdString = String(productId);
      
      console.log('Verifying saved image for product:', productIdString);
      
      const productRef = doc(db, 'users', userId, 'brands', brandId, 'products', productIdString);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const data = productSnap.data();
        console.log('Product data from Firestore:', {
          id: productIdString,
          hasProcessedImage: !!data.processedImage,
          processedImageUrl: data.processedImage,
          originalImage: data.originalImage,
          hasBackgroundColor: !!data.backgroundColor,
          backgroundColor: data.backgroundColor,
          imageModified: !!data.imageModified,
          lastUpdated: data.lastUpdated
        });
        return data;
      } else {
        console.error('Product not found in Firestore');
        return null;
      }
    } catch (err) {
      console.error('Error verifying saved image:', err);
      return null;
    }
  };
  
  // Check the saved image when a product is selected
  useEffect(() => {
    if (selectedProduct?.id) {
      verifyImageSaved(selectedProduct.id);
    }
  }, [selectedProduct]);
  
  // Force display of the processed image if available
  useEffect(() => {
    if (selectedProduct?.processedImage && !removedUrl) {
      console.log('Using existing processed image from product data:', selectedProduct.processedImage);
      setRemovedUrl(selectedProduct.processedImage);
    }
  }, [selectedProduct]);

  // Render CSV export controls 
  const renderExportControls = () => {
    if (!modifiedProducts.length) return null;
    
    return (
      <Box mb={3} p={2} bgcolor="info.light" borderRadius={1}>
        <Typography variant="body1" mb={1}>
          {modifiedProducts.length} product{modifiedProducts.length !== 1 ? 's' : ''} with modified images ready for export.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => downloadCSV()}
          >
            Download CSV
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={clearModifiedList}
          >
            Clear List
          </Button>
        </Box>
      </Box>
    );
  };

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : theme.palette.background.default,
            overflow: 'auto',
            padding: 3,
          })}
        >
          <Stack
            spacing={4}
            sx={{
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                  Product Images
                </Typography>
                
                <Button size="small" variant="outlined" onClick={toggleDrawer(true)}>
                  Instructions
                </Button>
              </Box>

              {/* Image Processing Panel */}
              <Box mb={4}>
                <ImageProcessingPanel 
                  user={user}
                  activeBrandId={activeBrandId}
                  selectedProduct={selectedProduct}
                  removedUrl={removedUrl}
                  setRemovedUrl={setRemovedUrl}
                  removeError={removeError}
                  setRemoveError={setRemoveError}
                  uploading={uploading}
                  uploadedImage={uploadedImage}
                  setUploadedImage={setUploadedImage}
                  useOriginalImage={useOriginalImage}
                  setUseOriginalImage={setUseOriginalImage}
                  saving={saving}
                  saveSuccess={saveSuccess}
                  saveError={saveError}
                  handleRemoveBackground={handleRemoveBackground}
                  handleUploadImage={handleUploadImage}
                  handleSaveChanges={handleSaveChanges}
                  removing={removing}
                />
              </Box>
              
              {/* CSV Export Controls */}
              <Box mb={4}>
                {renderExportControls()}
              </Box>
              
              {/* Products Table */}
              <Box>
                <ProductsTable onSelect={handleProductSelect} />
              </Box>
            </Box>
          </Stack>
        </Box>
      </Box>
      
      {/* Instructions Drawer */}
      <InstructionsDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
    </AppTheme>
  );
} 