import React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

export default function InstructionsDrawer({ drawerOpen, toggleDrawer }) {
  return (
    <Drawer anchor="right" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box
        sx={{
          width: 350,
          p: 3,
          height: '100%',
          overflow: 'auto',
        }}
        role="presentation"
      >
        <Typography variant="h5" component="h2" gutterBottom>
          How to Upscale Images
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          Quick Steps:
        </Typography>
        
        <List>
          <ListItem>
            <ListItemText primary="1. Select a product from the table" />
          </ListItem>
          
          <ListItem>
            <ListItemText primary="2. Choose to use the original product image or upload a new one" />
          </ListItem>
          
          <ListItem>
            <ListItemText primary="3. Select upscale factor (2x, 3x, or 4x) and output format" />
          </ListItem>
          
          <ListItem>
            <ListItemText primary="4. Click 'Upscale Image' button (costs 1 credit)" />
          </ListItem>
          
          <ListItem>
            <ListItemText primary="5. Save the upscaled image" />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        

        
        <Typography variant="subtitle1" gutterBottom>
          Important Notes:
        </Typography>

        <Typography variant="body2" paragraph>
          • The save image button saves the new image to your Ecommander account. It does not update your Shopify or WooCommerce store. This is because images cannot be uploaded over their API. When you save a product, Ecommander creates a running record of upscaled image products, which you can download as a CSV for bulk uploading in your store
        </Typography>        
        
        <Typography variant="body2" paragraph>
          • Image size must be 1024×1024 pixels or smaller for upscaling.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Each upscale operation costs 1 credit.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • The "View Image" button opens the full-size image in a new tab.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • Modified products will appear in the CSV export list at the bottom of the page.
        </Typography>
        
        <Button
          variant="outlined"
          onClick={toggleDrawer(false)}
          fullWidth
          sx={{ mt: 2 }}
        >
          Close
        </Button>
      </Box>
    </Drawer>
  );
} 