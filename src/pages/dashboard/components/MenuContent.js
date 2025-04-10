import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import InventoryRoundedIcon from '@mui/icons-material/InventoryRounded';
import TranslateRoundedIcon from '@mui/icons-material/TranslateRounded';
import ArticleRoundedIcon from '@mui/icons-material/ArticleRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import Chip from '@mui/material/Chip';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import CreditCostsDrawer from './CreditCostsDrawer';

const mainListItems = [
  { text: 'Home', icon: <HomeRoundedIcon />, link: '/dashboard' },
  { text: 'Product Descriptions', icon: <InventoryRoundedIcon />, link: '/products' },
  { text: 'Product Translations', icon: <TranslateRoundedIcon />, link: '/translations' },
  { text: 'Content Strategy', icon: <ArticleRoundedIcon />, link: '/strategy' },
  { text: 'Keyword Research', icon: <SearchRoundedIcon />, link: '/keyword-research' },
  { text: 'Image Generation', icon: <ImageRoundedIcon />, link: '/image-creation' },
  { text: 'Stock Images', icon: <ImageRoundedIcon />, link: '/stock-images' },
];

const secondaryListItems = [
  { text: 'Brand Strategy', icon: <PeopleRoundedIcon />, link: '/brand-strategy' },
  { text: 'Brand Settings', icon: <BusinessRoundedIcon />, link: '/brand-settings' },
  { text: 'Integrations', icon: <SettingsRoundedIcon />, link: '/settings' },
  { text: 'Credit FAQ', icon: <InfoRoundedIcon /> },
  { text: 'Feedback', icon: <HelpRoundedIcon /> },
];

export default function MenuContent() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [credits, setCredits] = React.useState(0);
  const [creditCostsOpen, setCreditCostsOpen] = React.useState(false);

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

  // Function to handle opening the credit costs drawer
  const handleOpenCreditCosts = () => {
    setCreditCostsOpen(true);
  };

  return (
    <>
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
                onClick={item.text === 'Credit FAQ' ? handleOpenCreditCosts : undefined}
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
      <CreditCostsDrawer 
        open={creditCostsOpen} 
        onClose={() => setCreditCostsOpen(false)} 
      />
    </>
  );
}
