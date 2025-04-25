import React, { useEffect, useState } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { db, auth } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ManageMembersDrawer({ open, onClose, brand }) {
  const [user] = useAuthState(auth);
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState('idle'); // idle | loading | invited | error
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    if (!brand || !brand.ownerId) {
      setOwnerEmail('Unknown Owner');
      return;
    }
    setOwnerLoading(true);
    const fetchOwnerEmail = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', brand.ownerId));
        if (userDoc.exists()) {
          setOwnerEmail(userDoc.data().email || 'Unknown Owner');
        } else {
          setOwnerEmail('Unknown Owner');
        }
      } catch (e) {
        setOwnerEmail('Unknown Owner');
      } finally {
        setOwnerLoading(false);
      }
    };
    fetchOwnerEmail();
  }, [brand]);

  useEffect(() => {
    if (!open) {
      setInviteEmail('');
      setInviteStatus('idle');
      setInviteError('');
    }
  }, [open]);

  if (!brand) return null;
  // Build members list: always include owner, deduplicate if owner is in members
  const filteredMembers = [
    { email: ownerEmail, role: 'Owner', userId: brand.ownerId },
    ...(brand.members ? brand.members.filter(m => m.userId !== brand.ownerId) : [])
  ];
  const maxMembers = 5;
  const canInvite = filteredMembers.length < maxMembers;
  const isOwner = user && user.uid === brand.ownerId;
  // For non-owners, only show members (not owner) in the drawer
  const visibleMembers = isOwner
    ? [{ email: ownerEmail, role: 'Owner', userId: brand.ownerId }, ...(brand.members || [])]
    : (brand.members || []);
  // Member count logic
  const memberCount = isOwner ? 1 + (brand.members ? brand.members.length : 0) : (brand.members ? brand.members.length + 1 : 1);

  // Remove member handler (only for owner)
  const handleRemoveMember = async (member) => {
    if (!brand || !user || !isOwner) return;
    try {
      const updatedMembers = (brand.members || []).filter(m => m.userId !== member.userId);
      await updateDoc(doc(db, 'users', brand.ownerId, 'brands', brand.id), {
        members: updatedMembers
      });
    } catch (e) {}
  };

  // Leave brand handler (for non-owners)
  const handleLeaveBrand = async () => {
    if (!brand || !user || isOwner) return;
    try {
      const updatedMembers = (brand.members || []).filter(m => m.userId !== user.uid);
      await updateDoc(doc(db, 'users', brand.ownerId, 'brands', brand.id), {
        members: updatedMembers
      });
      if (onClose) onClose();
    } catch (e) {
      // Optionally: show error toast
    }
  };

  const handleInvite = async () => {
    setInviteStatus('loading');
    setInviteError('');
    try {
      const res = await fetch(`${API_BASE_URL}/brevo/invite-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand.id,
          brandName: brand.name,
          invitedEmail: inviteEmail,
          inviterName: user?.displayName || user?.email,
          inviterId: user?.uid
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setInviteStatus('error');
        setInviteError(data.error || 'Failed to send invite');
      } else {
        setInviteStatus('invited');
      }
    } catch (e) {
      setInviteStatus('error');
      setInviteError('Failed to send invite');
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 350, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Manage Members for {brand.name}
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 2 }}>
          Members ({memberCount}/{maxMembers})
        </Typography>
        <Box sx={{ mb: 2 }}>
          {/* Member list: owner sees all, non-owner sees only members */}
          {visibleMembers.map((member, idx) => (
            <Box key={idx} sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
              {isOwner && idx === 0 && ownerLoading ? (
                <CircularProgress size={16} sx={{ mr: 1 }} />
              ) : null}
              <Typography variant="body2">{member.email} ({member.role || 'Member'})</Typography>
              {/* Remove button for non-owner, only if current user is owner */}
              {isOwner && member.role !== 'Owner' && (
                <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => handleRemoveMember(member)}>
                  Remove
                </Button>
              )}
            </Box>
          ))}
        </Box>
        {/* Leave Brand button for non-owners */}
        {!isOwner && (
          <Button variant="outlined" color="error" fullWidth sx={{ mb: 2 }} onClick={handleLeaveBrand}>
            Leave Brand
          </Button>
        )}
        {/* Invite field/button only for owner */}
        {isOwner && <>
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Invite New Member
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <TextField
            label="Email"
            size="small"
            fullWidth
            value={inviteEmail}
            onChange={e => {
              setInviteEmail(e.target.value);
              setInviteStatus('idle');
              setInviteError('');
            }}
            disabled={!canInvite || inviteStatus === 'loading' || inviteStatus === 'invited'}
          />
          <Button
            variant="contained"
            disabled={!canInvite || !inviteEmail || inviteStatus === 'loading' || inviteStatus === 'invited'}
            onClick={handleInvite}
          >
            {inviteStatus === 'loading' ? <CircularProgress size={20} /> : inviteStatus === 'invited' ? 'Invited' : 'Invite'}
          </Button>
        </Box>
        {inviteStatus === 'invited' && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Invite sent to {inviteEmail}!
          </Alert>
        )}
        {inviteStatus === 'error' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {inviteError}
          </Alert>
        )}
        {!canInvite && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Maximum of 5 members reached.
          </Alert>
        )}
        </>}
      </Box>
    </Drawer>
  );
} 