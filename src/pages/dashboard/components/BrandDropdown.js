import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BusinessIcon from '@mui/icons-material/Business';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import SettingsIcon from '@mui/icons-material/Settings';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

export default function BrandDropdown() {
  const [user] = useAuthState(auth);
  const [brands, setBrands] = useState([]);
  const [currentBrand, setCurrentBrand] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const brandsRef = collection(db, `users/${user.uid}/brands`);
      const q = query(brandsRef);
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const brandsData = [];
        querySnapshot.forEach((doc) => {
          brandsData.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setBrands(brandsData);
        
        // Set initial current brand if not set and we have brands
        if (!currentBrand && brandsData.length > 0) {
          setCurrentBrand(brandsData[0]);
        }
      });
      
      return () => unsubscribe();
    }
  }, [user, currentBrand]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleBrandSelect = (brand) => {
    setCurrentBrand(brand);
    handleClose();
    // You would add logic here to update the app state with the selected brand
  };

  const handleManageBrands = () => {
    handleClose();
    navigate('/your-brands');
  };

  if (!currentBrand) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        id="brand-button"
        aria-controls={open ? 'brand-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        endIcon={<KeyboardArrowDownIcon />}
        startIcon={<BusinessIcon />}
        sx={{ 
          textTransform: 'none',
          fontWeight: 'medium',
          color: 'text.primary'
        }}
      >
        <Typography variant="body1" sx={{ maxWidth: { xs: 80, sm: 150 }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {currentBrand.name}
        </Typography>
      </Button>
      <Menu
        id="brand-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'brand-button',
        }}
      >
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Your Brands
        </Typography>
        {brands.map((brand) => (
          <MenuItem 
            key={brand.id} 
            onClick={() => handleBrandSelect(brand)}
            selected={currentBrand.id === brand.id}
          >
            <ListItemIcon>
              <BusinessIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{brand.name}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem onClick={handleManageBrands}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Brands</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
} 