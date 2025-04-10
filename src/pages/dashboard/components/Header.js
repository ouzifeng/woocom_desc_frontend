import * as React from 'react';
import Stack from '@mui/material/Stack';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CustomDatePicker from './CustomDatePicker';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import Search from './Search';
import Weather from './Weather';
import { useStoreConnection } from '../../../contexts/StoreConnectionContext';

export default function Header() {
  const { connectedPlatform, hasGoogleAnalytics } = useStoreConnection();

  // Debug logs
  console.log('Connected Platform:', connectedPlatform);
  console.log('Has Google Analytics:', hasGoogleAnalytics);

  return (
    <Stack
      direction="row"
      sx={{
        display: { xs: 'none', md: 'flex' },
        width: '100%',
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        maxWidth: { sm: '100%', md: '1700px' },
        pt: 1.5,
      }}
      spacing={2}
    >
      <NavbarBreadcrumbs />
      <Stack direction="row" sx={{ gap: 1, alignItems: 'center' }}>
        <Search />
        {connectedPlatform === 'woocommerce' && (
          <img 
            src="/woocommerce-icon.png" 
            alt="WooCommerce" 
            style={{ 
              width: '36px', 
              height: '36px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '2px',
              opacity: '50%'
            }}
          />
        )}
        {connectedPlatform === 'shopify' && (
          <img 
            src="/shopify-icon.webp" 
            alt="Shopify" 
            style={{ 
              width: '36px', 
              height: '36px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '2px',
              opacity: '50%'
            }}
          />
        )}
        {hasGoogleAnalytics && (
          <img 
            src="/google_analytics_icon.png" 
            alt="Google Analytics" 
            style={{ 
              width: '36px', 
              height: '36px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              padding: '2px',
              opacity: '50%'
            }}
          />
        )}
        <Weather />
        <CustomDatePicker />
      </Stack>
    </Stack>
  );
}
