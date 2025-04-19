import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import { useBrand } from '../contexts/BrandContext';
import { useNavigate } from 'react-router-dom';

const BrandListWrapper = styled(Box)(({ theme }) => ({
  width: '100%',
  maxHeight: 250,
  overflowY: 'auto',
  backgroundColor: theme.palette.background.paper
}));

export default function BrandSwitcher({ collapsed = false }) {
  const { 
    activeBrand, 
    userBrands, 
    loading, 
    switchBrand, 
    createBrand, 
    updateBrandName,
    activeBrandId
  } = useBrand();
  const [open, setOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [displayBrandName, setDisplayBrandName] = useState('');
  const navigate = useNavigate();
  
  // Update display name whenever active brand changes
  useEffect(() => {
    if (activeBrand?.name) {
      setDisplayBrandName(activeBrand.name);
      // Also force update document title for consistency
      document.title = activeBrand.name ? `Ecommander - ${activeBrand.name}` : 'Ecommander';
    } else if (userBrands?.length > 0) {
      // Fallback if activeBrand isn't set but userBrands exists
      const currentBrand = userBrands.find(b => b.id === activeBrandId);
      if (currentBrand?.name) {
        setDisplayBrandName(currentBrand.name);
      } else {
        setDisplayBrandName('Select Brand');
      }
    } else {
      setDisplayBrandName('Select Brand');
    }
  }, [activeBrand, userBrands, activeBrandId]);
  
  if (collapsed) {
    return null; // Don't render anything when collapsed
  }

  const handleToggle = () => {
    setOpen(!open);
  };

  const handleSwitchBrand = (brandId) => {
    switchBrand(brandId);
    setOpen(false);
  };

  const handleCreateBrand = () => {
    createBrand("New Brand").then((brandId) => {
      if (brandId) {
        setOpen(false);
        // Refresh the page to ensure changes take effect
        window.location.href = '/brand-settings';
      }
    });
  };

  const handleEditBrandName = () => {
    if (isEditing) {
      // Save the new name
      if (brandName && brandName !== displayBrandName) {
        updateBrandName(activeBrand?.id, brandName).then(success => {
          if (success) {
            // Update display immediately
            setDisplayBrandName(brandName);
          }
        });
      }
      setIsEditing(false);
    } else {
      // Start editing
      setBrandName(displayBrandName || '');
      setIsEditing(true);
    }
  };

  const handleBrandNameChange = (e) => {
    setBrandName(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleEditBrandName();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading brands...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box 
        sx={{ 
          p: 2, 
          pb: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: 'action.hover'
          }
        }}
        onClick={handleToggle}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {isEditing ? (
            <TextField
              size="small"
              fullWidth
              value={brandName}
              onChange={handleBrandNameChange}
              onKeyDown={handleKeyDown}
              autoFocus
              sx={{ mr: 1 }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                flexGrow: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {displayBrandName}
            </Typography>
          )}
          <IconButton 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleEditBrandName();
            }}
            sx={{ ml: 'auto', mr: 1 }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>
      
      {open && (
        <>
          <BrandListWrapper>
            <List dense sx={{ padding: 0 }}>
              {userBrands.map((brand) => (
                <ListItem 
                  key={brand.id} 
                  disablePadding
                  selected={brand.id === activeBrand?.id}
                >
                  <ListItemButton 
                    onClick={() => handleSwitchBrand(brand.id)}
                    sx={{ px: 2, py: 1 }}
                  >
                    <ListItemText 
                      primary={brand.name} 
                      primaryTypographyProps={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              <Divider />
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={handleCreateBrand}
                  sx={{ px: 2, py: 1 }}
                >
                  <AddIcon fontSize="small" sx={{ mr: 1 }} />
                  <ListItemText primary="Create New Brand" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => {
                    navigate('/brand-management');
                    setOpen(false);
                  }}
                  sx={{ px: 2, py: 1 }}
                >
                  <ListItemText primary="Manage Brands" />
                </ListItemButton>
              </ListItem>
            </List>
          </BrandListWrapper>
        </>
      )}
    </>
  );