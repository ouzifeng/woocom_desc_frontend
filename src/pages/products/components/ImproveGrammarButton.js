import * as React from 'react';
import { useState } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const API_URL = process.env.REACT_APP_API_URL;

console.log('API_URL:', API_URL);

export default function ImproveGrammarButton({ description, setDescription, setModalOpen }) {
  const [loading, setLoading] = useState(false);

  const handleImproveGrammar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/openai/improve-grammar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description }),
      });

      if (!response.ok) {
        throw new Error(`Backend API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.result === 'Success') {
        setDescription(data.improvedDescription);
        setModalOpen(true);
      } else {
        throw new Error('Failed to improve grammar');
      }
    } catch (error) {
      console.error('Error improving grammar:', error);
      alert('Failed to improve grammar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button variant="outlined" onClick={handleImproveGrammar} disabled={loading}>
        Improve Grammar
      </Button>
      {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
    </Box>
  );
}
