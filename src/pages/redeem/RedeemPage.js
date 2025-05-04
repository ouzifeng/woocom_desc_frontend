import * as React from 'react';
import { useState } from 'react';
import { Box, Typography, Button, TextField, Card, Paper, Stack, Grid, CssBaseline, Alert } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { useToast } from '../../components/ToasterAlert';
import AppTheme from '../shared-theme/AppTheme';
import AppNavbar from '../dashboard/components/AppNavbar';
import SideMenu from '../dashboard/components/SideMenu';
import Header from '../dashboard/components/Header';
import LoadingSpinner from '../../components/LoadingSpinner';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export default function RedeemPage() {
  const [user, userLoading] = useAuthState(auth);
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tierDetails, setTierDetails] = useState(null);
  const { showToast } = useToast();

  // Handle coupon code redemption
  const handleRedeemCode = async (e) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setError('Please enter a valid coupon code');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      // Format code properly (in case user entered it without dashes)
      const formattedCode = couponCode.trim().toUpperCase();
      
      // 1. Check if code exists in Firestore
      const couponRef = doc(db, 'coupons', formattedCode);
      const couponSnap = await getDoc(couponRef);
      
      if (!couponSnap.exists()) {
        setError('Invalid coupon code. Please check the code and try again.');
        setLoading(false);
        return;
      }
      
      const couponData = couponSnap.data();
      
      // 2. Check if code is already redeemed
      if (couponData.isRedeemed) {
        setError('This coupon code has already been redeemed.');
        setLoading(false);
        return;
      }
      
      // 3. Get tier details
      const tierRef = doc(db, 'tiers', couponData.tierId);
      const tierSnap = await getDoc(tierRef);
      
      if (!tierSnap.exists()) {
        setError('Error: Tier not found. Please contact customer support.');
        setLoading(false);
        return;
      }
      
      const tierData = tierSnap.data();
      
      // Determine credit amount based on tier
      let creditAmount = 0;
      
      // Map of tier IDs to credit amounts (matching backend logic)
      const TIER_CREDITS = {
        'tier1': 100,  // Basic tier: 100 credits
        'tier2': 250,  // Professional tier: 250 credits
        'tier3': 500,  // Business tier: 500 credits
        'tier4': 750,  // Enterprise tier: 750 credits
        'tier5': 1000, // Ultimate tier: 1000 credits
      };
      
      creditAmount = TIER_CREDITS[couponData.tierId] || 0;
      
      if (creditAmount === 0) {
        setError('Error determining credit amount. Please contact support.');
        setLoading(false);
        return;
      }
      
      // 4. Update the coupon to mark as redeemed
      await updateDoc(couponRef, {
        isRedeemed: true,
        redeemedBy: user.uid,
        redeemedAt: serverTimestamp()
      });
      
      // 5. Update the user's profile with the tier and add credits
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        setError('User profile not found. Please reload and try again.');
        setLoading(false);
        return;
      }
      
      const userData = userSnap.data();
      const currentCredits = userData.credits || 0;
      
      await updateDoc(userRef, { 
        appSumoTier: couponData.tierId,
        credits: currentCredits + creditAmount,
        lastCreditRefresh: serverTimestamp(),
        creditHistory: [
          ...(userData.creditHistory || []),
          {
            amount: creditAmount,
            type: 'appsumo_activation',
            timestamp: new Date().toISOString()
          }
        ]
      });
      
      // 6. Success!
      setTierDetails({
        tierName: tierData.displayName || tierData.name,
        creditAmount: creditAmount,
        tierLevel: couponData.tierId
      });
      
      showToast(`Successfully redeemed coupon for ${creditAmount} credits!`, 'success');
      setCouponCode('');
      
    } catch (err) {
      console.error('Error redeeming coupon:', err);
      showToast('Failed to redeem coupon. Please try again or contact support', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  if (userLoading) return <LoadingSpinner />;
  
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
            <Box sx={{ width: '100%', maxWidth: 800, mt: 4 }}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                <Typography variant="h4" gutterBottom align="center">
                  Redeem AppSumo Code
                </Typography>
                <Typography variant="body1" align="center" sx={{ mb: 4 }}>
                  Enter your AppSumo purchase code to activate your tier and get access to credits
                </Typography>
                
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}
                
                {success && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                  </Alert>
                )}
                
                {tierDetails && (
                  <Card sx={{ mb: 4, p: 3, bgcolor: 'success.light' }}>
                    <Typography variant="h5" gutterBottom>
                      Congratulations! 
                    </Typography>
                    <Typography variant="body1" paragraph>
                      You've successfully activated <strong>{tierDetails.tierName}</strong>
                    </Typography>
                    <Typography variant="body1">
                      You've received <strong>{tierDetails.creditAmount} credits</strong> that you can start using right away.
                      You'll receive {tierDetails.creditAmount} credits each month automatically.
                    </Typography>
                  </Card>
                )}
                
                <form onSubmit={handleRedeemCode}>
                  <TextField
                    label="AppSumo Code"
                    variant="outlined"
                    fullWidth
                    placeholder="Enter your code (e.g., AS-XXXXX-XXXXX)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    sx={{ mb: 3 }}
                    disabled={loading}
                  />
                  
                  <Button
                    type="submit"
                    variant="contained" 
                    color="primary"
                    size="large"
                    fullWidth
                    disabled={loading || !couponCode.trim()}
                  >
                    {loading ? 'Redeeming...' : 'Redeem Code'}
                  </Button>
                </form>
              </Paper>
              
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 4 }}>
                If you're having trouble with your code, please contact AppSumo support or reach out to us directly.
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
} 