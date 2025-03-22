import * as React from 'react';
import PropTypes from 'prop-types';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import OutlinedInput from '@mui/material/OutlinedInput';
import { auth } from '../../../firebase'; // Adjust the import path as necessary
import { sendPasswordResetEmail } from 'firebase/auth';
import Typography from '@mui/material/Typography'; // Import Typography for the success message

function ForgotPassword({ open, handleClose }) {
  const [email, setEmail] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState(''); // State for success message

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent!'); // Set success message
    } catch (error) {
      console.error('Error sending password reset email', error);
      setSuccessMessage('Failed to send password reset email. Please try again.'); // Handle error appropriately
    }
  };

  const handleCloseDialog = () => {
    handleClose();
    setSuccessMessage(''); // Clear success message when closing the dialog
  };

  return (
    <Dialog
      open={open}
      onClose={handleCloseDialog}
      slotProps={{
        paper: {
          component: 'form',
          onSubmit: handleSubmit,
          sx: { backgroundImage: 'none' },
        },
      }}
    >
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
      >
        <DialogContentText>
          Enter your account&apos;s email address, and we&apos;ll send you a link to
          reset your password.
        </DialogContentText>
        <OutlinedInput
          autoFocus
          required
          margin="dense"
          id="email"
          name="email"
          label="Email address"
          placeholder="Email address"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)} // Update email state
        />
        {successMessage && ( // Conditionally render the success message
          <Typography variant="body2" color="success.main" sx={{ mt: 2 }}>
            {successMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ pb: 3, px: 3 }}>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button variant="contained" type="submit">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ForgotPassword.propTypes = {
  handleClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

export default ForgotPassword;
