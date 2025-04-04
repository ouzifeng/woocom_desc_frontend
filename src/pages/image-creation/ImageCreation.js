import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Divider from '@mui/material/Divider';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { styled } from '@mui/material/styles';
import DownloadIcon from '@mui/icons-material/Download';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';
import { useToast } from '../../components/ToasterAlert';
import LoadingSpinner from '../../components/LoadingSpinner';

import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';

const API_URL = process.env.REACT_APP_API_URL;

const VisuallyHiddenInput = styled('input')`
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  bottom: 0;
  left: 0;
  white-space: nowrap;
  width: 1px;
`;

export default function ImageCreation(props) {
  const [user] = useAuthState(auth);
  const { showToast } = useToast();
  const [imageType, setImageType] = React.useState('product');
  const [productUrl, setProductUrl] = React.useState('');
  const [productImageLinks, setProductImageLinks] = React.useState('');
  const [uploadedImages, setUploadedImages] = React.useState([]);
  const [referenceImages, setReferenceImages] = React.useState([]);
  const [description, setDescription] = React.useState('');
  const [isLoading, setIsLoading] = React.useState({
    productUpload: false,
    referenceUpload: false,
    generation: false
  });
  const [error, setError] = React.useState(null);
  const [generatedImages, setGeneratedImages] = React.useState([]);
  const [previousImages, setPreviousImages] = React.useState([]);

  // Function to upload an image to Firebase Storage
  const uploadImageToFirebase = async (file, isReference = false) => {
    if (!user) return null;
    
    try {
      const timestamp = Date.now();
      const fileName = `${isReference ? 'reference' : 'product'}_${timestamp}_${file.name}`;
      const storageRef = ref(storage, `temp/${user.uid}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        url: downloadURL,
        name: file.name,
        path: `temp/${user.uid}/${fileName}`
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast('Failed to upload image', 'error');
      return null;
    }
  };

  const handleImageUpload = async (event, isReference = false) => {
    const files = Array.from(event.target.files);
    
    // Set loading state for the specific upload type
    setIsLoading(prev => ({
      ...prev,
      [isReference ? 'referenceUpload' : 'productUpload']: true
    }));
    setError(null);
    
    try {
      const uploadPromises = files.map(file => uploadImageToFirebase(file, isReference));
      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(file => file !== null);
      
        if (isReference) {
        setReferenceImages(prev => [...prev, ...successfulUploads]);
        } else {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
      }
      
      showToast(`Successfully uploaded ${successfulUploads.length} images`, 'success');
    } catch (error) {
      console.error('Error handling image upload:', error);
      setError('Failed to upload images. Please try again.');
      showToast('Failed to upload images', 'error');
    } finally {
      // Clear loading state for the specific upload type
      setIsLoading(prev => ({
        ...prev,
        [isReference ? 'referenceUpload' : 'productUpload']: false
      }));
    }
  };

  const handleRemoveImage = async (index, isReference = false) => {
    try {
      // Get the image to be deleted
      const imageToDelete = isReference ? referenceImages[index] : uploadedImages[index];
      
      // Create a reference to the file in Firebase Storage
      const imageRef = ref(storage, imageToDelete.path);
      
      // Delete the file from Firebase Storage
      await deleteObject(imageRef);
      
      // Remove from state after successful deletion
    if (isReference) {
      setReferenceImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
      }
      
      showToast('Image deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast('Failed to delete image', 'error');
    }
  };

  // Function to save generated image to permanent storage
  const saveGeneratedImage = async (imageUrl, prompt) => {
    if (!user) return null;
    
    try {
      // Send the OpenAI image URL to our backend to handle the download and storage
      const response = await fetch(`${API_URL}/openai/save-generated-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({
          imageUrl,
          prompt,
          imageType,
          description
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save image');
      }

      const data = await response.json();
      return data.permanentUrl;
    } catch (error) {
      console.error('Error saving generated image:', error);
      showToast('Failed to save generated image', 'error');
      return null;
    }
  };

  const handleGenerateImage = async () => {
    if (!user) {
      showToast('You must be logged in to generate images', 'error');
      return;
    }
    
    if (!description.trim()) {
      showToast('Please provide an image description', 'error');
      return;
    }
    
    setIsLoading(prev => ({
      ...prev,
      generation: true
    }));
    setError(null);
    
    try {
      const payload = {
        imageType,
        productUrl,
        productImages: uploadedImages.map(img => img.url),
        referenceImages: referenceImages.map(img => img.url),
        description
      };
      
      console.log('Sending request with payload:', payload);
      
      const response = await fetch(`${API_URL}/openai/image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate image');
      }
      
      if (data.result === 'Success' && data.imageUrl) {
        console.log('Saving generated image from URL:', data.imageUrl);
        // Save the generated image permanently
        const permanentUrl = await saveGeneratedImage(data.imageUrl, data.prompt);
        console.log('Saved image with permanent URL:', permanentUrl);
        
        if (permanentUrl) {
          setGeneratedImages([permanentUrl]);
          showToast('Image generated and saved successfully!', 'success');
        } else {
          throw new Error('Failed to save generated image');
        }
      } else {
        throw new Error('Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setError(error.message || 'Failed to generate image. Please try again.');
      showToast(error.message || 'Failed to generate image', 'error');
    } finally {
      setIsLoading(prev => ({
        ...prev,
        generation: false
      }));
    }
  };

  // Function to fetch previously generated images
  const fetchPreviousImages = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        if (userData?.generatedImages) {
          // Sort by timestamp descending (newest first)
          const sortedImages = [...userData.generatedImages].sort((a, b) => b.timestamp - a.timestamp);
          setPreviousImages(sortedImages);
        }
      }
    } catch (error) {
      console.error('Error fetching previous images:', error);
      showToast('Failed to load previous images', 'error');
    }
  }, [user, showToast]);

  // Fetch previous images on component mount and after new generation
  React.useEffect(() => {
    fetchPreviousImages();
  }, [fetchPreviousImages, generatedImages]);

  // Function to download image
  const handleDownload = async (imageUrl, timestamp) => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/openai/download-image?imageUrl=${encodeURIComponent(imageUrl)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to download image');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated_image_${timestamp}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showToast('Image downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading image:', error);
      showToast('Failed to download image', 'error');
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      {isLoading.generation && <LoadingSpinner />}
      <Box sx={{ display: 'flex' }}>
        <SideMenu user={user} />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4" component="h1">
                  Image Creation
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
                  Generate professional images using AI
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                <Grid container spacing={3}>
                  {/* Left Column: All Input Controls */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      {/* Image Type */}
                      <Paper sx={{ p: 3 }}>
                        <FormControl component="fieldset">
                          <FormLabel component="legend">Image Type</FormLabel>
                          <RadioGroup
                            value={imageType}
                            onChange={(e) => setImageType(e.target.value)}
                          >
                            <FormControlLabel value="product" control={<Radio />} label="Product Image" />
                            <FormControlLabel value="square" control={<Radio />} label="Square Ad" />
                            <FormControlLabel value="rectangular" control={<Radio />} label="Rectangular Ad" />
                          </RadioGroup>
                        </FormControl>
                      </Paper>

                      {/* Product Information */}
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Product Information
                        </Typography>
                        
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Product URL"
                              value={productUrl}
                              onChange={(e) => setProductUrl(e.target.value)}
                              InputProps={{
                                startAdornment: <ShoppingCartIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                              }}
                            />
                          </Grid>

                          <Grid item xs={12}>
                            <Box sx={{ mb: 2 }}>
                              <Button
                                component="label"
                                variant="outlined"
                                startIcon={<CloudUploadIcon />}
                                sx={{ mr: 2 }}
                                disabled={isLoading.productUpload}
                              >
                                Upload Product Images
                                <VisuallyHiddenInput 
                                  type="file" 
                                  multiple 
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, false)}
                                />
                              </Button>
                              {isLoading.productUpload && <CircularProgress size={24} sx={{ ml: 2 }} />}
                            </Box>

                            {uploadedImages.length > 0 && (
                              <ImageList sx={{ width: '100%', height: 'auto', maxHeight: 400 }} cols={3} rowHeight="auto">
                                {uploadedImages.map((image, index) => (
                                  <ImageListItem 
                                    key={index} 
                                    sx={{ 
                                      height: '200px !important',
                                      overflow: 'hidden',
                                      position: 'relative'
                                    }}
                                  >
                                    <img
                                      src={image.url}
                                      alt={image.name}
                                      loading="lazy"
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        backgroundColor: '#f5f5f5'
                                      }}
                                    />
                                    <IconButton
                                      sx={{
                                        position: 'absolute',
                                        right: 4,
                                        top: 4,
                                        bgcolor: 'rgba(255, 255, 255, 0.8)',
                                      }}
                                      size="small"
                                      onClick={() => handleRemoveImage(index, false)}
                                      disabled={isLoading.productUpload}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </ImageListItem>
                                ))}
                              </ImageList>
                            )}
                          </Grid>
                        </Grid>
                      </Paper>

                      {/* Reference Images */}
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Reference Images
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Upload images of products you like for reference
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUploadIcon />}
                            disabled={isLoading.referenceUpload}
                          >
                            Upload Reference Images
                            <VisuallyHiddenInput 
                              type="file" 
                              multiple 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                            />
                          </Button>
                          {isLoading.referenceUpload && <CircularProgress size={24} sx={{ ml: 2 }} />}
                        </Box>

                        {referenceImages.length > 0 && (
                          <ImageList sx={{ width: '100%', height: 'auto', maxHeight: 400 }} cols={3} rowHeight="auto">
                            {referenceImages.map((image, index) => (
                              <ImageListItem 
                                key={index} 
                                sx={{ 
                                  height: '200px !important',
                                  overflow: 'hidden',
                                  position: 'relative'
                                }}
                              >
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  loading="lazy"
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    backgroundColor: '#f5f5f5'
                                  }}
                                />
                                <IconButton
                                  sx={{
                                    position: 'absolute',
                                    right: 4,
                                    top: 4,
                                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                                  }}
                                  size="small"
                                  onClick={() => handleRemoveImage(index, true)}
                                  disabled={isLoading.referenceUpload}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )}
                      </Paper>
                    </Stack>
                  </Grid>

                  {/* Right Column: Description and Generated Images */}
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      {/* Image Description */}
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Image Description
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Describe in detail what kind of image you want to generate
                        </Typography>

                        <TextField
                          fullWidth
                          multiline
                            variant="outlined"
                            placeholder="Example: 'To empower busy parents by delivering healthy, convenient meal options, while minimizing environmental impact.'"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          disabled={isLoading.generation}
                          sx={{
                            '& .MuiInputBase-root': {
                              padding: '12px 16px',
                              height: 'auto'
                            },
                            '& .MuiInputBase-input': {
                              padding: '0',
                              height: 'auto !important',
                              minHeight: '120px'
                            },
                            '& textarea': {
                              overflow: 'hidden !important',
                              resize: 'none',
                              height: 'auto !important',
                              boxSizing: 'border-box',
                              padding: '16px !important'
                            }
                          }}
                          />

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            size="large"
                            onClick={handleGenerateImage}
                            disabled={isLoading.generation || !description.trim()}
                            startIcon={isLoading.generation ? <CircularProgress size={20} color="inherit" /> : null}
                          >
                            {isLoading.generation ? 'Generating...' : 'Generate Image'}
                          </Button>
                        </Box>
                      </Paper>

                      {/* Generated Images Area */}
                      <Paper sx={{ p: 3, minHeight: '300px' }}>
                        <Typography variant="h6" gutterBottom>
                          Generated Images
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Your generated images will appear here
                        </Typography>
                        
                        {generatedImages.length > 0 ? (
                          <Box sx={{ width: '100%' }}>
                            {generatedImages.map((imageUrl, index) => (
                              <Box key={index} sx={{ position: 'relative', mb: 2 }}>
                                <img
                                  src={imageUrl}
                                  alt={`Generated image ${index + 1}`}
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    maxHeight: '600px',
                                    objectFit: 'contain',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px'
                                  }}
                                />
                                <IconButton
                                  onClick={() => handleDownload(imageUrl, Date.now())}
                                  sx={{
                                    position: 'absolute',
                                    right: 8,
                                    top: 8,
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    '&:hover': {
                                      backgroundColor: 'rgba(255, 255, 255, 1)',
                                    }
                                  }}
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          alignItems: 'center',
                          height: '300px',
                          border: '2px dashed #ccc',
                          borderRadius: 1
                        }}>
                          <Typography variant="body1" color="text.secondary">
                              {isLoading.generation ? 'Generating image...' : 'Generated images will be displayed here'}
                            </Typography>
                          </Box>
                        )}
                      </Paper>

                      {/* Previously Generated Images Section */}
                      <Paper sx={{ p: 3, mt: 3 }}>
                        <Typography variant="h6" gutterBottom>
                          Previously Generated Images
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Your previously generated images
                        </Typography>

                        <Grid container spacing={2}>
                          {previousImages.map((image, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Paper 
                                elevation={2}
                                sx={{ 
                                  p: 1,
                                  position: 'relative',
                                  '&:hover .download-button': {
                                    opacity: 1
                                  }
                                }}
                              >
                                <Box sx={{ position: 'relative' }}>
                                  <img
                                    src={image.url}
                                    alt={`Previous generated image ${index + 1}`}
                                    style={{
                                      width: '100%',
                                      height: '150px',
                                      objectFit: 'contain',
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: '4px'
                                    }}
                                  />
                                  <IconButton
                                    className="download-button"
                                    onClick={() => handleDownload(image.url, image.timestamp)}
                                    sx={{
                                      position: 'absolute',
                                      right: 8,
                                      top: 8,
                                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                      opacity: 0,
                                      transition: 'opacity 0.2s',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 1)',
                                      }
                                    }}
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                </Box>

                              </Paper>
                            </Grid>
                          ))}
                        </Grid>

                        {previousImages.length === 0 && (
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center',
                            height: '100px',
                            border: '2px dashed #ccc',
                            borderRadius: 1
                          }}>
                            <Typography variant="body1" color="text.secondary">
                              No previously generated images
                          </Typography>
                        </Box>
                        )}
                      </Paper>
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
} 