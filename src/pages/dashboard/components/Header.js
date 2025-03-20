import * as React from 'react';
import Stack from '@mui/material/Stack';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import CustomDatePicker from './CustomDatePicker';
import NavbarBreadcrumbs from './NavbarBreadcrumbs';
import MenuButton from './MenuButton';
import ColorModeIconDropdown from '../../shared-theme/ColorModeIconDropdown';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import Search from './Search';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function Header() {
  const [user] = useAuthState(auth);
  const [credits, setCredits] = React.useState(0);

  React.useEffect(() => {
    const fetchCredits = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCredits(userDoc.data().credits || 0);
          }
        } catch (error) {
          console.error('Error fetching user credits:', error);
        }
      }
    };
    fetchCredits();
  }, [user]);

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
      <Stack direction="row" sx={{ gap: 1 }}>
        <Chip
          icon={<AutoAwesomeIcon />}
          label={`${credits} credits left`}
          color="primary"
          variant="outlined"
          size="large"
          sx={{ 
            borderColor: 'primary.main',
            '& .MuiChip-label': {
              px: 1,
            }
          }}
        />
        <Search />
        <CustomDatePicker />
        <MenuButton showBadge aria-label="Open notifications">
          <NotificationsRoundedIcon />
        </MenuButton>
        <ColorModeIconDropdown />
      </Stack>
    </Stack>
  );
}
