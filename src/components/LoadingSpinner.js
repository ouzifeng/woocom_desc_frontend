import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha } from '@mui/material/styles';

export default function LoadingSpinner() {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.7),
        zIndex: (theme) => theme.zIndex.modal - 1,
      }}
    >
      <CircularProgress size={60} />
    </Box>
  );
} 