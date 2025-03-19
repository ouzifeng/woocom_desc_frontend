import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Instructions({ drawerOpen, toggleDrawer }) {
  return (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box sx={{ width: 400, p: 2 }}>
        <Typography variant="h6">Instructions</Typography>
        <Typography variant="body2">
          Here you can find instructions on how to use this page.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          1. Use the "Import All Products" button to import products from WooCommerce.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          2. Use the "Update All Products" button to update existing products.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          3. Use the "Import New Products" button to import new products.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          4. Use the "Delete" button to delete selected products.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          5. Click on a product row to open the product details in a new tab.
        </Typography>
      </Box>
    </Drawer>
  );
}
