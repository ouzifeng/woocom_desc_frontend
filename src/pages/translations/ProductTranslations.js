import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import LanguageProductTable from './components/LanguageProductTable';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import LanguageOptions from './components/LanguageOptions';
import CloseIcon from '@mui/icons-material/Close';
import { doc, deleteField, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useBrand } from '../../contexts/BrandContext';
import Alert from '@mui/material/Alert';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`translation-tabpanel-${index}`}
      aria-labelledby={`translation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ProductTranslations(props) {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [loading, setLoading] = React.useState(true);
  const [tabValue, setTabValue] = React.useState(0);
  const [refresh, setRefresh] = React.useState(false);
  const [selectedRows, setSelectedRows] = React.useState([]);
  const [tabs, setTabs] = React.useState([
    { code: 'main', name: 'Main', isDeletable: false }
  ]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [tabToDelete, setTabToDelete] = React.useState(null);

  // Load user's language preferences from Firestore
  React.useEffect(() => {
    const loadLanguagePreferences = async () => {
      if (!user || !activeBrandId) return;

      setLoading(true);
      try {
        const userPrefsRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'settings', 'translations');
        const prefsDoc = await getDoc(userPrefsRef);
        
        if (prefsDoc.exists() && prefsDoc.data().languages) {
          const savedLanguages = prefsDoc.data().languages;
          setTabs([
            { code: 'main', name: 'Main', isDeletable: false },
            ...savedLanguages
          ]);
        }
      } catch (error) {
        console.error('Error loading language preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLanguagePreferences();
  }, [user, activeBrandId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageSelect = async (language) => {
    if (!user || !activeBrandId) return;
    
    // Close the menu
    handleClose();

    // Check if language already exists
    if (tabs.some(tab => tab.code === language.code)) {
      console.log('Language already exists');
      return;
    }

    const newLanguage = { 
      code: language.code, 
      name: language.name,
      isDeletable: true 
    };

    try {
      // Update Firestore with the new language
      const userPrefsRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'settings', 'translations');
      const newTabs = [...tabs, newLanguage];
      
      await setDoc(userPrefsRef, {
        languages: newTabs.filter(tab => tab.code !== 'main') // Don't store 'main' in preferences
      }, { merge: true });

      // Update local state
      setTabs(newTabs);
      // Switch to the new tab
      setTabValue(newTabs.length - 1);
      
      console.log('Added new language:', language.name); // Debug log
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  const handleDeleteTabClick = (tabCode, tabIndex) => {
    setTabToDelete({ code: tabCode, index: tabIndex });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !activeBrandId || !tabToDelete) return;

    try {
      // Start a batch write
      const batch = writeBatch(db);

      // 1. Remove language fields from all products
      const productsCollection = collection(db, 'users', user.uid, 'brands', activeBrandId, 'products');
      const productsSnapshot = await getDocs(productsCollection);

      productsSnapshot.docs.forEach((productDoc) => {
        const productRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'products', productDoc.id);
        batch.update(productRef, {
          [`${tabToDelete.code}_name`]: deleteField(),
          [`${tabToDelete.code}_description`]: deleteField()
        });
      });

      // 2. Remove language from user preferences
      const userPrefsRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'settings', 'translations');
      const newTabs = tabs.filter((_, index) => index !== tabToDelete.index);
      
      batch.set(userPrefsRef, {
        languages: newTabs.filter(tab => tab.code !== 'main')
      }, { merge: true });

      // Commit all changes
      await batch.commit();

      // Update UI
      setTabs(newTabs);
      
      if (tabValue === tabToDelete.index) {
        setTabValue(0);
      } else if (tabValue > tabToDelete.index) {
        setTabValue(tabValue - 1);
      }

    } catch (error) {
      console.error('Error deleting translations:', error);
    } finally {
      setDeleteDialogOpen(false);
      setTabToDelete(null);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

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
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h4" component="h1">
                  Product Translations
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                  Translate your product descriptions into multiple languages
                </Typography>

                {!activeBrandId && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Please select a brand to manage translations
                  </Alert>
                )}

                {activeBrandId && (
                  <>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                      <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        aria-label="translation tabs"
                        sx={{ flex: 1 }}
                      >
                        {tabs.map((tab, index) => (
                          <Tab 
                            key={tab.code}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', paddingLeft: '10px', paddingRight: '10px' }}>
                                {tab.name}
                                {tab.isDeletable && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteTabClick(tab.code, index);
                                    }}
                                    sx={{ ml: 1 }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            }
                          />
                        ))}
                      </Tabs>
                      <IconButton 
                        onClick={handleAddClick}
                        sx={{ ml: 1, mb: 1 }}
                        size="small"
                      >
                        <AddIcon />
                      </IconButton>
                    </Box>

                    <LanguageOptions
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                      onSelect={handleLanguageSelect}
                    />

                    {tabs.map((tab, index) => (
                      <TabPanel key={tab.code} value={tabValue} index={index}>
                        <LanguageProductTable 
                          refresh={refresh}
                          setRefresh={setRefresh}
                          setSelectedRows={setSelectedRows}
                          languageCode={tab.code}
                          isMainTab={tab.code === 'main'}
                          brandId={activeBrandId}
                        />
                      </TabPanel>
                    ))}
                  </>
                )}
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setTabToDelete(null);
        }}
      >
        <DialogTitle>Confirm Language Removal</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this language? This will delete all translations in this language for all products.
            <Typography color="error" sx={{ mt: 1 }}>
              Warning: This action cannot be undone.
            </Typography>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteDialogOpen(false);
              setTabToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AppTheme>
  );
} 