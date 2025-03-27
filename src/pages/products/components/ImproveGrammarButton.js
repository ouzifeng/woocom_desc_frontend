import * as React from 'react';
import { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

const API_URL = process.env.REACT_APP_API_URL;

console.log('API_URL:', API_URL);

export default function ImproveGrammarButton({ description, setDescription, setNotificationMessage }) {
  const [loading, setLoading] = useState(false);

  const handleImproveGrammar = async () => {
    setLoading(true);
    setNotificationMessage('Improving grammar');

    // Start the loading dots animation in the notification
    const interval = setInterval(() => {
      setNotificationMessage(prev => {
        const baseMessage = 'Improving grammar';
        const dots = prev.slice(baseMessage.length);
        const newDots = dots.length < 3 ? dots + '.' : '';
        return baseMessage + newDots;
      });
    }, 500);

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
      clearInterval(interval);
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

