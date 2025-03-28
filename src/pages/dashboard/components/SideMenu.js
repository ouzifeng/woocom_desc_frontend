import * as React from 'react';
import { styled } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import MuiDrawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Logo from '@mui/icons-material/Web'; // Placeholder logo icon
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import PropTypes from 'prop-types';

const drawerWidth = 240;

// Styled drawer for open state
const openedMixin = (theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

// Styled drawer for closed state
const closedMixin = (theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', // Changed to space-between for logo and menu
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    display: 'none', // Hide by default
    [theme.breakpoints.up('md')]: { // Show only on medium and larger screens
      display: 'block',
    },
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

export default function SideMenu({ user }) {
  const [open, setOpen] = React.useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            ml: open ? 1 : 'auto',
            mr: open ? 'auto' : 'auto'
          }}
        >
          <Logo 
            sx={{ 
              fontSize: 28, 
              color: 'primary.main',
              display: !open ? 'none' : 'block'
            }} 
          />
          {open && (
            <Typography 
              variant="h6" 
              sx={{ 
                ml: 1, 
                fontWeight: 'bold' 
              }}
            >
              YourApp
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleDrawerToggle}>
          <MenuIcon />
        </IconButton>
      </DrawerHeader>
      <Divider />
      <Box
        sx={{
          overflow: 'auto',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <MenuContent collapsed={!open} />
      </Box>
      {open ? (
        <Stack
          direction="row"
          sx={{
            p: 2,
            gap: 1,
            alignItems: 'center',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Avatar
            sizes="small"
            alt={user?.displayName}
            src={user?.photoURL}
            sx={{ width: 36, height: 36 }}
          />
          <Box sx={{ mr: 'auto' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: '16px' }}>
              {user?.displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email}
            </Typography>
          </Box>
          <OptionsMenu />
        </Stack>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <Avatar
            sizes="small"
            alt={user?.displayName}
            src={user?.photoURL}
            sx={{ width: 32, height: 32 }}
          />
        </Box>
      )}
    </Drawer>
  );
}

SideMenu.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    email: PropTypes.string,
    photoURL: PropTypes.string
  })
};

SideMenu.defaultProps = {
  user: null
};
