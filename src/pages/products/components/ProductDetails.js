import * as React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

export default function ProductDetails({ product, setProduct }) {
  const handleNameChange = (event) => {
    const updatedProduct = { ...product, name: event.target.value };
    setProduct(updatedProduct);
  };

  return (
    <Box>
      <TextField
        label="Name"
        value={product?.name || ''}
        fullWidth
        margin="normal"
        InputProps={{
          readOnly: false,
        }}
        onChange={handleNameChange}
        sx={{ mb: 5 }} // Add 40px margin between the name row and the description
      />
    </Box>
  );
}