import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import FormLabel from '@mui/material/FormLabel';
import FormControl from '@mui/material/FormControl';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import MuiCard from '@mui/material/Card';
import { styled } from '@mui/material/styles';
import AppTheme from '../shared-theme/AppTheme';
import ColorModeSelect from '../shared-theme/ColorModeSelect';
import { GoogleIcon } from './components/CustomIcons';
import { auth } from '../../firebase';
import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useToast } from '../../components/ToasterAlert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


const Card = styled(MuiCard)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  [theme.breakpoints.up('sm')]: {
    width: '450px',
  },
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

const SignUpContainer = styled(Stack)(({ theme }) => ({
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

export default function SignUp(props) {
  const [emailError, setEmailError] = React.useState(false);
  const [emailErrorMessage, setEmailErrorMessage] = React.useState('');
  const [passwordError, setPasswordError] = React.useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [nameError, setNameError] = React.useState(false);
  const [nameErrorMessage, setNameErrorMessage] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState(false);
  const [confirmPasswordErrorMessage, setConfirmPasswordErrorMessage] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const navigate = useNavigate();
  const db = getFirestore();
  const { showToast } = useToast();

  const validateInputs = () => {
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const name = document.getElementById('name');

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

    if (!name.value || name.value.length < 1) {
      setNameError(true);
      setNameErrorMessage('Name is required.');
      isValid = false;
    } else {
      setNameError(false);
      setNameErrorMessage('');
    }

    if (password.value !== confirmPassword) {
      setConfirmPasswordError(true);
      setConfirmPasswordErrorMessage('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError(false);
      setConfirmPasswordErrorMessage('');
    }

    return isValid;
  };

  // Add this function to send user data to Brevo
  const addUserToBrevo = async (userEmail, userFirstName) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/brevo/add-contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          firstName: userFirstName,
          lastName: '',
          brandName: 'Brand 1'
        }),
      });
      
      const data = await response.json();
      console.log('User added to Brevo:', data);
    } catch (error) {
      // Don't block the signup process if Brevo fails
      console.error('Error adding user to Brevo:', error);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('Google user created:', user.uid);

      // Create user document with more metadata
      await setDoc(doc(db, 'users', user.uid), {
        firstName: user.displayName,
        email: user.email,
        avatar: user.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        credits: 10
      });

      // Create their first brand with unique ID (timestamp + first 4 chars of UID)
      const brandId = `brand_${Date.now()}_${user.uid.substring(0, 4)}`;
      const brandRef = doc(db, `users/${user.uid}/brands/${brandId}`);
      await setDoc(brandRef, {
        name: 'Brand 1',
        ownerId: user.uid,
        createdAt: new Date(),
        // WooCommerce credentials are now at brand level
        wc_url: '',
        wc_key: '',
        wc_secret: ''
      });

      // Add user as member of their own brand
      const memberRef = doc(brandRef, `members/${user.uid}`);
      await setDoc(memberRef, {
        role: 'owner',
        email: user.email,
        displayName: user.displayName,
        joinedAt: new Date()
      });

      // Save the active brand ID to localStorage
      localStorage.setItem('activeBrandId', brandId);

      // Add user to Brevo
      await addUserToBrevo(user.email, user.displayName);

      console.log('Firestore documents created for Google user:', user.uid);

      navigate('/settings');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setEmailError(true);
        setEmailErrorMessage('Email already exists.');
        showToast('Email already exists.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError(true);
        setEmailErrorMessage('Invalid email address.');
        showToast('Invalid email address.', 'error');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError(true);
        setPasswordErrorMessage('Password is too weak.');
        showToast('Password is too weak.', 'error');
      } else if (error.code === 'auth/popup-closed-by-user') {
        showToast('Google sign-up was closed before completion.', 'warning');
      } else if (error.code === 'auth/popup-blocked') {
        showToast('Popup was blocked. Please allow popups and try again.', 'error');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        showToast('An account already exists with a different sign-up method.', 'error');
      } else {
        showToast('Google sign-up failed. Please try again.', 'error');
      }
      console.error('Error signing up with Google', error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (nameError || emailError || passwordError || confirmPasswordError) {
      return;
    }
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length > 0) {
        setEmailError(true);
        setEmailErrorMessage('Email already in use.');
        showToast('Email already in use.', 'error');
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('User created:', user.uid);

      // Create user document with more metadata
      await setDoc(doc(db, 'users', user.uid), {
        firstName: firstName,
        email: email,
        createdAt: new Date(),
        lastLogin: new Date(),
        credits: 10
      });

      // Create their first brand with unique ID (timestamp + first 4 chars of UID)
      const brandId = `brand_${Date.now()}_${user.uid.substring(0, 4)}`;
      const brandRef = doc(db, `users/${user.uid}/brands/${brandId}`);
      await setDoc(brandRef, {
        name: 'Brand 1',
        ownerId: user.uid,
        createdAt: new Date(),
        // WooCommerce credentials are now at brand level
        wc_url: '',
        wc_key: '',
        wc_secret: ''
      });

      // Add user as member of their own brand
      const memberRef = doc(brandRef, `members/${user.uid}`);
      await setDoc(memberRef, {
        role: 'owner',
        email: email,
        displayName: firstName,
        joinedAt: new Date()
      });

      // Save the active brand ID to localStorage
      localStorage.setItem('activeBrandId', brandId);

      // Add user to Brevo
      await addUserToBrevo(email, firstName);

      console.log('Firestore documents created for user:', user.uid);

      navigate('/settings');
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        setEmailError(true);
        setEmailErrorMessage('Email already exists.');
        showToast('Email already exists.', 'error');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError(true);
        setEmailErrorMessage('Invalid email address.');
        showToast('Invalid email address.', 'error');
      } else if (error.code === 'auth/weak-password') {
        setPasswordError(true);
        setPasswordErrorMessage('Password is too weak.');
        showToast('Password is too weak.', 'error');
      } else {
        showToast('Sign up failed. Please try again.', 'error');
      }
      console.error('Error signing up with email and password', error);
    }
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <ColorModeSelect sx={{ position: 'fixed', top: '1rem', right: '1rem' }} />
      <SignUpContainer direction="column" justifyContent="space-between">
        <Card variant="outlined">
          <img src="/ecommander_logo.png" alt="Ecommander Logo" style={{ width: '50%', alignSelf: 'center' }} />
          <Typography
            component="h1"
            variant="h4"
            sx={{ width: '100%', fontSize: 'clamp(2rem, 10vw, 2.15rem)' }}
          >
            Sign up
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <FormControl>
              <FormLabel htmlFor="name">First Name</FormLabel>
              <TextField
                autoComplete="name"
                name="name"
                required
                fullWidth
                id="name"
                placeholder="David"
                error={nameError}
                helperText={nameErrorMessage}
                color={nameError ? 'error' : 'primary'}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="email">Email</FormLabel>
              <TextField
                required
                fullWidth
                id="email"
                placeholder="your@email.com"
                name="email"
                autoComplete="email"
                variant="outlined"
                error={emailError}
                helperText={emailErrorMessage}
                color={emailError ? 'error' : 'primary'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="password">Password</FormLabel>
              <TextField
                required
                fullWidth
                name="password"
                placeholder="••••••"
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                variant="outlined"
                error={passwordError}
                helperText={passwordErrorMessage}
                color={passwordError ? 'error' : 'primary'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((show) => !show)}
                        edge="end"
                        size="small"
                        sx={{ p: 0.5 }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Password must be at least 6 characters long.
              </Typography>
            </FormControl>
            <FormControl>
              <FormLabel htmlFor="confirm-password">Confirm Password</FormLabel>
              <TextField
                required
                fullWidth
                name="confirm-password"
                placeholder="••••••"
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirm-password"
                autoComplete="new-password"
                variant="outlined"
                error={confirmPasswordError}
                helperText={confirmPasswordErrorMessage}
                color={confirmPasswordError ? 'error' : 'primary'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirmPassword((show) => !show)}
                        edge="end"
                        size="small"
                        sx={{ p: 0.5 }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              onClick={validateInputs}
            >
              Sign up
            </Button>
          </Box>
          <Divider>
            <Typography sx={{ color: 'text.secondary' }}>or</Typography>
          </Divider>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleGoogleSignUp}
              startIcon={<GoogleIcon />}
            >
              Sign up with Google
            </Button>
            <Typography sx={{ textAlign: 'center' }}>
              Already have an account?{' '}
              <Link
                href="/sign-in"
                variant="body2"
                sx={{ alignSelf: 'center' }}
              >
                Sign in
              </Link>
            </Typography>
          </Box>
        </Card>
      </SignUpContainer>
    </AppTheme>
  );
}
