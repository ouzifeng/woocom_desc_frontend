import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function ContentPageInstructions({ open, onClose }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Content Page Instructions</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          <ListItem>
            <ListItemText
              primary="Overview"
              secondary="This page allows you to generate, edit, and analyze long-form content for your selected topic or outline."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Generate Outline"
              secondary="Click 'Generate Outline' to create a detailed structure for your article. You can edit the outline in the editor before generating content."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Generate Content"
              secondary="Click 'Generate Content' to create a full article based on the current outline. This will use 5 credits. The content will follow your outline and brand guidelines."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Save"
              secondary="Click 'Save' to store your current content. You can edit and save as many times as you like."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Analyze Content"
              secondary="Click 'Analyze Content' to get a meta description and keyword analysis for your article."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Images"
              secondary="Our AI model for content does not generate images, but you can search our millions of stock images for suitable imagery in the Stock Images tab. Or create our own images in the Image Generation tab."
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 