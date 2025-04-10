import React from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadImage } from '../utils/imageUtils';

export const ImagePreview = ({ 
  imageUrl, 
  onDelete, 
  timestamp,
  showActions = true,
  height = '150px'
}) => {
  const handleDownload = async () => {
    try {
      await downloadImage(imageUrl, timestamp);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 1,
        position: 'relative',
        '&:hover .image-actions': {
          opacity: 1
        }
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <img
          src={imageUrl}
          alt="Generated image"
          style={{
            width: '100%',
            height: height,
            objectFit: 'contain',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px'
          }}
        />
        {showActions && (
          <Box
            className="image-actions"
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              opacity: 0,
              transition: 'opacity 0.2s',
              display: 'flex',
              gap: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '4px',
              borderRadius: 1
            }}
          >
            <IconButton
              onClick={handleDownload}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                }
              }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton
              onClick={onDelete}
              size="small"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                }
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}; 