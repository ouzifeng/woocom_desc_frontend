import React, { useState } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  TextField, 
  ImageList, 
  ImageListItem, 
  Modal, 
  IconButton, 
  Stack, 
  Pagination,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import AppNavbar from '../../dashboard/components/AppNavbar';
import Header from '../../dashboard/components/Header';
import SideMenu from '../../dashboard/components/SideMenu';
import AppTheme from '../../shared-theme/AppTheme';
import CloseIcon from '@mui/icons-material/Close';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';
import { useToast } from '../../../components/ToasterAlert';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ImageIcon from '@mui/icons-material/Image';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const API_URL = process.env.REACT_APP_API_URL;

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

export default function StockImages() {
  const [user] = useAuthState(auth);
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedContent, setLoadedContent] = useState({});
  const [open, setOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentType, setContentType] = useState('images');
  const [provider, setProvider] = useState('pexels');

  const handleContentTypeChange = (event, newContentType) => {
    if (newContentType !== null) {
      setContentType(newContentType);
      setContent([]);
      setCurrentPage(1);
      setTotalPages(1);
    }
  };

  const handleProviderChange = (event, newProvider) => {
    if (newProvider !== null) {
      setProvider(newProvider);
      setContent([]);
      setCurrentPage(1);
      setTotalPages(1);
    }
  };

  const handleOpen = (item) => {
    setSelectedContent(item);
    setOpen(true);
  };

  const handleClose = () => {
    if (contentType === 'videos' && selectedContent) {
      const videoElement = document.querySelector('video');
      if (videoElement) {
        videoElement.pause();
      }
    }
    setOpen(false);
    setSelectedContent(null);
  };

  const handleContentLoad = (contentId) => {
    setLoadedContent(prev => ({
      ...prev,
      [contentId]: true
    }));
  };

  const handleSearch = async (e, page = 1) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      let endpoint = '';
      if (provider === 'pexels') {
        endpoint = contentType === 'images' ? 'pexels/search' : 'pexels/videos/search';
      } else if (provider === 'unsplash') {
        endpoint = 'pexels/unsplash/search';
      }
      const response = await fetch(
        `${API_URL}/${endpoint}?query=${encodeURIComponent(searchQuery)}&page=${page}&per_page=20`,
        {
          headers: {
            'Authorization': `Bearer ${user.accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch ${provider} ${contentType}`);
      }

      const data = await response.json();
      let items = [];
      let total = 0;
      let pageNum = 1;
      if (provider === 'pexels') {
        items = contentType === 'images' ? data.photos : data.videos;
        total = data.total_results || 0;
        pageNum = data.page || 1;
      } else if (provider === 'unsplash') {
        items = data.photos;
        total = data.total || 0;
        pageNum = data.page || 1;
      }
      setContent(items || []);
      setTotalPages(Math.ceil(total / 20));
      setCurrentPage(pageNum);
    } catch (error) {
      console.error(`Error searching ${provider} ${contentType}:`, error);
      showToast(`Failed to search ${provider} ${contentType}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (event, value) => {
    handleSearch(null, value);
  };

  return (
    <AppTheme>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <SideMenu />
        <Box sx={{ flexGrow: 1 }}>
          <Header />
          <AppNavbar />
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4" component="h1" gutterBottom>
                  Stock {contentType === 'images' ? 'Images' : 'Videos'}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Search and browse millions of high-quality license free stock {contentType}. Powered by <a href="https://pexels.com" target="_blank" rel="noopener noreferrer">Pexels</a> and <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">Unsplash</a>.
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <ToggleButtonGroup
                    value={provider}
                    exclusive
                    onChange={handleProviderChange}
                    aria-label="provider"
                  >
                    <ToggleButton value="pexels" aria-label="pexels">
                      <ImageIcon sx={{ mr: 1 }} />
                      Pexels
                    </ToggleButton>
                    <ToggleButton value="unsplash" aria-label="unsplash">
                      <PhotoLibraryIcon sx={{ mr: 1 }} />
                      Unsplash
                    </ToggleButton>
                  </ToggleButtonGroup>
                  <ToggleButtonGroup
                    value={contentType}
                    exclusive
                    onChange={handleContentTypeChange}
                    aria-label="content type"
                    sx={{ ml: 2 }}
                  >
                    <ToggleButton value="images" aria-label="images">
                      <ImageIcon sx={{ mr: 1 }} />
                      Images
                    </ToggleButton>
                    <ToggleButton value="videos" aria-label="videos" disabled={provider === 'unsplash'}>
                      <VideoLibraryIcon sx={{ mr: 1 }} />
                      Videos
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                <form onSubmit={handleSearch}>
                  <TextField
                    fullWidth
                    variant="outlined"
                    placeholder={`Search for ${contentType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ mb: 3 }}
                  />
                </form>

                {isLoading ? (
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: 400 
                  }}>
                    <LoadingSpinnerSVG />
                    <Typography sx={{ mt: 2 }}>Loading {contentType}...</Typography>
                  </Box>
                ) : (
                  <>
                    <ImageList cols={4} rowHeight={200} gap={8}>
                      {content.map((item) => (
                        <ImageListItem key={item.id} onClick={() => handleOpen(item)}>
                          <Box sx={{ 
                            width: '100%', 
                            height: '100%', 
                            position: 'relative',
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            {provider === 'pexels' && contentType === 'images' ? (
                              <img
                                src={item.src.large2x}
                                alt={item.alt || 'Stock image'}
                                loading="lazy"
                                onLoad={() => handleContentLoad(item.id)}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  opacity: loadedContent[item.id] ? 1 : 0,
                                  transition: 'opacity 0.3s ease'
                                }}
                              />
                            ) : provider === 'unsplash' ? (
                              <img
                                src={item.url}
                                alt={item.alt || 'Unsplash image'}
                                loading="lazy"
                                onLoad={() => handleContentLoad(item.id)}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  opacity: loadedContent[item.id] ? 1 : 0,
                                  transition: 'opacity 0.3s ease'
                                }}
                              />
                            ) : (
                              <video
                                src={item.video_files[0].link}
                                poster={item.image}
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  opacity: loadedContent[item.id] ? 1 : 0,
                                  transition: 'opacity 0.3s ease'
                                }}
                                onLoadedData={() => handleContentLoad(item.id)}
                              />
                            )}
                            {!loadedContent[item.id] && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <LoadingSpinnerSVG />
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
                                padding: '8px',
                                color: 'white',
                                fontSize: '0.75rem',
                                textAlign: 'right',
                                opacity: loadedContent[item.id] ? 1 : 0,
                                transition: 'opacity 0.3s ease'
                              }}
                            >
                              {provider === 'pexels' && contentType === 'images' ? `${item.width} × ${item.height}` :
                               provider === 'unsplash' ? `${item.width} × ${item.height}` :
                               `${Math.floor(item.duration)}s`}
                            </Box>
                          </Box>
                        </ImageListItem>
                      ))}
                    </ImageList>
                    {content.length > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                          count={totalPages}
                          page={currentPage}
                          onChange={handlePageChange}
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                )}
              </Grid>
            </Grid>
          </Box>
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
            overflow: 'auto',
            borderRadius: '8px',
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
              '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' },
              zIndex: 2
            }}
          >
            <CloseIcon />
          </IconButton>
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              bgcolor: 'rgba(0,0,0,0.4)',
              color: '#fff',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            {provider === 'pexels' && contentType === 'images' ? (
              <>
                <Typography variant="body2">
                  Dimensions: {selectedContent?.width} × {selectedContent?.height}
                </Typography>
                <a
                  href={selectedContent?.src.original}
                  download="stock-image.jpg"
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Download
                </a>
              </>
            ) : provider === 'unsplash' ? (
              <>
                <Typography variant="body2">
                  Dimensions: {selectedContent?.width} × {selectedContent?.height}
                </Typography>
                <Typography variant="body2">
                  {selectedContent?.attribution}
                </Typography>
                <a
                  href={selectedContent?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  View on Unsplash
                </a>
              </>
            ) : (
              <>
                <Typography variant="body2">
                  Duration: {Math.floor(selectedContent?.duration)}s
                </Typography>
                <a
                  href={selectedContent?.video_files[0].link}
                  download="stock-video.mp4"
                  style={{
                    color: '#fff',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Download
                </a>
              </>
            )}
          </Box>
          {provider === 'pexels' && contentType === 'images' ? (
            <img
              src={selectedContent?.src.original}
              alt="Preview"
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : provider === 'unsplash' ? (
            <img
              src={selectedContent?.url}
              alt="Preview"
              style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
            />
          ) : (
            <video
              src={selectedContent?.video_files[0].link}
              poster={selectedContent?.image}
              controls
              style={{ width: '100%', height: 'auto', maxHeight: '80vh' }}
            />
          )}
        </Box>
      </Modal>
    </AppTheme>
  );
}