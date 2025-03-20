import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { alpha } from '@mui/material/styles';

/** A helper that decodes HTML entities */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchAllProducts = async () => {
      if (!user) return;

      try {
        const productsRef = collection(db, 'users', user.uid, 'products');
        const querySnapshot = await getDocs(productsRef);
        const products = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          name: decodeHtmlEntities(doc.data().name || '')
        }));
        setAllProducts(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchAllProducts();
  }, [user]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    const searchLower = searchQuery.toLowerCase();
    const filtered = allProducts.filter(product => 
      product.name?.toLowerCase().includes(searchLower)
    );

    setSearchResults(filtered);
    setShowDropdown(true);
    setIsLoading(false);
  }, [searchQuery, allProducts]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?query=${searchQuery}`);
    }
  };

  const handleProductSelect = (productId) => {
    navigate(`/products/${productId}`);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleClickAway = () => {
    setShowDropdown(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative', width: { xs: '100%', md: '50ch' } }}>
        <FormControl
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{ width: '100%' }}
          variant="outlined"
        >
          <OutlinedInput
            size="small"
            id="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              flexGrow: 1,
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.9),
              borderRadius: '12px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 1),
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              },
              '&.Mui-focused': {
                backgroundColor: (theme) => alpha(theme.palette.background.paper, 1),
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }
            }}
            startAdornment={
              <InputAdornment position="start">
                <SearchRoundedIcon 
                  sx={{ 
                    color: 'primary.main',
                    opacity: 0.8
                  }} 
                  fontSize="small" 
                />
              </InputAdornment>
            }
            endAdornment={
              isLoading && (
                <InputAdornment position="end">
                  <CircularProgress 
                    size={20} 
                    sx={{ 
                      color: 'primary.main',
                      opacity: 0.8
                    }} 
                  />
                </InputAdornment>
              )
            }
            inputProps={{
              'aria-label': 'search',
            }}
          />
        </FormControl>

        {showDropdown && (searchResults.length > 0 ? (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: 300,
              overflow: 'auto',
              zIndex: 1000,
              backgroundColor: 'background.paper',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <List sx={{ py: 1 }}>
              {searchResults.map((product) => (
                <ListItem
                  key={product.id}
                  button
                  onClick={() => handleProductSelect(product.id)}
                  sx={{
                    px: 2,
                    py: 1,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      src={product.image}
                      alt={product.name}
                      variant="rounded"
                      sx={{ 
                        width: 40, 
                        height: 40,
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                    />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500,
                          color: 'text.primary'
                        }}
                      >
                        {product.name}
                      </Typography>
                    } 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : searchQuery.length >= 3 && (
          <Paper
            elevation={0}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              p: 3,
              zIndex: 1000,
              backgroundColor: 'background.paper',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
            }}
          >
            <Typography 
              color="text.secondary"
              sx={{ 
                fontSize: '0.9rem',
                fontWeight: 500,
                opacity: 0.8
              }}
            >
              No results found
            </Typography>
          </Paper>
        ))}
      </Box>
    </ClickAwayListener>
  );
}
