import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function Instructions({ drawerOpen, toggleDrawer }) {
  return (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box sx={{ width: 400, p: 2 }}>
        <Typography variant="h6">Instructions</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          This page allows you to manage your store's products. The features below work with any supported e-commerce platform (e.g., WooCommerce, Shopify).
        </Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          <strong>If no store connection is detected:</strong> You will not be able to import, update, or manage products. Please connect your store in the Integrations or Settings section to enable product management features.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Import All Products:</strong> This will import <u>all products</u> from your connected store into the dashboard, including both new and existing products. It also deletes any exsiting products from your Ecommander account before running. Use this if you want to fully sync your product catalog.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Import New Products:</strong> This will import only <u>products that are not already present</u> in the dashboard. Use this to add new products from your store without affecting existing ones.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Update All Products:</strong> This will update <u>all existing products</u> in the dashboard with the latest data from your store (such as price, stock, or description changes). No new products will be added.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Delete:</strong> Use this to remove selected products from the dashboard. This does <u>not</u> delete products from your store, only from your Ecommander account.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Product Details:</strong> Click on a product row to open detailed information about that product in a new tab.
        </Typography>
      </Box>
    </Drawer>
  );
}
