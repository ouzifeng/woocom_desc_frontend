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
import { styled } from '@mui/material/styles';

import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

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
  const [imageType, setImageType] = React.useState('product');
  const [productUrl, setProductUrl] = React.useState('');
  const [productImageLinks, setProductImageLinks] = React.useState('');
  const [uploadedImages, setUploadedImages] = React.useState([]);
  const [referenceImages, setReferenceImages] = React.useState([]);
  const [description, setDescription] = React.useState('');

  const handleImageUpload = (event, isReference = false) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isReference) {
          setReferenceImages(prev => [...prev, { url: reader.result, name: file.name }]);
        } else {
          setUploadedImages(prev => [...prev, { url: reader.result, name: file.name }]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index, isReference = false) => {
    if (isReference) {
      setReferenceImages(prev => prev.filter((_, i) => i !== index));
    } else {
      setUploadedImages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiInputBase-root': {
      padding: '12px 16px',
      height: 'auto'
    },
    '& .MuiInputBase-input': {
      padding: '0',
      height: 'auto !important',
      minHeight: '120px'
    },
    '& .MuiOutlinedInput-root': {
      height: 'auto'
    },
    '& .MuiInputBase-multiline': {
      padding: '0'
    },
    '& textarea': {
      overflow: 'hidden !important',
      resize: 'none',
      height: 'auto !important',
      boxSizing: 'border-box',
      padding: '16px !important'
    }
  }));


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
                              >
                                Upload Product Images
                                <VisuallyHiddenInput 
                                  type="file" 
                                  multiple 
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(e, false)}
                                />
                              </Button>
                            </Box>

                            {uploadedImages.length > 0 && (
                              <ImageList sx={{ width: '100%', height: 200 }} cols={3} rowHeight={164}>
                                {uploadedImages.map((image, index) => (
                                  <ImageListItem key={index} sx={{ position: 'relative' }}>
                                    <img
                                      src={image.url}
                                      alt={image.name}
                                      loading="lazy"
                                      style={{ height: '150px', objectFit: 'cover' }}
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
                          >
                            Upload Reference Images
                            <VisuallyHiddenInput 
                              type="file" 
                              multiple 
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, true)}
                            />
                          </Button>
                        </Box>

                        {referenceImages.length > 0 && (
                          <ImageList sx={{ width: '100%', height: 200 }} cols={3} rowHeight={164}>
                            {referenceImages.map((image, index) => (
                              <ImageListItem key={index} sx={{ position: 'relative' }}>
                                <img
                                  src={image.url}
                                  alt={image.name}
                                  loading="lazy"
                                  style={{ height: '150px', objectFit: 'cover' }}
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

                          <StyledTextField
                            variant="outlined"
                            multiline
                            fullWidth
                            placeholder="Example: 'To empower busy parents by delivering healthy, convenient meal options, while minimizing environmental impact.'"
                          />

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            size="large"
                            disabled={!description.trim()}
                          >
                            Generate Image
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
                        {/* Placeholder for generated images */}
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