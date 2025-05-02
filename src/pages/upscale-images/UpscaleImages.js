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

// Import our components
import ImageUpscalePanel from './components/ImageUpscalePanel';
import ProductsTable from '../product-images/components/ProductsTable';
import InstructionsDrawer from './components/InstructionsDrawer';

export default function UpscaleImages() {
  // Auth and brand context
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const { showToast } = useToast();
  
  // State variables
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [upscaling, setUpscaling] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState(null);
  const [upscaleError, setUpscaleError] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [useOriginalImage, setUseOriginalImage] = useState(true);
  const [refreshTable, setRefreshTable] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Upscale settings
  const [upscaleFactor, setUpscaleFactor] = useState(2);
  const [outputFormat, setOutputFormat] = useState('WEBP');
  
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
    const headers = ['ID', 'Image URL', 'Product Name', 'Original Dimensions', 'Upscaled Dimensions'];
    const rows = products.map(product => {
      return [
        product.id,
        product.upscaledImage,
        product.name || '',
        product.originalDimensions || '',
        product.upscaledDimensions || ''
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
    link.setAttribute('download', `upscaled-images-${timestamp}.csv`);
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
      const modifiedKey = `upscaled-products-${user.uid}-${activeBrandId}`;
      localStorage.removeItem(modifiedKey);
      
      if (count > 0) {
        showToast(`Cleared ${count} products from the export list`, 'info');
      }
    }
  };
  
  // Load cached product and image from localStorage on initial render
  useEffect(() => {
    if (!user || !activeBrandId) return;
    
    const cacheKey = `upscale-images-cache-${user.uid}-${activeBrandId}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const { product, upscaledImageUrl } = JSON.parse(cachedData);
        
        if (product) {
          console.log('Restored cached product:', product.id);
          setSelectedProduct(product);
          
          if (upscaledImageUrl) {
            console.log('Restored cached upscaled image');
            setUpscaledUrl(upscaledImageUrl);
          }
        }
      } catch (err) {
        console.error('Error parsing cached product data:', err);
      }
    }
    
    // Load previously modified products from localStorage
    const modifiedKey = `upscaled-products-${user.uid}-${activeBrandId}`;
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
  
  // Save product and upscaled image to localStorage when they change
  useEffect(() => {
    if (!user || !activeBrandId) return;
    if (!selectedProduct) return;
    
    const cacheKey = `upscale-images-cache-${user.uid}-${activeBrandId}`;
    const dataToCache = {
      product: selectedProduct,
      upscaledImageUrl: upscaledUrl
    };
    
    localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
    console.log('Cached product and image data');
  }, [user, activeBrandId, selectedProduct, upscaledUrl]);
  
  // Save modified products list to localStorage when it changes
  useEffect(() => {
    if (!user || !activeBrandId || !modifiedProducts.length) return;
    
    const modifiedKey = `upscaled-products-${user.uid}-${activeBrandId}`;
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
        setUpscaledUrl(null);
        setUpscaleError(null);
        setUploadedImage(null);
        setUseOriginalImage(true);
        
        // Load the upscaled image if available
        if (product.upscaledImage) {
          console.log('Found upscaled image in API response:', product.upscaledImage);
          setUpscaledUrl(product.upscaledImage);
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
          
          // Load the upscaled image if available
          if (productData.upscaledImage) {
            console.log('Found upscaled image in Firestore:', productData.upscaledImage);
            setUpscaledUrl(productData.upscaledImage);
          } else {
            setUpscaledUrl(null);
          }
          
          setUpscaleError(null);
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
      setUpscaleError(`Could not load product: ${err.message}`);
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

  // Handle upscale
  const handleUpscaleImage = async () => {
    const imageUrl = useOriginalImage ? selectedProduct?.image : uploadedImage;
    if (!imageUrl) return;
    
    // Check image dimensions before proceeding
    try {
      // Create a promise to load the image and get its dimensions
      const getDimensions = (url) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => reject(new Error('Failed to load image for dimension check'));
          img.src = url;
        });
      };
      
      const dimensions = await getDimensions(imageUrl);
      
      if (dimensions.width > 1024 || dimensions.height > 1024) {
        showToast(`Image size (${dimensions.width}×${dimensions.height} px) exceeds the 1024×1024 pixel limit for upscaling.`, 'error');
        return;
      }
    } catch (error) {
      showToast('Failed to check image dimensions', 'error');
      console.error('Dimension check error:', error);
      return;
    }
    
    setUpscaling(true);
    setUpscaleError(null);
    setUpscaledUrl(null);
    
    try {
      // First check if user has enough credits
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists() || userDoc.data().credits < 1) {
        showToast('You need at least 1 credit to upscale an image', 'error');
        setUpscaling(false);
        return;
      }

      // Deduct one credit
      await updateDoc(userDocRef, {
        credits: userDoc.data().credits - 1
      });
      
      const idToken = await user.getIdToken();
      
      // Extract original filename if we have it
      const originalFilename = selectedProduct?.image ? 
        selectedProduct.image.substring(selectedProduct.image.lastIndexOf('/') + 1) : 
        null;
      
      // Prepare the payload for the upscale request
      const payload = [{
        taskType: "imageUpscale",
        inputImage: imageUrl,
        outputType: ["URL"],
        outputFormat: outputFormat,
        upscaleFactor: upscaleFactor,
        includeCost: true
      }];
      
      const res = await fetch(`${process.env.REACT_APP_API_URL}/runware/imageupscale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ 
          payload, 
          brandId: activeBrandId,
          originalFilename: originalFilename // Pass original filename to API
        })
      });
      
      const data = await res.json();
      
      if (!res.ok || !data.url) {
        // If the upscale fails, refund the credit
        await updateDoc(userDocRef, {
          credits: userDoc.data().credits + 1
        });
        throw new Error(data.error || 'Failed to upscale image');
      }
      
      // Store the dimensions for display
      if (data.dimensions) {
        // Add dimensions to the selected product object
        setSelectedProduct(prev => ({
          ...prev,
          originalDimensions: data.dimensions.original 
            ? `${data.dimensions.original.width}×${data.dimensions.original.height}`
            : null,
          upscaledDimensions: data.dimensions.upscaled
            ? `${data.dimensions.upscaled.width}×${data.dimensions.upscaled.height}`
            : null
        }));
      }
      
      setUpscaledUrl(data.url);
    } catch (err) {
      setUpscaleError(err.message);
      showToast(err.message || 'Failed to upscale image', 'error');
    } finally {
      setUpscaling(false);
    }
  };

  // Handle upload image
  const handleUploadImage = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUpscaleError(null); // Clear previous errors
    
    try {
      const storage = getStorage();
      // Use the public folder so images are accessible to the API
      const storageRef = ref(storage, `public/upscale-uploads/${activeBrandId}/${Date.now()}_${file.name}`);
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
      
      setUpscaleError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Clear cache when changing products to prevent stale data
  const clearProductImageCache = (productId) => {
    if (!user || !activeBrandId) return;
    
    const cacheKey = `upscale-images-cache-${user.uid}-${activeBrandId}`;
    
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
    setUpscaledUrl(null);
    setUpscaleError(null);
    setUploadedImage(null);
    setUseOriginalImage(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    // Then set the selected product
    setSelectedProduct(product);
    
    // Check if we have a cached upscaled image for this product
    if (user && activeBrandId && product) {
      const cacheKey = `upscale-images-cache-${user.uid}-${activeBrandId}`;
      const cachedData = localStorage.getItem(cacheKey);
      
      if (cachedData) {
        try {
          const { product: cachedProduct, upscaledImageUrl } = JSON.parse(cachedData);
          if (cachedProduct && cachedProduct.id === product.id && upscaledImageUrl) {
            console.log('Loading cached upscaled image for product');
            setUpscaledUrl(upscaledImageUrl);
          }
        } catch (err) {
          console.error('Error parsing cached product data:', err);
        }
      }
    }
  };

  // Update product after save
  const updateProductAfterSave = async (productId, upscaledImageUrl) => {
    try {
      // Update the selected product in the state
      setSelectedProduct(prevProduct => {
        if (prevProduct && prevProduct.id === productId) {
          const updatedProduct = {
            ...prevProduct,
            upscaledImage: upscaledImageUrl,
            image: upscaledImageUrl, // Update main image as well
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
  const addToModifiedList = (product, upscaledImageUrl) => {
    if (!product || !upscaledImageUrl) return;
    
    setModifiedProducts(prev => {
      // Check if already in the list
      const exists = prev.some(p => p.id === product.id);
      
      if (exists) {
        // Update the existing entry
        return prev.map(p => 
          p.id === product.id 
            ? { 
                ...p, 
                upscaledImage: upscaledImageUrl, 
                originalImage: product.originalImage || product.image,
                name: product.name,
                originalDimensions: product.originalDimensions,
                upscaledDimensions: product.upscaledDimensions,
                modified: new Date().toISOString()
              } 
            : p
        );
      } else {
        // Add new entry
        return [...prev, {
          id: product.id,
          name: product.name,
          upscaledImage: upscaledImageUrl,
          originalImage: product.originalImage || product.image,
          originalDimensions: product.originalDimensions,
          upscaledDimensions: product.upscaledDimensions,
          modified: new Date().toISOString()
        }];
      }
    });
  };
  
  // Save the upscaled image
  const handleSaveChanges = async () => {
    if (!selectedProduct?.id || !upscaledUrl) return;
    
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    // Clear any existing cache to ensure we save fresh data
    clearProductImageCache(selectedProduct.id);
    
    // Capture original image before we change it
    const originalImage = selectedProduct.originalImage || selectedProduct.image;
    
    try {
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
        upscaledImage: upscaledUrl ? 'present' : 'missing',
        upscaleFactor,
        outputFormat
      });
      
      const productRef = doc(db, 'users', userId, 'brands', brandId, 'products', productId);
      
      // First verify the product exists
      const productDoc = await getDoc(productRef);
      if (!productDoc.exists()) {
        throw new Error(`Product with ID ${productId} not found in Firestore`);
      }
      
      // Update the document with upscaled image
      await updateDoc(productRef, {
        upscaledImage: upscaledUrl,
        image: upscaledUrl, // Also update the main image field
        originalImage: originalImage, // Store the original image URL
        upscaleFactor: upscaleFactor,
        outputFormat: outputFormat,
        originalDimensions: selectedProduct.originalDimensions || null,
        upscaledDimensions: selectedProduct.upscaledDimensions || null,
        imageModified: true, // Flag that this image has been modified
        lastUpdated: new Date().toISOString()
      });
      
      // Verify the update worked by reading the document back
      const updatedDoc = await getDoc(productRef);
      const updatedData = updatedDoc.data();
      
      if (updatedData.upscaledImage !== upscaledUrl || updatedData.image !== upscaledUrl) {
        console.error('Document update verification failed - image not updated correctly');
        console.error('Expected:', upscaledUrl);
        console.error('Got upscaledImage:', updatedData.upscaledImage);
        console.error('Got image:', updatedData.image);
        throw new Error('Document failed to update properly in database');
      }
      
      console.log('Successfully saved to Ecommander database:', updatedData);
      
      // Update the product in state
      await updateProductAfterSave(productId, upscaledUrl);
      
      // Add to modified products list for CSV export
      addToModifiedList(
        { 
          ...selectedProduct, 
          originalImage: originalImage 
        }, 
        upscaledUrl
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
          hasUpscaledImage: !!data.upscaledImage,
          upscaledImageUrl: data.upscaledImage,
          originalImage: data.originalImage,
          upscaleFactor: data.upscaleFactor,
          outputFormat: data.outputFormat,
          originalDimensions: data.originalDimensions,
          upscaledDimensions: data.upscaledDimensions,
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
  
  // Force display of the upscaled image if available
  useEffect(() => {
    if (selectedProduct?.upscaledImage && !upscaledUrl) {
      console.log('Using existing upscaled image from product data:', selectedProduct.upscaledImage);
      setUpscaledUrl(selectedProduct.upscaledImage);
    }
  }, [selectedProduct]);

  // Render CSV export controls 
  const renderExportControls = () => {
    if (!modifiedProducts.length) return null;
    
    return (
      <Box mb={3} p={2} bgcolor="info.light" borderRadius={1}>
        <Typography variant="body1" mb={1}>
          {modifiedProducts.length} product{modifiedProducts.length !== 1 ? 's' : ''} with upscaled images ready for export.
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
                  Upscale Images
                </Typography>
                
                <Button size="small" variant="outlined" onClick={toggleDrawer(true)}>
                  Instructions
                </Button>
              </Box>

              {/* Image Upscale Panel */}
              <Box mb={4}>
                <ImageUpscalePanel 
                  user={user}
                  activeBrandId={activeBrandId}
                  selectedProduct={selectedProduct}
                  upscaledUrl={upscaledUrl}
                  setUpscaledUrl={setUpscaledUrl}
                  upscaleError={upscaleError}
                  setUpscaleError={setUpscaleError}
                  uploading={uploading}
                  uploadedImage={uploadedImage}
                  setUploadedImage={setUploadedImage}
                  useOriginalImage={useOriginalImage}
                  setUseOriginalImage={setUseOriginalImage}
                  saving={saving}
                  saveSuccess={saveSuccess}
                  saveError={saveError}
                  upscaling={upscaling}
                  handleUpscaleImage={handleUpscaleImage}
                  handleUploadImage={handleUploadImage}
                  handleSaveChanges={handleSaveChanges}
                  upscaleFactor={upscaleFactor}
                  setUpscaleFactor={setUpscaleFactor}
                  outputFormat={outputFormat}
                  setOutputFormat={setOutputFormat}
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