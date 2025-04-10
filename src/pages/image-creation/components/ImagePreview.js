import React, { useState, useEffect } from 'react';
import { Box, IconButton, Paper } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { downloadImage } from '../utils/imageUtils';

const LoadingSpinnerSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" style={{ width: '80px', height: '80px' }}>
    <radialGradient id="a3" cx=".66" fx=".66" cy=".3125" fy=".3125" gradientTransform="scale(1.5)">
      <stop offset="0" stopColor="hsl(210, 98%, 48%)"></stop>
      <stop offset=".3" stopColor="hsl(210, 98%, 48%)" stopOpacity=".9"></stop>
      <stop offset=".6" stopColor="hsl(210, 98%, 48%)" stopOpacity=".6"></stop>
      <stop offset=".8" stopColor="hsl(210, 98%, 48%)" stopOpacity=".3"></stop>
      <stop offset="1" stopColor="hsl(210, 98%, 48%)" stopOpacity="0"></stop>
    </radialGradient>
    <circle 
      transform-origin="center" 
      fill="none" 
      stroke="url(#a3)" 
      strokeWidth="15" 
      strokeLinecap="round" 
      strokeDasharray="200 1000" 
      strokeDashoffset="0" 
      cx="100" 
      cy="100" 
      r="70"
    >
      <animateTransform 
        type="rotate" 
        attributeName="transform" 
        calcMode="spline" 
        dur="2" 
        values="360;0" 
        keyTimes="0;1" 
        keySplines="0 0 1 1" 
        repeatCount="indefinite"
      ></animateTransform>
    </circle>
    <circle 
      transform-origin="center" 
      fill="none" 
      opacity=".2" 
      stroke="hsl(210, 98%, 48%)" 
      strokeWidth="15" 
      strokeLinecap="round" 
      cx="100" 
      cy="100" 
      r="70"
    ></circle>
  </svg>
);

export const ImagePreview = ({ 
  imageUrl, 
  onDelete, 
  onDownload,
  description,
  showActions = true,
  height = '150px'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cachedImageUrl, setCachedImageUrl] = useState(null);

  useEffect(() => {
    const cacheImage = async () => {
      try {
        // Try to get the image from cache first
        const cache = await caches.open('image-cache');
        const cachedResponse = await cache.match(imageUrl);
        
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const url = URL.createObjectURL(blob);
          setCachedImageUrl(url);
          setIsLoading(false);
        } else {
          // If not in cache, fetch and cache it
          const response = await fetch(imageUrl);
          const clone = response.clone();
          await cache.put(imageUrl, clone);
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setCachedImageUrl(url);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error caching image:', error);
        setCachedImageUrl(imageUrl);
        setIsLoading(false);
      }
    };

    cacheImage();
  }, [imageUrl]);

  const handleDownload = async () => {
    try {
      await downloadImage(imageUrl);
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
          src={cachedImageUrl || imageUrl}
          alt={description || "Generated image"}
          style={{
            width: '100%',
            height: height,
            objectFit: 'contain',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }}
          onLoad={() => setIsLoading(false)}
        />
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.8)'
            }}
          >
            <LoadingSpinnerSVG />
          </Box>
        )}
        {showActions && (
          <Box 
            className="image-actions"
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              display: 'flex',
              gap: 1,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 1,
              padding: 0.5
            }}
          >
            <IconButton 
              size="small" 
              onClick={onDownload || handleDownload}
              sx={{ color: 'white' }}
            >
              <DownloadIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={onDelete}
              sx={{ color: 'white' }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        )}
      </Box>
    </Paper>
  );
}; 