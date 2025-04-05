import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase';

const API_URL = process.env.REACT_APP_API_URL;

export default function WooConnectReceiver() {
  const [user, loading] = useAuthState(auth);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const connect = async () => {
      if (!user) return;

      const storeUrl = params.get('store');
      const apiId = params.get('key');
      const secretKey = params.get('secret');

      if (!storeUrl || !apiId || !secretKey) return;

      const idToken = await user.getIdToken();

      const res = await fetch(`${API_URL}/woocommerce/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeUrl,
          apiId,
          secretKey,
          userId: user.uid
        })
      });

      const data = await res.json();

      if (data.result === 'Success') {
        alert('WooCommerce connected!');
        navigate('/settings');
      } else {
        alert('Failed to connect: ' + data.message);
      }
    };

    if (!loading) connect();
  }, [loading, user, params]);

  return <p style={{ textAlign: 'center' }}>Connecting your WooCommerce store…</p>;
}
