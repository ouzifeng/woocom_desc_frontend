import * as React from 'react';
import { Box, Typography, Button, Card, Stack, Grid, CssBaseline } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { useToast } from '../../components/ToasterAlert';
import AppTheme from '../shared-theme/AppTheme';
import AppNavbar from '../dashboard/components/AppNavbar';
import SideMenu from '../dashboard/components/SideMenu';
import Header from '../dashboard/components/Header';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function Checkout() {
  const [user] = useAuthState(auth);
  const { showToast } = useToast();

  const handlePurchase = async (price, credits) => {
    try {
      const token = await user.getIdToken();

      const res = await fetch(`${API_BASE_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.uid,
          price,     // price in dollars
          credits,
        }),
      });

      const { sessionId } = await res.json();
      const stripe = await stripePromise;

      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        showToast(error.message, 'error');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showToast('Failed to initiate checkout', 'error');
    }
  };

  const CreditPackage = ({ price, credits }) => (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100%',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Typography variant="h4" gutterBottom>
        {credits} Credits
      </Typography>
      <Typography variant="h5" color="primary" gutterBottom>
        ${price}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        ${(price / credits).toFixed(2)} per credit
      </Typography>
      <Box sx={{ mt: 'auto', pt: 2, width: '100%' }}>
        <Button
          variant="contained"
          fullWidth
          onClick={() => handlePurchase(price, credits)}
        >
          Purchase Now
        </Button>
      </Box>
    </Card>
  );

  const creditPackages = [
    { price: 5, credits: 50 },
    { price: 20, credits: 200 },
    { price: 50, credits: 500 },
  ];

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu user={user} />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : theme.palette.background.default,
            overflow: 'auto',
          })}
        >
          <Stack spacing={2} sx={{ alignItems: 'center', mx: 3, pb: 5, mt: { xs: 8, md: 0 } }}>
            <Header />
            <Box sx={{ width: '100%', maxWidth: 1200, mt: 4 }}>
              <Typography variant="h4" gutterBottom align="center">
                Purchase Credits
              </Typography>
              <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                Choose a credit package to continue using our services
              </Typography>

              <Grid container spacing={3} justifyContent="center">
                {creditPackages.map((pkg) => (
                  <Grid item xs={12} sm={6} md={4} key={pkg.credits}>
                    <CreditPackage {...pkg} />
                  </Grid>
                ))}
              </Grid>

              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                Secure payment powered by Stripe
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
