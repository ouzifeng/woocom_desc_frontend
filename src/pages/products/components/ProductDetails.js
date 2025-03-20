import * as React from 'react';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

/** A helper that decodes HTML entities */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

/** A helper that encodes HTML entities */
function encodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.textContent = text;
  return textarea.innerHTML;
}

export default function ProductDetails({ product, setProduct }) {
  const handleNameChange = (event) => {
    const encodedName = encodeHtmlEntities(event.target.value);
    const updatedProduct = { ...product, name: encodedName };
    setProduct(updatedProduct);
  };

  return (
    <Box>
      <TextField
        label="Name"
        value={decodeHtmlEntities(product?.name || '')}
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