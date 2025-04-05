import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { CircularProgress, Box, Typography } from '@mui/material';

const API_URL = process.env.REACT_APP_API_URL;

export default function WooCommerceConnectRoute() {
  const [user, loading] = useAuthState(auth);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const connect = async () => {
      const storeUrl = params.get('store');
      const apiId = params.get('key');
      const secretKey = params.get('secret');

      if (!storeUrl || !apiId || !secretKey || !user) {
        return;
      }

      try {
        const idToken = await user.getIdToken();

        const res = await fetch(`${API_URL}/woocommerce/connect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            storeUrl,
            apiId,
            secretKey,
          }),
        });

        const data = await res.json();

        if (data.result === 'Success') {
          navigate('/settings');
        } else {
          console.error(data.message);
          navigate('/settings?error=connect_failed');
        }
      } catch (err) {
        console.error('Connection error:', err);
        navigate('/settings?error=server');
      }
    };

    if (!loading) connect();
  }, [loading, user, params, navigate]);

  return (
    <Box sx={{ textAlign: 'center', mt: 5 }}>
      <CircularProgress />
      <Typography variant="body2" sx={{ mt: 2 }}>
        Connecting your WooCommerce store...
      </Typography>
    </Box>
  );
}
