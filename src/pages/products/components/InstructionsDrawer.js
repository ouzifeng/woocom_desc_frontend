import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function InstructionsDrawer({ drawerOpen, toggleDrawer }) {
  return (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer(false)}>
      <Box sx={{ width: 250, p: 2 }}>
        <Typography variant="h6">Instructions</Typography>
        <Typography variant="body2">
          Here you can find instructions on how to use this page.
        </Typography>
      </Box>
    </Drawer>
  );
}
