import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import { ImagePreview } from './ImagePreview';

export const GeneratedImages = ({ 
  generatedImages, 
  onDeleteImage, 
  onDownloadImage 
}) => {
  return (
    <Paper sx={{ p: 3, minHeight: '300px' }}>
      <Typography variant="h6" gutterBottom>
        Generated Images
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your generated images will appear here
      </Typography>
      
      {generatedImages.length > 0 ? (
        <Box sx={{ width: '100%' }}>
          {generatedImages.map((image, index) => (
            <Box 
              key={index} 
              sx={{ 
                position: 'relative', 
                mb: 2,
                '&:hover .image-actions': {
                  opacity: 1
                }
              }}
            >
              <ImagePreview
                imageUrl={image.url}
                onDelete={() => onDeleteImage(image.url)}
                onDownload={() => onDownloadImage(image.url)}
                description={image.description}
                height="600px"
              />
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
            Generated images will be displayed here
          </Typography>
        </Box>
      )}
    </Paper>
  );
}; 
 
 