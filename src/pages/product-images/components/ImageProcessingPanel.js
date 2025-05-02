import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Tabs,
  Tab,
  Divider,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import { SketchPicker } from 'react-color';
import Popover from '@mui/material/Popover';
import Slider from '@mui/material/Slider';
import { useToast } from '../../../components/ToasterAlert';

// Presets background colors - could be moved to a config file
const presetColors = [
  '#FFFFFF', '#F44336', '#E91E63', '#9C27B0', 
  '#673AB7', '#3F51B5', '#2196F3', '#00BCD4',
  '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'
];

// Utility function to calculate constrained dimensions
const calculateConstrainedDimensions = (width, height, maxWidth = 800, maxHeight = 600) => {
  // If image is smaller than constraints, return original dimensions
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calculate aspect ratio
  const aspectRatio = width / height;

  // Check which constraint is more restrictive
  if (width / maxWidth > height / maxHeight) {
    // Width is the limiting factor
    return { width: maxWidth, height: Math.round(maxWidth / aspectRatio) };
  } else {
    // Height is the limiting factor
    return { width: Math.round(maxHeight * aspectRatio), height: maxHeight };
  }
};

const ImageProcessingPanel = ({
  user,
  activeBrandId,
  selectedProduct,
  removedUrl,
  setRemovedUrl,
  removeError,
  setRemoveError,
  uploading,
  uploadedImage,
  setUploadedImage,
  useOriginalImage,
  setUseOriginalImage,
  saving,
  saveSuccess,
  saveError,
  handleRemoveBackground,
  handleUploadImage,
  handleSaveChanges,
  removing
}) => {
  const [originalImageDimensions, setOriginalImageDimensions] = useState({ width: 0, height: 0 });
  const { showToast } = useToast();
  
  // Shadow state
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowOpacity, setShadowOpacity] = useState(60);
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetY, setShadowOffsetY] = useState(10);
  
  // Background state
  const [backgroundTab, setBackgroundTab] = useState('photo');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [backgroundEnabled, setBackgroundEnabled] = useState(false);
  
  // Color picker state
  const [colorPickerAnchorEl, setColorPickerAnchorEl] = useState(null);
  const colorPickerOpen = Boolean(colorPickerAnchorEl);

  // Function to get the shadow CSS based on current settings
  const getShadowStyle = () => {
    if (!shadowEnabled) return {};
    
    const opacity = shadowOpacity / 100;
    const color = `rgba(0,0,0,${opacity})`;
    
    return {
      filter: `drop-shadow(0px ${shadowOffsetY}px ${shadowBlur}px ${color})`,
      margin: '20px 0',
    };
  };

  // Handle background tab change
  const handleBackgroundTabChange = (event, newValue) => {
    setBackgroundTab(newValue);
  };

  // Handle color selection
  const handleColorSelect = (color) => {
    setBackgroundColor(color);
    setBackgroundEnabled(true);
  };

  // Handle hex color input change
  const handleHexColorChange = (e) => {
    setBackgroundColor(e.target.value);
    setBackgroundEnabled(true);
  };

  // Handle color picker open
  const handleColorPickerOpen = (event) => {
    setColorPickerAnchorEl(event.currentTarget);
  };

  // Handle color picker close
  const handleColorPickerClose = () => {
    setColorPickerAnchorEl(null);
  };

  // Handle color change from picker
  const handleColorChange = (color) => {
    setBackgroundColor(color.hex);
    setBackgroundEnabled(true);
  };

  // Handle image load to capture original dimensions
  const handleImageLoad = (e) => {
    const width = e.target.naturalWidth;
    const height = e.target.naturalHeight;
    console.log(`Image loaded with dimensions: ${width}x${height}`);
    setOriginalImageDimensions({
      width,
      height
    });
  };

  // Calculate display dimensions
  const getDisplayDimensions = () => {
    if (!originalImageDimensions.width || !originalImageDimensions.height) {
      return { width: 'auto', height: 'auto' };
    }
    
    // Use utility function to calculate appropriate display dimensions
    return calculateConstrainedDimensions(originalImageDimensions.width, originalImageDimensions.height);
  };
  
  // Check if image is extremely large
  const isExtremelyLargeImage = () => {
    return originalImageDimensions.width > 2000 || originalImageDimensions.height > 2000;
  };

  // Handle download image in new tab
  const handleDownloadImage = () => {
    if (!removedUrl) return;
    
    // Open the image URL in a new tab
    window.open(removedUrl, '_blank');
  };

  if (!selectedProduct) {
    return (
      <Alert severity="info">
        Select a product from the table below to edit its image
      </Alert>
    );
  }

  // Determine if we have a processed image already
  const hasProcessedImage = !!removedUrl;
  const displayImage = hasProcessedImage ? removedUrl : 
                         useOriginalImage ? selectedProduct.image : 
                         uploadedImage;
  
  return (
    <Paper elevation={2} sx={{ p: 3, backgroundColor: 'white' }}>
      <Typography variant="h6" gutterBottom>
        {selectedProduct.name}
      </Typography>

      <Grid container spacing={3}>
        {/* Source Image Column */}
        <Grid item xs={12} md={6}>
          <Tabs value={useOriginalImage ? 0 : 1} onChange={(e, val) => setUseOriginalImage(val === 0)}>
            <Tab label="Original Image" />
            <Tab label="Upload New" />
          </Tabs>
          
          {/* Background & Shadow options moved here - above the image */}
          {removedUrl && (
            <Box sx={{ mt: 2, mb: 3 }}>
              <Divider sx={{ mb: 2 }} />
              
              {/* Background options */}
              
              <Tabs value={backgroundTab} onChange={handleBackgroundTabChange} aria-label="background options" 
                sx={{ minHeight: '32px', '& .MuiTab-root': { minHeight: '32px', py: 0.5 } }}>
                <Tab label="Image" value="photo" />
                <Tab label="Colours" value="color" />
              </Tabs>
              
              <Box sx={{ mt: 1 }}>
                {backgroundTab === 'photo' ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={!backgroundEnabled}
                        onChange={(e) => setBackgroundEnabled(!e.target.checked)}
                        color="primary"
                        size="small"
                      />
                    }
                    label={<Typography variant="body2">Transparent Background</Typography>}
                  />
                ) : (
                  <>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={backgroundEnabled}
                          onChange={(e) => setBackgroundEnabled(e.target.checked)}
                          color="primary"
                          size="small"
                        />
                      }
                      label={<Typography variant="body2">Use Background Color</Typography>}
                    />
                    
                    {backgroundEnabled && (
                      <>
                        <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {presetColors.map((color) => (
                            <Box
                              key={color}
                              onClick={() => handleColorSelect(color)}
                              sx={{
                                width: 24,
                                height: 24,
                                backgroundColor: color,
                                cursor: 'pointer',
                                border: backgroundColor === color ? '2px solid #000' : '1px solid #ddd',
                                borderRadius: '4px',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            />
                          ))}
                        </Box>
                        
                        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            label="Hex Color"
                            value={backgroundColor}
                            onChange={handleHexColorChange}
                            size="small"
                            sx={{ mb: 1, '& .MuiInputBase-root': { height: 32 } }}
                          />
                          <Box
                            onClick={handleColorPickerOpen}
                            sx={{
                              height: 32,
                              width: 32,
                              backgroundColor: backgroundColor,
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              '&:hover': {
                                opacity: 0.8,
                              },
                            }}
                          />
                          <Popover
                            open={colorPickerOpen}
                            anchorEl={colorPickerAnchorEl}
                            onClose={handleColorPickerClose}
                            anchorOrigin={{
                              vertical: 'bottom',
                              horizontal: 'center',
                            }}
                            transformOrigin={{
                              vertical: 'top',
                              horizontal: 'center',
                            }}
                          >
                            <SketchPicker
                              color={backgroundColor}
                              onChange={handleColorChange}
                              disableAlpha
                            />
                          </Popover>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </Box>
              
              {/* Shadow options */}
              
              <FormControlLabel
                control={
                  <Switch
                    checked={shadowEnabled}
                    onChange={(e) => setShadowEnabled(e.target.checked)}
                    color="primary"
                    size="small"
                  />
                }
                label={<Typography variant="body2">Add Shadow</Typography>}
              />

              {shadowEnabled && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>Shadow Opacity</Typography>
                  <Slider
                    value={shadowOpacity}
                    onChange={(e, newValue) => setShadowOpacity(newValue)}
                    min={0}
                    max={100}
                    valueLabelDisplay="auto"
                    sx={{ color: '#b8860b', py: 0.5, height: 2 }}
                    size="small"
                  />
                  
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 1 }}>Shadow Blur</Typography>
                  <Slider
                    value={shadowBlur}
                    onChange={(e, newValue) => setShadowBlur(newValue)}
                    min={0}
                    max={40}
                    valueLabelDisplay="auto"
                    sx={{ color: '#b8860b', py: 0.5, height: 2 }}
                    size="small"
                  />
                  
                  <Typography variant="body2" sx={{ fontSize: '0.75rem', mt: 1 }}>Shadow Distance</Typography>
                  <Slider
                    value={shadowOffsetY}
                    onChange={(e, newValue) => setShadowOffsetY(newValue)}
                    min={0}
                    max={40}
                    valueLabelDisplay="auto"
                    sx={{ color: '#b8860b', py: 0.5, height: 2 }}
                    size="small"
                  />
                </Box>
              )}
              <Divider sx={{ mt: 2 }} />
            </Box>
          )}
          
          <Box sx={{ 
            mt: 2, 
            border: '1px solid #eee', 
            borderRadius: 1, 
            p: 2, 
            minHeight: 300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {useOriginalImage ? (
              selectedProduct.image ? (
                <img 
                  src={selectedProduct.image} 
                  alt="Product" 
                  style={{ 
                    maxWidth: '800px', // Max width constraint 
                    maxHeight: 300, 
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <Typography>No image available</Typography>
              )
            ) : uploadedImage ? (
              <img 
                src={uploadedImage} 
                alt="Uploaded" 
                style={{ 
                  maxWidth: '800px', // Max width constraint
                  maxHeight: 300, 
                  objectFit: 'contain',
                }}
              />
            ) : uploading ? (
              <CircularProgress />
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="upload-image-button"
                  type="file"
                  onChange={handleUploadImage}
                />
                <label htmlFor="upload-image-button">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                  >
                    Upload Image
                  </Button>
                </label>
              </Box>
            )}
          </Box>
        </Grid>
        
        {/* Processed Image Column */}
        <Grid item xs={12} md={6}>
          <Typography variant="subtitle1" gutterBottom>
            Processed Image
          </Typography>
          
          <Box sx={{ 
            border: '1px solid #eee', 
            borderRadius: 1, 
            p: 2, 
            minHeight: 300,
            mt: removedUrl ? 'calc(2px + 1.5rem)' : 2, // Align with the original image box
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {removing ? (
              <CircularProgress />
            ) : removedUrl ? (
              <>
                <div style={{
                  width: 'auto',
                  height: 'auto', 
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: backgroundEnabled && backgroundTab === 'color' ? backgroundColor : 'transparent',
                  backgroundImage: !backgroundEnabled || backgroundTab !== 'color' ? 'repeating-conic-gradient(#f3f3f3 0% 25%, white 0% 50%) 50% / 20px 20px' : 'none',
                  position: 'relative'
                }}>
                  <img 
                    src={removedUrl} 
                    alt="No background" 
                    onLoad={handleImageLoad}
                    style={{ 
                      maxWidth: '800px',
                      maxHeight: '600px',
                      objectFit: 'contain',
                      ...getShadowStyle()
                    }} 
                  />
                </div>
                <div style={{textAlign: 'center', marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)'}}>
                  {originalImageDimensions.width > 800 || originalImageDimensions.height > 600 ? (
                    <>
                      Original: {originalImageDimensions.width}×{originalImageDimensions.height} px
                      <span style={{marginLeft: '8px', color: '#f57c00'}}>
                        (displaying at {getDisplayDimensions().width}×{getDisplayDimensions().height} px)
                      </span>
                    </>
                  ) : (
                    <>Image dimensions: {originalImageDimensions.width || '?'}×{originalImageDimensions.height || '?'} px</>
                  )}
                </div>
                
                {isExtremelyLargeImage() && (
                  <Alert severity="warning" sx={{ mt: 1, p: 0.5, fontSize: '0.75rem' }}>
                    This image is very large. For better performance, consider using an image under 2000×2000 pixels.
                  </Alert>
                )}
              </>
            ) : (
              <Typography sx={{ color: '#aaa' }}>No result yet</Typography>
            )}
            {removeError && <Typography color="error">{removeError}</Typography>}
          </Box>
        </Grid>
      </Grid>
      
      {/* Controls section with added download button */}
      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleRemoveBackground}
          disabled={removing || !(selectedProduct?.image || uploadedImage)}
          size="medium"
          sx={{ mr: 2 }}
        >
          {removing ? 'Processing...' : 'Remove Background'}
        </Button>
        
        {removedUrl && (
          <>
            <Button
              variant="outlined"
              onClick={() => handleSaveChanges(backgroundEnabled, backgroundTab, backgroundColor)}
              size="medium"
              sx={{ mr: 2 }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Image'}
            </Button>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleDownloadImage}
              size="medium"
              startIcon={<DownloadIcon />}
            >
              View Image
            </Button>
          </>
        )}
      </Box>
    </Paper>
  );
};

export default ImageProcessingPanel; 