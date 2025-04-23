import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Grid from '@mui/material/Grid';
import AppNavbar from '../dashboard/components/AppNavbar';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CircularProgress from '@mui/material/CircularProgress';
import { useBrand } from '../../contexts/BrandContext';
import InstructionsDrawer from './InstructionsDrawer';
import DeleteIcon from '@mui/icons-material/Delete';
import { useToast } from '../../components/ToasterAlert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export default function YourBrands(props) {
  const [user] = useAuthState(auth);
  const { userBrands, activeBrandId, switchBrand, updateBrandName, createBrand, loading, error } = useBrand();
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [brandNameToEdit, setBrandNameToEdit] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [localError, setLocalError] = useState(null);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const { showToast } = useToast();

  // For debugging
  useEffect(() => {
    console.log("YourBrands render - activeBrandId:", activeBrandId);
    console.log("YourBrands render - userBrands:", userBrands);
    console.log("YourBrands render - loading:", loading);
    console.log("YourBrands render - error:", error);
  }, [activeBrandId, userBrands, loading, error]);

  const handleEditBrand = (brand) => {
    setEditingBrandId(brand.id);
    setBrandNameToEdit(brand.name);
  };

  const handleCancelEdit = () => {
    setEditingBrandId(null);
    setBrandNameToEdit('');
  };

  const handleSaveEdit = async (brandId) => {
    if (!brandNameToEdit.trim()) {
      return;
    }
    
    try {
      setIsUpdating(true);
      setLocalError(null);
      const success = await updateBrandName(brandId, brandNameToEdit.trim());
      if (success) {
        setEditingBrandId(null);
        setBrandNameToEdit('');
        setConfirmationMessage('Brand name updated successfully');
        setTimeout(() => setConfirmationMessage(''), 3000);
      } else {
        setLocalError('Failed to update brand name. Please try again.');
      }
    } catch (error) {
      console.error('Error updating brand name:', error);
      setLocalError(error.message || 'An error occurred while updating brand name');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateNewBrand = async () => {
    try {
      setIsUpdating(true);
      setLocalError(null);
      const success = await createBrand('New Brand');
      if (success) {
        setConfirmationMessage('New brand created successfully');
        setTimeout(() => setConfirmationMessage(''), 3000);
        
        // After creating brand, don't attempt to immediately switch
        // Just wait for the Firestore listener to update userBrands
      } else {
        setLocalError('Failed to create new brand. Please try again.');
      }
    } catch (error) {
      console.error('Error creating brand:', error);
      setLocalError(error.message || 'An error occurred while creating brand');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSwitchBrand = async (brandId) => {
    try {
      setIsUpdating(true);
      setLocalError(null);
      const success = await switchBrand(brandId);
      if (success) {
        setConfirmationMessage('Switched to brand successfully');
        setTimeout(() => setConfirmationMessage(''), 3000);
      } else {
        setLocalError('Failed to switch brand. Please try again.');
      }
    } catch (error) {
      console.error('Error switching brand:', error);
      setLocalError(error.message || 'An error occurred while switching brand');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDeleteBrand = (brandId) => {
    const brand = userBrands.find(b => b.id === brandId);
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBrand = async () => {
    if (!brandToDelete || brandToDelete.id === activeBrandId) {
      setDeleteDialogOpen(false);
      showToast('Cannot delete the active brand. Switch to another brand first.', 'error');
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'brands', brandToDelete.id));
      showToast('Brand deleted successfully', 'success');
    } catch (err) {
      showToast('Failed to delete brand: ' + err.message, 'error');
    } finally {
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                Your Brands
                {loading && (
                  <CircularProgress size={24} sx={{ ml: 2, verticalAlign: 'middle' }} />
                )}
              </Typography>
              <Box>
                <Button 
                  variant="contained" 
                  onClick={handleCreateNewBrand}
                  startIcon={<AddIcon />}
                  disabled={isUpdating || loading}
                  sx={{ mr: 1 }}
                >
                  Create New Brand
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setInstructionsOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Instructions
                </Button>
              </Box>
            </Box>
            <InstructionsDrawer open={instructionsOpen} onClose={() => setInstructionsOpen(false)} />
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
              <DialogTitle>Delete Brand</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Are you sure you want to delete the brand "{brandToDelete?.name}"? This action cannot be undone.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                <Button onClick={confirmDeleteBrand} color="error" autoFocus>
                  Delete
                </Button>
              </DialogActions>
            </Dialog>

            {confirmationMessage && (
              <Alert 
                severity="success" 
                sx={{ mb: 3 }}
                onClose={() => setConfirmationMessage('')}
              >
                {confirmationMessage}
              </Alert>
            )}
            
            {(error || localError) && (
              <Alert 
                severity="error" 
                sx={{ mb: 3 }}
                onClose={() => setLocalError(null)}
                action={
                  <Button color="inherit" size="small" onClick={handleRefresh}>
                    REFRESH
                  </Button>
                }
              >
                {localError || error}
              </Alert>
            )}

            {loading && userBrands.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 8 }}>
                <CircularProgress size={60} />
              </Box>
            ) : userBrands.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 8, p: 3, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No brands found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  You don't have any brands yet. Create your first brand to get started.
                </Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleCreateNewBrand}
                  disabled={isUpdating}
                >
                  Create Your First Brand
                </Button>
              </Box>
            ) : (
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
                        }),
                        transition: 'box-shadow 0.2s',
                        '&:hover': {
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardHeader
                        title={
                          editingBrandId === brand.id ? (
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
                          editingBrandId === brand.id ? (
                            <Box>
                              <Button 
                                size="small" 
                                onClick={() => handleSaveEdit(brand.id)}
                                disabled={isUpdating}
                              >
                                Save
                              </Button>
                              <Button 
                                size="small" 
                                onClick={handleCancelEdit}
                                disabled={isUpdating}
                              >
                                Cancel
                              </Button>
                            </Box>
                          ) : (
                            <>
                              <IconButton 
                                aria-label="edit" 
                                onClick={() => handleEditBrand(brand)}
                                size="small"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              {brand.id !== activeBrandId && (
                                <IconButton
                                  aria-label="delete"
                                  onClick={() => handleDeleteBrand(brand.id)}
                                  size="small"
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              )}
                            </>
                          )
                        }
                        subheader={
                          brand.id === activeBrandId ? 'Current Active Brand' : ''
                        }
                      />
                      <Divider />
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <PeopleIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {brand.members?.length || 1} Member{(brand.members?.length || 1) > 1 ? 's' : ''}
                          </Typography>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          Created: {brand.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                        </Typography>
                        
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          ID: {brand.id}
                        </Typography>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          startIcon={<PersonAddIcon />}
                        >
                          Manage Members
                        </Button>
                        {brand.id !== activeBrandId && (
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => handleSwitchBrand(brand.id)}
                            disabled={isUpdating}
                          >
                            Switch to Brand
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
                
                <Grid item xs={12} md={6} lg={4}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 3,
                      border: '2px dashed',
                      borderColor: 'divider',
                      cursor: isUpdating ? 'default' : 'pointer',
                      opacity: isUpdating ? 0.6 : 1,
                      '&:hover': {
                        borderColor: isUpdating ? 'divider' : 'primary.main',
                        backgroundColor: isUpdating ? 'transparent' : 'action.hover',
                      },
                    }}
                    onClick={isUpdating ? undefined : handleCreateNewBrand}
                  >
                    {isUpdating ? (
                      <CircularProgress size={40} sx={{ mb: 2 }} />
                    ) : (
                      <AddIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                    )}
                    <Typography variant="h6" color="primary">
                      Create New Brand
                    </Typography>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </Box>
    </AppTheme>
  );
} 