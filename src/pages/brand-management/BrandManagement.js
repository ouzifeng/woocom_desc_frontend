import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useBrand } from '../../contexts/BrandContext';

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

export default function BrandManagement(props) {
  const [user] = useAuthState(auth);
  const { userBrands, activeBrand, activeBrandId, switchBrand, createBrand, updateBrandName } = useBrand();
  const [loading, setLoading] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [brandNameToEdit, setBrandNameToEdit] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [editMemberDialogOpen, setEditMemberDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [confirmationMessage, setConfirmationMessage] = useState('');
  
  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setBrandNameToEdit(brand.name);
  };
  
  const handleCancelEdit = () => {
    setEditingBrand(null);
    setBrandNameToEdit('');
  };
  
  const handleSaveEdit = async () => {
    if (!brandNameToEdit.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      await updateBrandName(editingBrand.id, brandNameToEdit);
      setEditingBrand(null);
      setBrandNameToEdit('');
      setConfirmationMessage('Brand name updated successfully');
      setTimeout(() => setConfirmationMessage(''), 3000);
    } catch (error) {
      console.error('Error updating brand name:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteClick = (brand) => {
    setBrandToDelete(brand);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!brandToDelete || userBrands.length <= 1) {
      setDeleteConfirmOpen(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Check if this is the active brand
      if (brandToDelete.id === activeBrandId) {
        // Find another brand to switch to
        const otherBrand = userBrands.find(b => b.id !== brandToDelete.id);
        if (otherBrand) {
          await switchBrand(otherBrand.id);
        }
      }
      
      // Delete the brand
      const brandRef = doc(db, 'users', user.uid, 'brands', brandToDelete.id);
      await deleteDoc(brandRef);
      
      setConfirmationMessage('Brand deleted successfully');
      setTimeout(() => setConfirmationMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting brand:', error);
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setBrandToDelete(null);
    }
  };
  
  const handleOpenMemberDialog = (brand) => {
    setEditingBrand(brand);
    setEditMemberDialogOpen(true);
  };
  
  const handleAddMember = () => {
    if (!newMemberEmail.trim() || !/\S+@\S+\.\S+/.test(newMemberEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Check if the member already exists
    const members = editingBrand.members || [];
    if (members.some(m => m.email === newMemberEmail)) {
      setEmailError('This user is already a member of this brand');
      return;
    }
    
    // Check if we've reached the limit of 4 additional members
    if (members.length >= 5) {
      setEmailError('You can only have up to 4 additional members per brand');
      return;
    }
    
    // Add the new member
    const updatedMembers = [
      ...members,
      {
        email: newMemberEmail,
        role: 'editor',
        invitedAt: new Date()
      }
    ];
    
    // Update the brand in Firestore
    const brandRef = doc(db, 'users', user.uid, 'brands', editingBrand.id);
    updateDoc(brandRef, {
      members: updatedMembers
    }).then(() => {
      setNewMemberEmail('');
      setEmailError('');
      setEditMemberDialogOpen(false);
      setConfirmationMessage('Member invited successfully');
      setTimeout(() => setConfirmationMessage(''), 3000);
    }).catch(error => {
      console.error('Error adding member:', error);
      setEmailError('Error adding member. Please try again.');
    });
  };
  
  const handleRemoveMember = (memberEmail) => {
    if (!editingBrand) return;
    
    // Filter out the member to remove
    const updatedMembers = editingBrand.members.filter(m => m.email !== memberEmail);
    
    // Update the brand in Firestore
    const brandRef = doc(db, 'users', user.uid, 'brands', editingBrand.id);
    updateDoc(brandRef, {
      members: updatedMembers
    }).then(() => {
      // Update local state
      setEditingBrand({
        ...editingBrand,
        members: updatedMembers
      });
    }).catch(error => {
      console.error('Error removing member:', error);
    });
  };
  
  const handleCreateNewBrand = () => {
    createBrand("New Brand").then(() => {
      setConfirmationMessage('New brand created successfully');
      setTimeout(() => setConfirmationMessage(''), 3000);
    });
  };

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu user={user} />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            width: '100%',
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Box sx={{ p: 3, width: '100%' }}>
            <Header />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Brand Management
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleCreateNewBrand}
                startIcon={<PersonAddIcon />}
              >
                Create New Brand
              </Button>
            </Box>
            
            {confirmationMessage && (
              <Alert 
                severity="success" 
                sx={{ mb: 3 }}
                onClose={() => setConfirmationMessage('')}
              >
                {confirmationMessage}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              {userBrands.map((brand) => (
                <Grid item xs={12} md={6} lg={4} key={brand.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      ...(brand.id === activeBrandId && {
                        borderColor: 'primary.main',
                        borderWidth: 2,
                        borderStyle: 'solid',
                      })
                    }}
                  >
                    <CardHeader
                      title={
                        editingBrand?.id === brand.id ? (
                          <TextField
                            fullWidth
                            value={brandNameToEdit}
                            onChange={(e) => setBrandNameToEdit(e.target.value)}
                            placeholder="Brand Name"
                            size="small"
                            autoFocus
                          />
                        ) : (
                          brand.name
                        )
                      }
                      action={
                        editingBrand?.id === brand.id ? (
                          <Box>
                            <Button 
                              size="small" 
                              onClick={handleSaveEdit}
                              disabled={loading}
                            >
                              Save
                            </Button>
                            <Button 
                              size="small" 
                              onClick={handleCancelEdit}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          <Box>
                            <IconButton 
                              aria-label="edit" 
                              onClick={() => handleEditBrand(brand)}
                              size="small"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            {userBrands.length > 1 && (
                              <IconButton 
                                aria-label="delete" 
                                onClick={() => handleDeleteClick(brand)}
                                size="small"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        )
                      }
                      subheader={
                        brand.id === activeBrandId ? 'Current Active Brand' : ''
                      }
                    />
                    <Divider />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Members ({(brand.members || []).length}/5)
                      </Typography>
                      {brand.members && brand.members.length > 0 ? (
                        <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {brand.members.map((member, index) => (
                                <TableRow key={index}>
                                  <TableCell>{member.email}</TableCell>
                                  <TableCell>{member.role}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No members found
                        </Typography>
                      )}
                    </CardContent>
                    <Divider />
                    <CardActions>
                      <Button 
                        size="small" 
                        onClick={() => handleOpenMemberDialog(brand)}
                        startIcon={<PersonAddIcon />}
                      >
                        Manage Members
                      </Button>
                      {brand.id !== activeBrandId && (
                        <Button 
                          size="small" 
                          onClick={() => switchBrand(brand.id)}
                          color="primary"
                        >
                          Switch to Brand
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            
            {/* Delete confirmation dialog */}
            <Dialog
              open={deleteConfirmOpen}
              onClose={() => setDeleteConfirmOpen(false)}
            >
              <DialogTitle>Delete Brand</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete the brand "{brandToDelete?.name}"? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                  Delete
                </Button>
              </DialogActions>
            </Dialog>
            
            {/* Member management dialog */}
            <Dialog
              open={editMemberDialogOpen}
              onClose={() => setEditMemberDialogOpen(false)}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle>Manage Members - {editingBrand?.name}</DialogTitle>
              <DialogContent>
                <DialogContentText paragraph>
                  Invite team members to collaborate on this brand. Each brand can have up to 4 additional members.
                </DialogContentText>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Members
                  </Typography>
                  {editingBrand?.members && editingBrand.members.length > 0 ? (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Email</TableCell>
                          <TableCell>Role</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {editingBrand.members.map((member, index) => (
                          <TableRow key={index}>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.role}</TableCell>
                            <TableCell>
                              {member.role !== 'owner' && (
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleRemoveMember(member.email)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No members found
                    </Typography>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Invite New Member
                </Typography>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Email Address"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={newMemberEmail}
                  onChange={(e) => {
                    setNewMemberEmail(e.target.value);
                    setEmailError('');
                  }}
                  error={!!emailError}
                  helperText={emailError}
                  disabled={(editingBrand?.members || []).length >= 5}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEditMemberDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleAddMember} 
                  color="primary"
                  disabled={!newMemberEmail.trim() || (editingBrand?.members || []).length >= 5}
                >
                  Send Invite
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
} 