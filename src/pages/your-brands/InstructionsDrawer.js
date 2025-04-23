import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function InstructionsDrawer({ open, onClose }) {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400, p: 2 } }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Brand Management Instructions</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        <ListItem>
          <ListItemText
            primary="What are Brands?"
            secondary={
              <Typography variant="body2" color="text.secondary">
                Brands represent separate business entities, stores, or product lines you manage within the app. Each brand has its own products, analytics, and settings. Switching brands changes the context for all dashboard features.
              </Typography>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Create a Brand"
            secondary={
              <Typography variant="body2" color="text.secondary">
                Click <b>Create New Brand</b> to add a new brand. You can have multiple brands for different businesses or stores.
              </Typography>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Switch Brands"
            secondary={
              <Typography variant="body2" color="text.secondary">
                Click <b>Switch to Brand</b> on any brand card to make it the active brand. The dashboard will update to show data for the selected brand.
              </Typography>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Edit Brand Name"
            secondary={
              <Typography variant="body2" color="text.secondary">
                Click the <b>Edit</b> icon on a brand card to rename your brand. Enter the new name and click <b>Save</b>.
              </Typography>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Delete a Brand"
            secondary={
              <Typography variant="body2" color="text.secondary">
                Click the <b>Delete</b> icon on a brand card (not available for the active brand) to remove a brand. <b>Warning:</b> This action is permanent and cannot be undone. All data for the brand will be lost.
              </Typography>
            }
          />
        </ListItem>
        <Divider sx={{ my: 1 }} />
        <ListItem>
          <ListItemText
            primary="Manage Members"
            secondary={
              <Typography variant="body2" color="text.secondary">
                Use <b>Manage Members</b> to invite or manage team members for each brand (feature coming soon).
              </Typography>
            }
          />
        </ListItem>
      </List>
    </Drawer>
  );
} 