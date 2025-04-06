import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase';
import { CircularProgress, Box, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;

export default function WooCommerceConnectRoute() {
  const [user, loading] = useAuthState(auth);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const connect = async () => {
      if (!user) return;

      const storeUrl = params.get('store');
      const apiId = params.get('key');
      const secretKey = params.get('secret');

      if (!storeUrl || !apiId || !secretKey) {
        setError('Missing required parameters.');
        return;
      }

      try {
        const idToken = await user.getIdToken();

        const res = await fetch(`${API_URL}/woocommerce/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            storeUrl,
            apiId,
            secretKey,
            userId: user.uid,
          }),
        });

        const data = await res.json();

        if (data.result === 'Success') {
          navigate('/settings');
        } else {
          setError(data.message || 'Connection failed.');
        }
      } catch (err) {
        console.error('Error during connection:', err);
        setError('Something went wrong while connecting.');
      }
    };

    if (!loading && user) connect();
  }, [loading, user, params, navigate]);

  return (
    <Box sx={{ textAlign: 'center', mt: 10 }}>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Connecting your WooCommerce store…
          </Typography>
        </>
      )}
    </Box>
  );
}
