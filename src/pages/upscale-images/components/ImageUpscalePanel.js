import React, { useState, useEffect } from 'react';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import PhotoIcon from '@mui/icons-material/Photo';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SaveIcon from '@mui/icons-material/Save';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import DownloadIcon from '@mui/icons-material/Download';
import { useToast } from '../../../components/ToasterAlert';

export default function ImageUpscalePanel({ 
  user,
  activeBrandId,
  selectedProduct,
  upscaledUrl,
  setUpscaledUrl,
  upscaleError,
  setUpscaleError,
  uploading,
  uploadedImage,
  setUploadedImage,
  useOriginalImage,
  setUseOriginalImage,
  saving,
  saveSuccess,
  saveError,
  upscaling,
  handleUpscaleImage,
  handleUploadImage,
  handleSaveChanges,
  upscaleFactor,
  setUpscaleFactor,
  outputFormat,
  setOutputFormat
}) {
  const [imageTab, setImageTab] = useState('original');
  const [originalImageDimensions, setOriginalImageDimensions] = useState(null);
  const [upscaledImageDimensions, setUpscaledImageDimensions] = useState(null);
  const { showToast } = useToast();

  // Get dimensions of original image when selected product changes
  useEffect(() => {
    if (selectedProduct?.image) {
      const img = new Image();
      img.onload = () => {
        setOriginalImageDimensions({
          width: img.width,
          height: img.height
        });
      };
      img.src = selectedProduct.image;
    } else {
      setOriginalImageDimensions(null);
    }
  }, [selectedProduct]);

  // Get dimensions of uploaded image when it changes
  useEffect(() => {
    if (uploadedImage) {
      const img = new Image();
      img.onload = () => {
        setOriginalImageDimensions({
          width: img.width,
          height: img.height
        });
      };
      img.src = uploadedImage;
    }
  }, [uploadedImage]);

  // Check if image dimensions are too large for the API
  const isImageTooLarge = () => {
    if (!originalImageDimensions) return false;
    return originalImageDimensions.width > 1024 || originalImageDimensions.height > 1024;
  };

  // Get dimensions of upscaled image when available
  useEffect(() => {
    if (upscaledUrl) {
      const img = new Image();
      img.onload = () => {
        setUpscaledImageDimensions({
          width: img.width,
          height: img.height
        });
      };
      img.src = upscaledUrl;
    } else {
      setUpscaledImageDimensions(null);
    }
  }, [upscaledUrl]);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setImageTab(newValue);
  };

  // Handle upscale factor change
  const handleUpscaleFactorChange = (e) => {
    setUpscaleFactor(Number(e.target.value));
  };

  // Handle output format change
  const handleOutputFormatChange = (e) => {
    setOutputFormat(e.target.value);
  };

  // Calculate upscale dimensions based on factor (preview)
  const getPreviewDimensions = () => {
    if (!originalImageDimensions) return null;

    return {
      width: originalImageDimensions.width * upscaleFactor,
      height: originalImageDimensions.height * upscaleFactor
    };
  };

  // Format dimensions for display
  const formatDimensions = (dimensions) => {
    if (!dimensions) return 'Unknown';
    return `${dimensions.width} × ${dimensions.height}`;
  };

  // Handle view/download image in new tab
  const handleViewImage = () => {
    if (!upscaledUrl) return;
    
    // Open the image URL in a new tab
    window.open(upscaledUrl, '_blank');
  };

  // Render input image section
  const renderInputImageSection = () => {
    return (
      <Box>
        <Tabs value={imageTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab 
            label="Original Image" 
            value="original"
            disabled={!selectedProduct?.image}
            onClick={() => setUseOriginalImage(true)}
          />
          <Tab 
            label="Upload Image" 
            value="upload"
            onClick={() => setUseOriginalImage(false)}
          />
        </Tabs>

        {imageTab === 'original' ? (
          // Original image tab content
          <Card sx={{ mb: 2, position: 'relative' }}>
            {selectedProduct?.image ? (
              <CardMedia
                component="img"
                image={selectedProduct.image}
                alt={selectedProduct.name || 'Product Image'}
                sx={{ maxHeight: 400, objectFit: 'contain' }}
              />
            ) : (
              <Box
                sx={{
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                }}
              >
                <PhotoIcon sx={{ fontSize: 60, color: 'grey.500' }} />
              </Box>
            )}
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                {selectedProduct ? selectedProduct.name : 'No product selected'}
              </Typography>
              {originalImageDimensions && (
                <Typography variant="body2" color="text.secondary">
                  Dimensions: {formatDimensions(originalImageDimensions)}
                </Typography>
              )}
            </CardContent>
          </Card>
        ) : (
          // Upload image tab content
          <Card sx={{ mb: 2 }}>
            {uploadedImage ? (
              <CardMedia
                component="img"
                image={uploadedImage}
                alt="Uploaded Image"
                sx={{ maxHeight: 400, objectFit: 'contain' }}
              />
            ) : (
              <Box
                sx={{
                  minHeight: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                }}
              >
                <UploadFileIcon sx={{ fontSize: 60, color: 'grey.500' }} />
              </Box>
            )}
            <CardContent>
              <Button
                variant="contained"
                component="label"
                disabled={uploading}
                startIcon={uploading ? <CircularProgress size={20} /> : <UploadFileIcon />}
                sx={{ mt: 1 }}
              >
                {uploading ? 'Uploading...' : 'Upload Image'}
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleUploadImage}
                  disabled={uploading}
                />
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  // Render upscale settings
  const renderUpscaleSettings = () => {
    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          Upscale Settings
        </Typography>
        
        <Grid container spacing={2} direction="column">
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="upscale-factor-label">Upscale Factor</InputLabel>
              <Select
                labelId="upscale-factor-label"
                value={upscaleFactor}
                label="Upscale Factor"
                onChange={handleUpscaleFactorChange}
                disabled={upscaling}
              >
                <MenuItem value={2}>2x</MenuItem>
                <MenuItem value={3}>3x</MenuItem>
                <MenuItem value={4}>4x</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="output-format-label">Output Format</InputLabel>
              <Select
                labelId="output-format-label"
                value={outputFormat}
                label="Output Format"
                onChange={handleOutputFormatChange}
                disabled={upscaling}
              >
                <MenuItem value="WEBP">WEBP</MenuItem>
                <MenuItem value="JPEG">JPEG</MenuItem>
                <MenuItem value="PNG">PNG</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
        
        {originalImageDimensions && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              Original: {formatDimensions(originalImageDimensions)} 
              {' → '} 
              Upscaled: {formatDimensions(getPreviewDimensions())}
            </Typography>
          </Box>
        )}
        
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpscaleImage}
            disabled={(!selectedProduct?.image && !uploadedImage) || upscaling || isImageTooLarge()}
            startIcon={upscaling ? <CircularProgress size={20} /> : <ZoomInIcon />}
            fullWidth
          >
            {upscaling ? 'Upscaling...' : 'Upscale Image'}
          </Button>
        </Box>
      </Box>
    );
  };

  // Render result image section
  const renderResultImageSection = () => {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Upscaled Image
        </Typography>
        
        <Card sx={{ mb: 2 }}>
          {upscaledUrl ? (
            <CardMedia
              component="img"
              image={upscaledUrl}
              alt="Upscaled Image"
              sx={{ maxHeight: 400, objectFit: 'contain' }}
            />
          ) : (
            <Box
              sx={{
                minHeight: 300,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.100',
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {upscaling ? 'Upscaling in progress...' : 'No upscaled image yet'}
              </Typography>
            </Box>
          )}
          <CardContent>
            {upscaledImageDimensions && (
              <Typography variant="body2" color="text.secondary">
                Dimensions: {formatDimensions(upscaledImageDimensions)}
              </Typography>
            )}
            
            <Box mt={2} sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSaveChanges}
                disabled={!upscaledUrl || saving}
                startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              >
                {saving ? 'Saving...' : 'Save Image'}
              </Button>
              
              {upscaledUrl && (
                <Button
                  variant="outlined"
                  onClick={handleViewImage}
                  startIcon={<DownloadIcon />}
                >
                  View Image
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Image saved successfully!
          </Alert>
        )}
        
        {saveError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {saveError}
          </Alert>
        )}
      </Box>
    );
  };

  // Render error message if any
  const renderErrorMessage = () => {
    if (!upscaleError) return null;
    
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {upscaleError}
      </Alert>
    );
  };

  // Main render
  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {!selectedProduct && (
        <Box mb={3}>
          <Alert severity="info">
            Please select a product from the table below to get started.
          </Alert>
        </Box>
      )}
      
      {renderErrorMessage()}
      
      <Grid container spacing={3}>
        {/* Left panel: Original/uploaded image */}
        <Grid item xs={12} md={5}>
          {renderInputImageSection()}
        </Grid>
        
        {/* Middle panel: Upscale settings */}
        <Grid item xs={12} md={2}>
          {renderUpscaleSettings()}
        </Grid>
        
        {/* Right panel: Result image */}
        <Grid item xs={12} md={5}>
          {renderResultImageSection()}
        </Grid>
      </Grid>
    </Paper>
  );
} 