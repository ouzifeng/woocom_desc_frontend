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
          How to Remove Image Backgrounds
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
            <ListItemText primary="3. Click 'Remove Background' button" />
          </ListItem>
          
          <ListItem>
            <ListItemText primary="4. Optionally add a new background colour or adjust the shadow settings" />
          </ListItem>
          
          <ListItem>
            <ListItemText primary="5. Save the processed image to replace the product image (costs 1 credit). Credits are only used once the save image button is pressed, not when the background is removed " />
          </ListItem>
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          Important Notes:
        </Typography>

        <Typography variant="body2" paragraph>
          • Each save operation costs 1 credit.
        </Typography>        
        
        <Typography variant="body2" paragraph>
          • The background removal process is automatic and uses AI to detect the product. We use the most advanced AI background removal technology to date, but in cases where the image is complicated, the results might not be perfect. This is why we only charge on save image, not remove background. There is the option to upload and try an alternative image instead in the "Upload New" tab.
        </Typography>

        <Typography variant="body2" paragraph>
          • The save image button saves the new image to your Ecommander account. It does not update your Shopify or WooCommerce store. This is because images cannot be uploaded over their API. When you save a product, Ecommander creates a running record of upscaled image products, which you can download as a CSV for bulk uploading in your store
        </Typography>               
        
        
        <Typography variant="body2" paragraph>
          • You can choose a transparent background or add a solid color background.
        </Typography>
        
        <Typography variant="body2" paragraph>
          • The shadow feature adds depth to your product images.
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