import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import RefreshIcon from '@mui/icons-material/Refresh';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import CreditCostsDrawer from './CreditCostsDrawer';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import { useBrand } from '../../../contexts/BrandContext';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

const mainListItems = [
  
  { text: 'Home', icon: <HomeRoundedIcon />, link: '/dashboard' },
  { text: 'Product Descriptions', icon: <InventoryRoundedIcon />, link: '/products' },
  { text: 'Product Translations', icon: <TranslateRoundedIcon />, link: '/translations' },
  { text: 'Content Strategy', icon: <ArticleRoundedIcon />, link: '/strategy' },
  { text: 'Keyword Research', icon: <SearchRoundedIcon />, link: '/keyword-research' },
  { text: 'AI Image Generation', icon: <SmartToyIcon />, link: '/image-creation' },
  { text: 'Stock Images', icon: <ImageRoundedIcon />, link: '/stock-images' },
  { text: 'Product Images', icon: <AddPhotoAlternateIcon />, link: '/product-images' },
  { text: 'Upscale Images', icon: <ZoomInIcon />, link: '/upscale-images' },
];

const secondaryListItems = [
  { text: 'Your Brands', icon: <BusinessRoundedIcon />, link: '/your-brands' },
  { text: 'Brand Settings', icon: <BusinessRoundedIcon />, link: '/brand-settings' },
  { text: 'Integrations', icon: <SettingsRoundedIcon />, link: '/settings' },
  { text: 'Redeem Code', icon: <LocalOfferIcon />, link: '/redeem' },
  { text: 'Credit FAQ', icon: <InfoRoundedIcon /> },
  { text: 'Feedback', icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [credits, setCredits] = React.useState(0);
  const [creditCostsOpen, setCreditCostsOpen] = React.useState(false);
  
  // Get brand context
  const { 
    userBrands, 
    activeBrand, 
    activeBrandId, 
    switchBrand, 
    loading,
    error
  } = useBrand();

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      // Set up a real-time listener for credits changes
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setCredits(doc.data().credits || 0);
        }
      }, (error) => {
        console.error("Error fetching user credits:", error);
      });

      // Cleanup the listener when component unmounts
      return () => unsubscribe();
    }
  }, [user]);

  // Function to handle opening the credit costs drawer
  const handleOpenCreditCosts = () => {
    setCreditCostsOpen(true);
  };

  const handleBrandChange = (event) => {
    const brandId = event.target.value;
    if (brandId) {
      console.log("Switching brand from dropdown:", brandId);
      switchBrand(brandId);
    }
  };
  
  // For debugging
  React.useEffect(() => {
    console.log("MenuContent render - activeBrandId:", activeBrandId);
    console.log("MenuContent render - userBrands:", userBrands);
    console.log("MenuContent render - activeBrand:", activeBrand);
  }, [activeBrandId, userBrands, activeBrand]);

  return (
    <>
      <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
        {/* Top section: Brand dropdown + main menu items */}
        <Box>
          {/* Brand selector dropdown */}
          <Box sx={{ mt: 1, mb: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="brand-select-label">Brand</InputLabel>
              <Select
                labelId="brand-select-label"
                id="brand-select"
                value={activeBrandId || ''}
                label="Brand"
                onChange={handleBrandChange}
                disabled={loading || userBrands.length === 0}
                startAdornment={
                  loading ? (
                    <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  ) : null
                }
                endAdornment={
                  error ? (
                    <IconButton
                      size="small"
                      edge="end"
                      aria-label="refresh"
                      onClick={() => window.location.reload()}
                      sx={{ mr: 1 }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  ) : null
                }
              >
                {userBrands.length === 0 && !loading ? (
                  <MenuItem disabled>
                    <Typography color="text.secondary" variant="body2">
                      No brands available
                    </Typography>
                  </MenuItem>
                ) : (
                  userBrands.map((brand) => (
                    <MenuItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
            {error && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                Error: {error}. <Link to="#" onClick={() => window.location.reload()}>Refresh</Link>
              </Typography>
            )}
          </Box>

          {/* Main list items */}
          <List dense>
            {mainListItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  component={item.link ? Link : 'div'}
                  to={item.link}
                  selected={location.pathname === item.link}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Bottom section: secondary list + credits */}
        <Box>
          <List dense>
            {secondaryListItems.map((item, index) => (
              <ListItem key={index} disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  component={item.link ? Link : 'div'}
                  to={item.link}
                  selected={location.pathname === item.link}
                  onClick={item.text === 'Credit FAQ' ? handleOpenCreditCosts : undefined}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}

            {/* Credits chip */}
            <ListItem sx={{ display: 'block', py: 1, '& .MuiButtonBase-root': { opacity: 1 } }}>
              <Chip
                icon={<AutoAwesomeIcon />}
                label={`${credits} credits left`}
                color="primary"
                variant="outlined"
                size="large"
                component={Link}
                to="/checkout"
                clickable
                sx={{
                  width: '100%',
                  borderColor: 'primary.main',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </ListItem>
          </List>
        </Box>
      </Stack>

      {/* Credit drawer modal */}
      <CreditCostsDrawer 
        open={creditCostsOpen} 
        onClose={() => setCreditCostsOpen(false)} 
      />
    </>
  );

}
