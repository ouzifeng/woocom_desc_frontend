import * as React from 'react';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export default function NavbarBreadcrumbs() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [productName, setProductName] = React.useState('');
  const pathnames = location.pathname.split('/').filter((x) => x);

  React.useEffect(() => {
    const fetchProductName = async () => {
      if (pathnames[0] === 'products' && pathnames[1] && user) {
        try {
          const productDoc = await getDoc(doc(db, 'users', user.uid, 'products', pathnames[1]));
          if (productDoc.exists()) {
            setProductName(productDoc.data().name);
          }
        } catch (error) {
          console.error('Error fetching product:', error);
        }
      }
    };

    fetchProductName();
  }, [pathnames, user]);

  return (
    <Breadcrumbs aria-label="breadcrumb">
      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;

        let displayName = value;
        if (value === 'products' && last) {
          displayName = 'Products';
        } else if (pathnames[0] === 'products' && index === 1) {
          displayName = productName || 'Loading...';
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
