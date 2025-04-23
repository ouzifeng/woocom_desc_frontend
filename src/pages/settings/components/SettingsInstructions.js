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
  Link
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
            secondary={
              <>
                <ol style={{ paddingLeft: 18 }}>
                  <li>Download the Ecommander WooCommerce plugin from the Integrations page.</li>
                  <li>Go to your WordPress admin &rarr; <strong>Plugins</strong> &rarr; <strong>Add New Plugin</strong>.</li>
                  <li>Click <strong>Upload Plugin</strong> and select the downloaded plugin file.</li>
                  <li>Click <strong>Activate</strong> after upload completes.</li>
                  <li>Find <strong>Ecommander</strong> in the left-hand WordPress menu and click it.</li>
                  <li>Follow the on-screen instructions. You will be redirected back to Ecommander and your WordPress store will be connected.</li>
                </ol>
              </>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Shopify Connection"
            secondary={
              <>
                <ol style={{ paddingLeft: 18 }}>
                  <li>Enter your Shopify store URL in the field provided.</li>
                  <li>You will be prompted to install the Ecommander app in Shopify.</li>
                  <li>Accept the permissions and connect the app.</li>
                  <li>You will be redirected back to Ecommander with your Shopify store connected.</li>
                </ol>
              </>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Google Analytics"
            secondary={
              <>
                <ol style={{ paddingLeft: 18 }}>
                  <li>Click the <strong>Connect Google Analytics</strong> button.</li>
                  <li>Follow the on-screen instructions to sign in and authorize access.</li>
                  <li>Once connected, choose your <strong>Account</strong> and then your <strong>Property</strong>.</li>
                  <li>Press <strong>Save</strong> to store your selection.</li>
                  <li>Optionally, press <strong>Test</strong> to verify the connection. The number of visitors in the last 24 hours will be shown.</li>
                </ol>
              </>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="CSV Import"
            secondary={
              <>
                <ol style={{ paddingLeft: 18 }}>
                  <li>Download the sample CSV file from the Import section.</li>
                  <li>Fill in your product data following the sample format.</li>
                  <li>Upload the completed CSV file to import your products into Ecommander.</li>
                </ol>
              </>
            }
          />
        </ListItem>
      </List>
    </Drawer>
  );
} 