// src/components/MaskEditor.js
import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

export default function MaskEditor({ imageUrl, apiUrl, onResult }) {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [processedUrl, setProcessedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Remove background (simplified approach)
  const handleRemoveBg = async () => {
    setLoading(true);
    setError(null);
    try {
      const idToken = user ? await user.getIdToken() : null;
      
      // Save the image to Firebase Storage first
      const saveRes = await fetch(`${apiUrl}/runware/save-user-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ imageUrl, brandId: activeBrandId, userId: user?.uid })
      });
      if (!saveRes.ok) throw new Error('Failed to save image: ' + saveRes.status);
      const saveData = await saveRes.json();
      const fbUrl = saveData.url;

      // Remove background using the Firebase Storage URL
      const res = await fetch(`${apiUrl}/runware/remove-background`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify({ imageUrl: fbUrl, brandId: activeBrandId, userId: user?.uid })
      });
      if (!res.ok) throw new Error('Failed to remove background: ' + res.status);
      const data = await res.json();
      setProcessedUrl(data.url);
      
      // Automatically set the result since we're not editing
      if (onResult) onResult(data.url);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {!processedUrl ? (
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleRemoveBg} 
          disabled={loading}
          fullWidth
          size="large"
          sx={{ height: 56 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
              Processing...
            </Box>
          ) : 'Remove Background'}
        </Button>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Display the result */}
          <Box sx={{ display: 'flex', gap: 3, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Original</Typography>
              <img src={imageUrl} alt="Original" style={{ maxWidth: 250, maxHeight: 250, border: '1px solid #ddd', borderRadius: 4 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>Background Removed</Typography>
              <img 
                src={processedUrl} 
                alt="Processed" 
                style={{ maxWidth: 250, maxHeight: 250, border: '1px solid #ddd', borderRadius: 4 }} 
              />
            </Box>
          </Box>
          
          {/* Reset button to try again */}
          <Button
            variant="outlined"
            onClick={() => setProcessedUrl(null)}
            sx={{ alignSelf: 'center' }}
          >
            Remove Background Again
          </Button>
        </Box>
      )}

      {error && (
        <Box sx={{ mt: 2, p: 2, bgcolor: '#ffebee', color: '#d32f2f', borderRadius: 1 }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}
    </Box>
  );
}
