import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function InstructionsDrawer({ drawerOpen, toggleDrawer }) {
  return (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box sx={{ width: 350, p: 2 }}>
        <Typography variant="h6">Instructions</Typography>
        <Typography variant="body2" sx={{ mb: 2 }}>
          This page allows you to view, edit and improve product descriptions
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>AI Description:</strong> Click this button to generate or improve your product description using AI. The AI will use your current name and description, brand guidelines, product image, SEO terms, and any additional requests you specify in the AI Settings panel. Each request consumes credit 1. 
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>AI Name:</strong> Use this to generate a compelling, brand-led product name using AI, based on your current product name, description and brand guidelines. This is a credit free feature.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Improve Grammar:</strong> This button will use AI to check and improve the grammar and clarity of your product description, making it more professional and readable. This is a credit free feature.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Save Product:</strong>This will save your changes to the connected store (WooCommerce or Shopify). Make sure your store is connected and credentials are valid. Only available for the platform your brand is connected to.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Instructions:</strong> Opens this drawer with detailed information about all available features and settings.
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>AI Settings:</strong> Use the panel on the right to customize how the AI generates content:
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li><strong>Use brand guidelines:</strong> Incorporate your brand's voice, style, and positioning into the AI output. Set your brand guidelines <a href="/brand-settings">here</a>.</li>
            <li><strong>Use product image:</strong> Let the AI analyze the product image for more context (if available).</li>
            <li><strong>Add SEO Terms:</strong> Specify keywords for the AI to include in the description for better search visibility.</li>
            <li><strong>Specify Word Count:</strong> Set a target or range for the description length.</li>
            <li><strong>Use emojis:</strong> Add emojis to the description for a more engaging tone.</li>
            <li><strong>Add specifications:</strong> Instruct the AI to include a specifications section in the description.</li>
            <li><strong>Additional requests:</strong> Provide any extra instructions or requirements for the AI to follow.</li>
          </ul>
        </Typography>
        <Typography variant="body2" sx={{ mt: 2 }}>
          <strong>Product Details & Editor:</strong> The main area lets you view and edit all product fields. Changes are only saved to your store when you click the Save button.
        </Typography>
      </Box>
    </Drawer>
  );
}
