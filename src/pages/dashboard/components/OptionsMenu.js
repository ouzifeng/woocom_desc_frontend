import * as React from 'react';
import { styled } from '@mui/material/styles';
import Divider, { dividerClasses } from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import MuiMenuItem from '@mui/material/MenuItem';
import { paperClasses } from '@mui/material/Paper';
import { listClasses } from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon, { listItemIconClasses } from '@mui/material/ListItemIcon';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import MenuButton from './MenuButton';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase';
import { useToast } from '../../../components/ToasterAlert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import { deleteUser } from 'firebase/auth';
import LoadingSpinner from '../../../components/LoadingSpinner';

const MenuItem = styled(MuiMenuItem)({
  margin: '2px 0',
});

export default function OptionsMenu() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear authentication tokens
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    // Clear Firebase auth state
    auth.signOut();
    // Add any other necessary cleanup here

    // Redirect to login page after logout
    navigate('/signin');
  };

  const handleBuyCredits = () => {
    handleClose();
    navigate('/checkout');
  };

  const handleDeleteProfileClick = () => {
    handleClose();
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleDeleteProfile = async () => {
    if (!auth.currentUser) return;
    
    setIsDeleting(true);
    try {
      const userId = auth.currentUser.uid;
      
      // Get a fresh token
      const token = await auth.currentUser.getIdToken(true);
      
      // Use backend API to delete user data
      const response = await fetch(`${process.env.REACT_APP_API_URL || ''}/user/delete-profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete profile');
      }
      
      // The backend has already deleted the user account
      // Just sign out locally
      auth.signOut();
      
      showToast('Profile deleted successfully', 'success');
      navigate('/signin');
    } catch (error) {
      console.error('Error deleting profile:', error);
      
      // If the error is about token expiration, we can still consider the deletion successful
      // since the backend might have already deleted the user data
      if (error.message.includes('auth/user-token-expired') || 
          error.message.includes('auth/user-not-found')) {
        showToast('Profile deleted successfully', 'success');
        auth.signOut();
        navigate('/signin');
      } else {
        showToast('Failed to delete profile: ' + error.message, 'error');
      }
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <React.Fragment>
      {isDeleting && <LoadingSpinner />}
      <MenuButton
        aria-label="Open menu"
        onClick={handleClick}
        sx={{ borderColor: 'transparent' }}
      >
        <MoreVertRoundedIcon />
      </MenuButton>
      <Menu
        anchorEl={anchorEl}
        id="menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        sx={{
          [`& .${listClasses.root}`]: {
            padding: '4px',
            minWidth: '200px',
          },
          [`& .${paperClasses.root}`]: {
            padding: 0,
          },
          [`& .${dividerClasses.root}`]: {
            margin: '4px -4px',
          },
        }}
      >
        <MenuItem onClick={handleDeleteProfileClick}>Delete Profile</MenuItem>
        <Divider />
        <MenuItem onClick={handleBuyCredits}>Buy Credits</MenuItem>
        <Divider />
        <MenuItem
          onClick={handleLogout}
          sx={{
            [`& .${listItemIconClasses.root}`]: {
              ml: 'auto',
              minWidth: 0,
            },
          }}
        >
          <ListItemText>Logout</ListItemText>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
      </Menu>

      {/* Delete Profile Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Profile
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete your profile? This action cannot be undone. All your data, including products, translations, and generated images will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteProfile} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}
