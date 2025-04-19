import * as React from 'react';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [productName, setProductName] = React.useState('');
  const pathnames = location.pathname.split('/').filter((x) => x);

  // Removed direct Firestore access - we'll rely on parent components for this info
  // This prevents unnecessary permission errors in the console

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        let displayName = value;
        if (value === 'products' && last) {
          displayName = 'Products';
        } else if (pathnames[0] === 'products' && index === 1) {
          // Don't try to display product name, just show product ID
          const shortId = value.length > 8 ? value.substring(0, 8) + '...' : value;
          displayName = `Product ${shortId}`;
        } else {
          displayName = value.split('-').map(capitalizeFirstLetter).join(' ');
        }

        return last ? (
          <Typography color="text.primary" key={to}>
            {displayName}
          </Typography>
        ) : (
          <Link
            component={RouterLink}
            to={to}
            key={to}
            color="inherit"
            sx={{ 
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            {displayName}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
