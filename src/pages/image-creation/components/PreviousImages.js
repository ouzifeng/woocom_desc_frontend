import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { ImagePreview } from './ImagePreview';

export const PreviousImages = ({ 
  previousImages, 
  onDeleteImage, 
  onDownloadImage 
}) => {
  return (
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
            <ImagePreview
              imageUrl={image.url}
              onDelete={() => onDeleteImage(image.url)}
              timestamp={image.timestamp}
            />
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
  );
}; 