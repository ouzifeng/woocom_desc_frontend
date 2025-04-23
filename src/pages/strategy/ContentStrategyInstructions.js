import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function ContentStrategyInstructions({ open, onClose }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Content Strategy Instructions</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          <ListItem>
            <ListItemText
              primary="Overview"
              secondary="This page helps you generate a content strategy for your brand, including pillar, cluster, and supporting articles based on your saved keywords generated from the Keyword Research page."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Generate Content Strategy"
              secondary="Click 'Generate New Content Strategy' to create a new set of articles based on your saved keywords. It will create 1 pillar, 5 cluster and 5 supporting articles based on the pillar content. Press the '+' button next to the pillar article to see all the supporting articles."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Credits"
              secondary="Each content strategy generation uses 5 credits. This will cover 11 article titles."
            />
          </ListItem>          
          <ListItem>
            <ListItemText
              primary="Keywords"
              secondary="Click the 'Keywords' button to view all keywords being used for your content strategy."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Delete Content"
              secondary="Select rows and click 'Delete Selected' to remove articles or entire pillars (including all their clusters and articles)."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Navigation"
              secondary="Click on any row to view or edit the content for that article."
            />
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
} 