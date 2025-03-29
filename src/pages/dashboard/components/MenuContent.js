import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import AnalyticsRoundedIcon from '@mui/icons-material/AnalyticsRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import AssignmentRoundedIcon from '@mui/icons-material/AssignmentRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const mainListItems = [
  { text: 'Home', icon: <HomeRoundedIcon />, link: '/dashboard' },
  { text: 'Product Descriptions', icon: <AnalyticsRoundedIcon />, link: '/products' },
  { text: 'Product Translations', icon: <AssignmentRoundedIcon />, link: '/translations' },
  { text: 'Content Strategy', icon: <AssignmentRoundedIcon />, link: '/strategy' },
  { text: 'Content Creation', icon: <AssignmentRoundedIcon />, link: '/creation' },
];

const secondaryListItems = [
  { text: 'Brand Strategy', icon: <PeopleRoundedIcon />, link: '/brand-strategy' },
  { text: 'Brand Settings', icon: <PeopleRoundedIcon />, link: '/brandsettings' },
  { text: 'Integrations', icon: <SettingsRoundedIcon />, link: '/settings' },
  { text: 'About', icon: <InfoRoundedIcon /> },
  { text: 'Feedback', icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [credits, setCredits] = React.useState(0);

  React.useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      // Set up a real-time listener for credits changes
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setCredits(doc.data().credits || 0);
        }
      });

      // Cleanup the listener when component unmounts
      return () => unsubscribe();
    }
  }, [user]);

  return (
    <Stack sx={{ flexGrow: 1, p: 1, justifyContent: 'space-between' }}>
      <List dense>
        {mainListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={item.link ? Link : 'div'}
              to={item.link}
              selected={location.pathname === item.link}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List dense>
        {secondaryListItems.map((item, index) => (
          <ListItem key={index} disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={item.link ? Link : 'div'}
              to={item.link}
              selected={location.pathname === item.link}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        <ListItem sx={{ display: 'block', py: 1 }}>
          <Chip
            icon={<AutoAwesomeIcon />}
            label={`${credits} credits left`}
            color="primary"
            variant="outlined"
            size="large"
            sx={{ 
              width: '100%',
              borderColor: 'primary.main',
              '& .MuiChip-label': {
                px: 1,
              }
            }}
          />
        </ListItem>        
      </List>
    </Stack>
  );
}
