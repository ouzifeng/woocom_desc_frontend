import React, { useState, useEffect, useCallback } from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Box,
  Stack,
  Grid,
  Typography,
  ImageList,
  ImageListItem,
  Modal,
  IconButton
} from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import CloseIcon from '@mui/icons-material/Close';
import { auth } from '../../firebase';
import { useToast } from '../../components/ToasterAlert';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { ImageOptionsTable } from './components/ImageOptionsTable';
import { ImageDescription } from './components/ImageDescription';
import { LoadingSpinner } from './components/LoadingSpinner';
import { fetchPreviousImages } from './utils/firebaseUtils';

const API_URL = process.env.REACT_APP_API_URL;

export default function ImageCreation(props) {
  const [user] = useAuthState(auth);
  const { showToast } = useToast();
  const [selectedRow, setSelectedRow] = useState(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState({ generation: false });
  const [error, setError] = useState(null);
  const [previousImages, setPreviousImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleOpen = (imageUrl) => {
    setSelectedImage(imageUrl);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedImage(null);
  };

  const fetchPreviousImagesList = useCallback(async () => {
    if (!user) return;
    try {
      const images = await fetchPreviousImages(user);
      setPreviousImages(images);
    } catch (error) {
      console.error('Error fetching previous images:', error);
      showToast('Failed to load previous images', 'error');
    }
  }, [user, showToast]);

  useEffect(() => {
    fetchPreviousImagesList();
  }, [fetchPreviousImagesList]);

  const handleGenerateImage = async () => {
    if (!user || !description) return;

    try {
      setIsLoading({ generation: true });
      setError(null);

      const selectedSize = selectedRow === 1 ? { width: 1024, height: 1024 }
        : selectedRow === 2 ? { width: 1024, height: 1792 }
        : selectedRow === 3 ? { width: 1024, height: 1024 }
        : selectedRow === 4 ? { width: 1792, height: 1024 }
        : { width: 1024, height: 1024 };

      const payload = {
        positivePrompt: description,
        height: selectedSize.height,
        width: selectedSize.width
      };

      const response = await fetch(`${API_URL}/runware/generate-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      const newImages = data.data.map(item => ({
        url: item.imageURL,
        description: item.positivePrompt
      }));

      const savedImages = [];
      for (const image of newImages) {
        const saveResponse = await fetch(`${API_URL}/runware/save-generated-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.accessToken}`
          },
          body: JSON.stringify({
            imageUrl: image.url,
            prompt: image.description,
            imageType: 'generated',
            description,
            userId: user.uid
          })
        });

        if (!saveResponse.ok) throw new Error('Failed to save image to storage');
        const saveData = await saveResponse.json();
        savedImages.push({ url: saveData.permanentUrl, description: image.description });
      }

      setPreviousImages(prev => [...savedImages, ...prev]);
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err.message);
    } finally {
      setIsLoading({ generation: false });
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
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
            overflow: 'auto'
          })}
        >
          <Stack spacing={2} sx={{ alignItems: 'center', mx: 3, pb: 5, mt: { xs: 8, md: 0 } }}>
            <Header />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4">Image Creation</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 4 }}>
                  Generate professional images for social media
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      <ImageOptionsTable selectedRow={selectedRow} onSelectRow={setSelectedRow} />
                      <ImageDescription
                        description={description}
                        setDescription={setDescription}
                        onGenerate={handleGenerateImage}
                        isLoading={isLoading.generation}
                      />
                    </Stack>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Stack spacing={3}>
                      <Typography variant="h6">Previously Generated Images</Typography>
                      <Box sx={{ position: 'relative', height: 600, width: '100%' }}>
                        <ImageList cols={4} rowHeight={200} sx={{ height: '100%' }}>
                          {previousImages.length === 0 ? (
                            [...Array(4)].map((_, i) => (
                              <ImageListItem key={i}>
                                <Box
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f2f2f2',
                                    borderRadius: 2
                                  }}
                                >
                                  <img
                                    src="/image-loading.svg"
                                    alt="Placeholder"
                                    style={{ maxWidth: '60%', opacity: 0.6 }}
                                  />
                                </Box>
                              </ImageListItem>
                            ))
                          ) : (
                            previousImages.map((item) => (
                              <ImageListItem key={item.url} onClick={() => handleOpen(item.url)}>
                                <img
                                  src={item.url}
                                  alt={item.title || 'Generated Image'}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                                  loading="lazy"
                                />
                              </ImageListItem>
                            ))
                          )}
                        </ImageList>

                        {isLoading.generation && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              height: '100%',
                              width: '100%',
                              backgroundColor: 'rgba(255,255,255,0.8)',
                              zIndex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1
                            }}
                          >
                            <img src="/image-loading.svg" alt="Generating..." style={{ width: '150px', marginBottom: 16, opacity: 0.8 }} />
                            <Typography variant="body2" color="text.secondary">
                              Generating your image...
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        closeAfterTransition
        sx={{
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}
        >
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <a
            href={selectedImage}
            download="generated-image.jpg"
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              padding: '8px',
              borderRadius: '4px',
              textDecoration: 'none',
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' }
            }}
          >
            Download
          </a>
          <img
            src={selectedImage}
            alt="Preview"
            style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </Box>
      </Modal>
    </AppTheme>
  );
}