import React from 'react';
import { Box, Button, TextField, Typography, Paper, CircularProgress } from '@mui/material';

export const ImageDescription = ({ 
  description, 
  setDescription, 
  onGenerate, 
  isLoading 
}) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Image Description
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Describe in detail what kind of image you want to generate
      </Typography>

      <TextField
        fullWidth
        multiline
        variant="outlined"
        placeholder="Example: 'To empower busy parents by delivering healthy, convenient meal options, while minimizing environmental impact.'"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={isLoading}
        sx={{
          '& .MuiInputBase-root': {
            padding: '12px 16px',
            height: 'auto'
          },
          '& .MuiInputBase-input': {
            padding: '0',
            height: 'auto !important',
            minHeight: '120px'
          },
          '& textarea': {
            overflow: 'hidden !important',
            resize: 'none',
            height: 'auto !important',
            boxSizing: 'border-box',
            padding: '16px !important'
          }
        }}
      />

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          onClick={onGenerate}
          disabled={isLoading || !description.trim()}
          startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {isLoading ? 'Generating...' : 'Generate Image'}
        </Button>
      </Box>
    </Paper>
  );
}; 