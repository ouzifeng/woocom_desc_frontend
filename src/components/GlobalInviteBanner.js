import React, { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useToast } from './ToasterAlert';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function GlobalInviteBanner() {
  const [user] = useAuthState(auth);
  const [pendingInvite, setPendingInvite] = useState(null);
  const [inviteActionLoading, setInviteActionLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    const fetchPendingInvite = async () => {
      if (!user) {
        setPendingInvite(null);
        return;
      }
      try {
        const invitesRef = collection(db, 'brandInvites');
        const q = query(invitesRef, where('invitedEmail', '==', user.email), where('status', '==', 'pending'));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          setPendingInvite({ id: docSnap.id, ...docSnap.data() });
        } else {
          setPendingInvite(null);
        }
      } catch (e) {
        setPendingInvite(null);
      }
    };
    fetchPendingInvite();
  }, [user]);

  const handleAcceptInvite = async () => {
    if (!pendingInvite || !user) return;
    setInviteActionLoading(true);
    setInviteError('');
    try {
      const res = await fetch(`${API_BASE_URL}/user/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteId: pendingInvite.id, userId: user.uid, userEmail: user.email, displayName: user.displayName })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setInviteError(data.error || 'Failed to accept invite');
      } else {
        setPendingInvite(null);
        showToast(`Invite Accepted. You can view ${pendingInvite.brandName} in the Your Brands page.`, 'success');
      }
    } catch (e) {
      setInviteError('Failed to accept invite');
    } finally {
      setInviteActionLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!pendingInvite || !user) return;
    setInviteActionLoading(true);
    setInviteError('');
    try {
      // Update invite status to declined in Firestore
      await updateDoc(doc(db, 'brandInvites', pendingInvite.id), {
        status: 'declined',
        declinedAt: new Date()
      });
      setPendingInvite(null);
      showToast('Invite Declined.', 'info');
    } catch (e) {
      setInviteError('Failed to decline invite');
    } finally {
      setInviteActionLoading(false);
    }
  };

  if (!user || !pendingInvite) return null;

  return (
    <Stack sx={{ width: '100%', position: 'fixed', top: 0, zIndex: 2000 }}>
      <Alert
        severity="info"
        action={
          <>
            <Button color="primary" size="small" onClick={handleAcceptInvite} disabled={inviteActionLoading}>
              Accept
            </Button>
            <Button color="inherit" size="small" onClick={handleDeclineInvite} disabled={inviteActionLoading}>
              Decline
            </Button>
          </>
        }
      >
        You have been invited to join <b>{pendingInvite.brandName}</b> by {pendingInvite.inviterName}.
        {inviteError && <span style={{ color: 'red', marginLeft: 8 }}>{inviteError}</span>}
      </Alert>
    </Stack>
  );
} 