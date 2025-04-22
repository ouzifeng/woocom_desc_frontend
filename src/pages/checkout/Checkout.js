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

  const creditPackages = [
    { price: 1, credits: 10, bonus: 0 },
    { price: 5, credits: 50, bonus: 0 },
    { price: 20, credits: 200, bonus: 10 }, // 0.095c per credit
    { price: 50, credits: 500, bonus: 50 }, // 0.09c per credit
    { price: 100, credits: 1000, bonus: 150 }, // 0.086c per credit
  ];

  const CreditPackage = ({ price, credits, bonus }) => {
    const totalCredits = credits + bonus;
    const perCreditPrice = (price / totalCredits).toFixed(3);
    
    return (
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
        {bonus > 0 && (
          <Typography variant="h6" color="success.main" gutterBottom>
            +{bonus} Bonus Credits ({Math.round((bonus/credits)*100)}% Extra)
          </Typography>
        )}
        <Typography variant="h5" color="primary" gutterBottom>
          ${price}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ${perCreditPrice} per credit
        </Typography>
        <Box sx={{ mt: 'auto', pt: 2, width: '100%' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => handlePurchase(price, totalCredits)}
          >
            Purchase Now
          </Button>
        </Box>
      </Card>
    );
  };

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
