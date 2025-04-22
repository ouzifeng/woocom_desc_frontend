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
import MenuContent from './MenuContent';
import OptionsMenu from './OptionsMenu';
import PropTypes from 'prop-types';
import Tooltip from '@mui/material/Tooltip';

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

const DrawerHeader = styled('div')(({ theme, open }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: open ? 'space-between' : 'center',
  padding: open ? theme.spacing(0, 1) : theme.spacing(1, 0),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  position: 'relative',
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

export default function SideMenu({ user = null }) {
  const [open, setOpen] = React.useState(true);

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  return (
    <Drawer variant="permanent" open={open}>
      <DrawerHeader open={open}>
        {open ? (
          <>
            <Box 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                flex: 1,
              }}
            >
              <Box
                component="img"
                src="/ecommander_logo.png"
                alt="eCommander Logo"
                sx={{
                  height: '35px',
                  width: '150px',
                  objectFit: 'contain',
                  ml: 1,
                }}
              />
            </Box>
            <IconButton onClick={handleDrawerToggle}>
              <MenuIcon />
            </IconButton>
          </>
        ) : (
          <>
            <IconButton 
              onClick={handleDrawerToggle}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                padding: 0.5,
              }}
            >
              <MenuIcon />
            </IconButton>
          </>
        )}
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
            <Tooltip title={user?.email}>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '120px',
                  display: 'block', // Adjust as needed
                }}
              >
                {user?.email}
              </Typography>
            </Tooltip>
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
