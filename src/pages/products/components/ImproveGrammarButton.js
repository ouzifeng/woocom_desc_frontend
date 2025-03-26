import * as React from 'react';
import { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const API_URL = process.env.REACT_APP_API_URL;

console.log('API_URL:', API_URL);

export default function ImproveGrammarButton({ description, setDescription, setNotificationMessage }) {
  const [loading, setLoading] = useState(false);
  const [loadingDots, setLoadingDots] = useState('');
  const [timer, setTimer] = useState(null);

  const handleImproveGrammar = async () => {
    setLoading(true);
    setLoadingDots('');
    setNotificationMessage('Improving grammar...');

    let dotCount = 0;
    setTimer(setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      setLoadingDots('.'.repeat(dotCount));
    }, 500));

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
        setNotificationMessage("Product's grammar improved!");
      } else {
        throw new Error('Failed to improve grammar');
      }
    } catch (error) {
      console.error('Error improving grammar:', error);
      alert('Failed to improve grammar');
    } finally {
      setLoading(false);
      clearInterval(timer);
      setLoadingDots('');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button variant="outlined" onClick={handleImproveGrammar} disabled={loading}>
        Improve Grammar
      </Button>
    </Box>
  );
}

