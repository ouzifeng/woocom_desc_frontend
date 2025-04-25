import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function AcceptInvite() {
  console.log('AcceptInvite page loaded');
  const [user, userLoading] = useAuthState(auth);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const [userExists, setUserExists] = useState(null);
  const query = useQuery();
  const inviteId = query.get('inviteId');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvite = async () => {
      if (!inviteId) {
        setError('No invite ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const inviteDoc = await getDoc(doc(db, 'brandInvites', inviteId));
        if (!inviteDoc.exists()) {
          setError('Invite not found.');
          console.log('[AcceptInvite] Invite not found for inviteId:', inviteId);
        } else {
          setInvite({ id: inviteDoc.id, ...inviteDoc.data() });
          console.log('[AcceptInvite] Invite fetched:', { id: inviteDoc.id, ...inviteDoc.data() });
        }
      } catch (e) {
        setError('Failed to fetch invite.');
        console.log('[AcceptInvite] Error fetching invite:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [inviteId]);

  // Check if invited email exists as a user
  useEffect(() => {
    const checkUserExists = async () => {
      if (invite && invite.invitedEmail) {
        console.log('[AcceptInvite] Checking if user exists for:', invite.invitedEmail);
        try {
          const res = await fetch(`${API_BASE_URL}/user/check-user-exists?email=${encodeURIComponent(invite.invitedEmail)}`);
          const data = await res.json();
          setUserExists(data.exists);
          console.log('[AcceptInvite] userExists result:', data.exists);
        } catch (e) {
          setUserExists(null);
          console.log('[AcceptInvite] Error checking user existence:', e);
        }
      }
    };
    if (!user && invite) checkUserExists();
  }, [invite, user]);

  // Auto-redirect for logged-out users
  useEffect(() => {
    if (!user && userExists !== null && invite) {
      console.log('[AcceptInvite] Auto-redirecting. userExists:', userExists, 'inviteId:', inviteId, 'email:', invite.invitedEmail);
      if (userExists) {
        navigate(`/sign-in?inviteId=${inviteId}&email=${encodeURIComponent(invite.invitedEmail)}`, { replace: true });
      } else {
        navigate(`/sign-up?inviteId=${inviteId}&email=${encodeURIComponent(invite.invitedEmail)}`, { replace: true });
      }
    }
  }, [user, userExists, invite, inviteId, navigate]);

  // Auto-accept invite for matching, pending invite after sign-up/sign-in
  useEffect(() => {
    if (
      user &&
      invite &&
      invite.invitedEmail === user.email &&
      invite.status === 'pending' &&
      !accepting &&
      !accepted
    ) {
      console.log('[AcceptInvite] Auto-accepting invite for user:', user.email);
      handleAccept();
    }
    // eslint-disable-next-line
  }, [user, invite]);

  // Debug: log state before rendering
  console.log('[AcceptInvite] Render state:', { invite, error, user, userExists, loading, userLoading });

  const handleAccept = async () => {
    if (!user || !invite) return;
    setAccepting(true);
    setAcceptError('');
    try {
      const res = await fetch(`${API_BASE_URL}/user/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId, userId: user.uid, userEmail: user.email, displayName: user.displayName })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAcceptError(data.error || 'Failed to accept invite');
      } else {
        setAccepted(true);
      }
    } catch (e) {
      setAcceptError('Failed to accept invite');
    } finally {
      setAccepting(false);
    }
  };

  if (loading || userLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={40} /></Box>;
  }

  if (error && !invite) {
    return <Alert severity="error" sx={{ mt: 4 }}>{error}</Alert>;
  }

  if (!invite) {
    return null;
  }

  // Not logged in: show spinner while redirecting
  if (!user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={40} /></Box>;
  }

  // If invite is not for this user
  if (invite.invitedEmail !== user.email) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, border: '1px solid #eee', borderRadius: 2 }}>
        <Alert severity="error">This invite is not for your email address.</Alert>
      </Box>
    );
  }

  // Already accepted (or just accepted)
  if (accepted) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, border: '1px solid #eee', borderRadius: 2 }}>
        <Alert severity="success">You have joined <b>{invite.brandName}</b>! Go to your dashboard to get started.</Alert>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
      </Box>
    );
  }

  // Show spinner while auto-accepting
  if (accepting && user && invite && invite.invitedEmail === user.email && invite.status === 'pending') {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={40} /></Box>;
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, border: '1px solid #eee', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Accept Brand Invite</Typography>
      <Typography gutterBottom>
        <b>{invite.inviterName}</b> has invited you to join <b>{invite.brandName}</b> on Ecommander.
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Your email: {invite.invitedEmail}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleAccept}
        disabled={accepting}
        sx={{ mt: 2 }}
      >
        {accepting ? <CircularProgress size={20} /> : 'Accept Invite'}
      </Button>
      {acceptError && <Alert severity="error" sx={{ mt: 2 }}>{acceptError}</Alert>}
    </Box>
  );
} 