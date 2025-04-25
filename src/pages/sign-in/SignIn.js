import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import CssBaseline from '@mui/material/CssBaseline';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import ForgotPassword from './components/ForgotPassword';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { GoogleIcon } from './components/CustomIcons';
import { auth, googleProvider, db } from '../../firebase';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, getDocs } from 'firebase/firestore';
import { useToast } from '../../components/ToasterAlert';

const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignInContainer = styled(Stack)(({ theme }) => ({
  height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
  minHeight: '100%',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  '&::before': {
    content: '""',
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    inset: 0,
    backgroundImage:
      'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
    backgroundRepeat: 'no-repeat',
    ...theme.applyStyles('dark', {
      backgroundImage:
        'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
    }),
  },
}));

export default function SignIn(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Function to load user's first brand and set in localStorage
  const loadUserBrands = async (userId) => {
    try {
      const brandsRef = collection(db, `users/${userId}/brands`);
      const q = query(brandsRef);
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const brands = [];
        querySnapshot.forEach((doc) => {
          brands.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Set the first brand as active
        if (brands.length > 0) {
          localStorage.setItem('activeBrandId', brands[0].id);
          console.log('Set active brand ID:', brands[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading user brands:', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (emailError || passwordError) {
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Load user's brands and set active brand
      await loadUserBrands(user.uid);
      
      navigate('/dashboard');
    } catch (error) {
      // Firebase Auth error handling
      if (error.code === 'auth/user-not-found') {
        setEmailError(true);
        setEmailErrorMessage('No account found with this email.');
        showToast('No account found with this email.', 'error');
      } else if (error.code === 'auth/wrong-password') {
        setPasswordError(true);
        setPasswordErrorMessage('Incorrect password.');
        showToast('Incorrect password.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError(true);
        setEmailErrorMessage('Invalid email address.');
        showToast('Invalid email address.', 'error');
      } else if (error.code === 'auth/too-many-requests') {
        showToast('Too many failed attempts. Please try again later.', 'error');
      } else if (
        error.message === 'INVALID_LOGIN_CREDENTIALS' ||
        (error.error && error.error.message === 'INVALID_LOGIN_CREDENTIALS')
      ) {
        setEmailError(true);
        setPasswordError(true);
        setEmailErrorMessage('Invalid email or password.');
        setPasswordErrorMessage('Invalid email or password.');
        showToast('Invalid email or password.', 'error');
      } else if (error.code === 'auth/invalid-credential') {
        setEmailError(true);
        setPasswordError(true);
        setEmailErrorMessage('Invalid email or password.');
        setPasswordErrorMessage('Invalid email or password.');
        showToast('Invalid email or password.', 'error');
      } else {
        showToast('Sign in failed. Please try again.', 'error');
      }
      console.error('Error signing in with email and password', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Load user's brands and set active brand
      await loadUserBrands(user.uid);
      
      navigate('/dashboard');
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        showToast('Google sign-in was closed before completion.', 'warning');
      } else if (error.code === 'auth/popup-blocked') {
        showToast('Popup was blocked. Please allow popups and try again.', 'error');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showToast('An account already exists with a different sign-in method.', 'error');
      } else if (
        error.message === 'INVALID_LOGIN_CREDENTIALS' ||
        (error.error && error.error.message === 'INVALID_LOGIN_CREDENTIALS')
      ) {
        showToast('Invalid Google credentials. Please try again.', 'error');
      } else if (error.code === 'auth/invalid-credential') {
        showToast('Invalid Google credentials. Please try again.', 'error');
      } else {
        showToast('Google sign-in failed. Please try again.', 'error');
      }
      console.error('Error signing in with Google', error);
    }
  };

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');

    let isValid = true;

    if (!email.value || !/\S+@\S+\.\S+/.test(email.value)) {
      setEmailError(true);
      setEmailErrorMessage('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(false);
      setEmailErrorMessage('');
    }

    if (!password.value || password.value.length < 6) {
      setPasswordError(true);
      setPasswordErrorMessage('Password must be at least 6 characters long.');
      isValid = false;
    } else {
      setPasswordError(false);
      setPasswordErrorMessage('');
    }

    return isValid;
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <SignInContainer direction="column" justifyContent="space-between">
        <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
        <Card variant="outlined">
          <img src="/ecommander_logo.png" alt="Ecommander Logo" style={{ width: 135, height: 25, alignSelf: 'center' }} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              gap: 2,
            }}
          >
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                error={emailError}
                helperText={emailErrorMessage}
                id="email"
                type="email"
                name="email"
                placeholder="your@email.com"
                autoComplete="email"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={emailError ? 'error' : 'primary'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                error={passwordError}
                helperText={passwordErrorMessage}
                name="password"
                placeholder="••••••"
                type="password"
                id="password"
                autoComplete="current-password"
                autoFocus
                required
                fullWidth
                variant="outlined"
                color={passwordError ? 'error' : 'primary'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormControl>
            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />
            <ForgotPassword open={open} handleClose={handleClose} />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
            >
              Sign in
            </Button>
            <Link
              component="button"
              type="button"
              onClick={handleClickOpen}
              variant="body2"
              sx={{ alignSelf: 'center' }}
            >
              Forgot your password?
            </Link>
          </Box>
          <Divider>or</Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignIn}
              startIcon={<GoogleIcon />}
            >
              Sign in with Google
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignInContainer>
    </AppTheme>
  );
}
