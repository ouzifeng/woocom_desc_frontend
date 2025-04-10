import React from 'react';
import { Box, Button, Typography, ImageList, ImageListItem, IconButton, CircularProgress, Paper } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { styled } from '@mui/material/styles';
import { uploadImageToFirebase, deleteImageFromFirebase } from '../utils/imageUtils';
import { ImagePreview } from './ImagePreview';

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

export const ImageUploadSection = ({ 
  title, 
  description, 
  images, 
  setImages, 
  user, 
  isLoading, 
  isReference = false 
}) => {
  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    
    try {
      const uploadPromises = files.map(file => uploadImageToFirebase(file, user, isReference));
      const uploadedFiles = await Promise.all(uploadPromises);
      const successfulUploads = uploadedFiles.filter(file => file !== null);
      
      setImages(prev => [...prev, ...successfulUploads]);
    } catch (error) {
      console.error('Error handling image upload:', error);
    }
  };

  const handleRemoveImage = async (index) => {
    try {
      const imageToDelete = images[index];
      await deleteImageFromFirebase(imageToDelete.path);
      setImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {description}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          sx={{ mr: 2 }}
          disabled={isLoading}
        >
          Upload {isReference ? 'Reference' : 'Product'} Images
          <VisuallyHiddenInput 
            type="file" 
            multiple 
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Button>
        {isLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
      </Box>

      {images.length > 0 && (
        <ImageList sx={{ width: '100%', height: 'auto', maxHeight: 400 }} cols={3} rowHeight="auto">
          {images.map((image, index) => (
            <ImageListItem 
              key={index} 
              sx={{ 
                height: '200px !important',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              <ImagePreview
                imageUrl={image.url}
                onDelete={() => handleRemoveImage(index)}
                timestamp={Date.now()}
                height="200px"
              />
            </ImageListItem>
          ))}
        </ImageList>
      )}
    </Paper>
  );
}; 
 