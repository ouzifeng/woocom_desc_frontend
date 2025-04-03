import * as React from 'react';
import { Box, Typography, Button, Card, Stack, Grid } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import { useToast } from '../../components/ToasterAlert';
import AppTheme from '../shared-theme/AppTheme';
import CssBaseline from '@mui/material/CssBaseline';
import AppNavbar from '../dashboard/components/AppNavbar';
import SideMenu from '../dashboard/components/SideMenu';
import Header from '../dashboard/components/Header';

export default function Checkout() {
  const [user] = useAuthState(auth);
  const { showToast } = useToast();

  const handlePurchase = async (amount, credits) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          amount,
          credits,
        }),
      });

      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const stripe = await window.Stripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);
      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        showToast(error.message, 'error');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      showToast('Failed to initiate checkout', 'error');
    }
  };

  const CreditPackage = ({ amount, credits, price }) => (
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
          boxShadow: 3
        }
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
          onClick={() => handlePurchase(amount, credits)}
        >
          Purchase Now
        </Button>
      </Box>
    </Card>
  );

  const creditPackages = [
    { amount: 500, credits: 50, price: 5 },
    { amount: 2000, credits: 200, price: 20 },
    { amount: 5000, credits: 500, price: 50 },
  ];

  return (
    <AppTheme>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu user={user} />
        <AppNavbar />
        {/* Main content */}
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
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Box sx={{ width: '100%', maxWidth: 1200, mt: 4 }}>
              <Typography variant="h4" gutterBottom align="center">
                Purchase Credits
              </Typography>
              <Typography variant="body1" gutterBottom align="center" sx={{ mb: 4 }}>
                Choose a credit package to continue using our services
              </Typography>
              
              <Grid container spacing={3} justifyContent="center">
                {creditPackages.map((pkg) => (
                  <Grid item xs={12} sm={6} md={4} key={pkg.credits}>
                    <CreditPackage {...pkg} />
                  </Grid>
                ))}
              </Grid>

              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center" 
                sx={{ mt: 4 }}
              >
                Secure payment powered by Stripe
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
