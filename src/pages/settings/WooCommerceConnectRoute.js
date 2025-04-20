import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase';
import { CircularProgress, Box, Typography, Button, Alert, Stack } from '@mui/material';
import { useBrand } from '../../contexts/BrandContext';

const API_URL = process.env.REACT_APP_API_URL;

export default function WooCommerceConnectRoute() {
  const [user, loading] = useAuthState(auth);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('loading');
  const { activeBrandId } = useBrand();

  // Debug information
  const [debug, setDebug] = useState({
    userChecked: false,
    brandChecked: false,
    paramsChecked: false,
    connectionAttempted: false,
    connectionResponse: null
  });

  useEffect(() => {
    const connect = async () => {
      // Check if we have a user
      if (!user) {
        setDebug(prev => ({ ...prev, userChecked: true }));
        return;
      }

      // Check if we have a brand
      if (!activeBrandId) {
        console.error('WooCommerce connect error: No active brand selected');
        setError('No brand selected. Please select a brand before connecting WooCommerce.');
        setConnectionStatus('error');
        setDebug(prev => ({ ...prev, brandChecked: true }));
        return;
      }

      // Get connection parameters
      const storeUrl = params.get('store');
      const apiId = params.get('key');
      const secretKey = params.get('secret');

      if (!storeUrl || !apiId || !secretKey) {
        console.error('WooCommerce connect error: Missing params', { 
          storeUrl, 
          apiId, 
          secretKey: secretKey ? '[REDACTED]' : null 
        });
        setError('Missing required parameters.');
        setConnectionStatus('error');
        setDebug(prev => ({ ...prev, paramsChecked: true }));
        return;
      }

      setDebug(prev => ({ ...prev, paramsChecked: true }));

      try {
        console.log('WooCommerce connect: Attempting connection with params', { 
          storeUrl, 
          hasApiId: !!apiId, 
          hasSecretKey: !!secretKey,
          userId: user.uid,
          brandId: activeBrandId
        });
        
        setDebug(prev => ({ ...prev, connectionAttempted: true }));
        const idToken = await user.getIdToken();

        const res = await fetch(`${API_URL}/woocommerce/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify({
            storeUrl,
            apiId,
            secretKey,
            userId: user.uid,
            brandId: activeBrandId
          }),
        });

        const data = await res.json();
        console.log('WooCommerce connect response:', data);
        setDebug(prev => ({ ...prev, connectionResponse: data }));

        if (data.result === 'Success') {
          setConnectionStatus('success');
          // Wait 2 seconds before redirecting to give user a chance to see success message
          setTimeout(() => {
            const redirectPath = params.get('redirect') || '/settings';
            navigate(redirectPath);
          }, 2000);
        } else {
          console.error('WooCommerce connect failed:', data);
          setError(data.message || 'Connection failed.');
          setConnectionStatus('error');
        }
      } catch (err) {
        console.error('Error during connection:', err);
        setError('Something went wrong while connecting.');
        setConnectionStatus('error');
      }
    };

    if (!loading) {
      setDebug(prev => ({ ...prev, userChecked: true }));
      if (user) connect();
    }
  }, [loading, user, params, navigate, activeBrandId]);

  const goToSettings = () => {
    navigate('/settings');
  };

  return (
    <Box sx={{ textAlign: 'center', mt: 10, maxWidth: '500px', mx: 'auto', p: 3 }}>
      {connectionStatus === 'loading' ? (
        <>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Connecting your WooCommerce store…
          </Typography>
        </>
      ) : connectionStatus === 'success' ? (
        <Stack spacing={2}>
          <Alert severity="success">
            Your WooCommerce store was connected successfully!
          </Alert>
          <Typography variant="body2" my={2}>
            Redirecting to settings...
          </Typography>
          <Button variant="contained" onClick={goToSettings}>
            Go to Settings
          </Button>
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Alert severity="error">{error || 'Connection failed'}</Alert>
          <Typography variant="body2" my={2}>
            Unable to connect your WooCommerce store. Please check your credentials and try again.
          </Typography>
          <Button variant="contained" onClick={goToSettings}>
            Back to Settings
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Box mt={4} p={2} border="1px solid #eee" borderRadius={1} textAlign="left">
              <Typography variant="caption" component="pre" sx={{ overflowX: 'auto' }}>
                Debug info: {JSON.stringify(debug, null, 2)}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </Box>
  );
}
