import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function SettingsInstructions({ drawerOpen, toggleDrawer }) {
  return (
    <Drawer
      anchor="left"
      open={drawerOpen}
      onClose={toggleDrawer(false)}
      PaperProps={{
        sx: { width: 400, p: 2 }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Settings Instructions</Typography>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      
      <List>
        <ListItem>
          <ListItemText
            primary="WooCommerce Connection"
            secondary="1. Download the WooCommerce plugin
2. Install and activate it on your WordPress site
3. Enter your store URL and API credentials
4. Test the connection to ensure it's working"
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Shopify Connection"
            secondary="1. Enter your Shopify store URL
2. Install the Shopify app
3. Authorize the connection
4. Test the connection to ensure it's working"
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Google Analytics"
            secondary="1. Enter your Google Analytics tracking ID
2. Save the settings
3. Verify the connection in your Google Analytics dashboard"
          />
        </ListItem>
      </List>
    </Drawer>
  );
} 