// KeywordResearchPage.jsx
import React, { useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import { doc, collection, setDoc, deleteDoc, getDocs, query } from 'firebase/firestore';
import { db } from '../../firebase';

import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

import { formatRows, getDateRangeByLabel } from './utils'; // Helpers used by parent
import { fetchCountries, fetchLanguages } from './utils';   // Or place them here
import SearchControls from './components/SearchControls';
import KeywordDataGrid from './components/KeywordDataGrid';

// ----------------------------------------------------------------
// Simple TabPanel helper
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`keyword-research-tabpanel-${index}`}
      aria-labelledby={`keyword-research-tab-${index}`}
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

// ----------------------------------------------------------------
// Caching constants for countries/languages
const COUNTRIES_CACHE_KEY = 'keyword-research-countries-cache';
const LANGUAGES_CACHE_KEY = 'keyword-research-languages-cache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export default function KeywordResearchPage(props) {
  const [user] = useAuthState(auth);

  // ------------------ State ------------------
  const [keywords, setKeywords] = useState('');

  // Country/Language
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(null);
  const [languagesLoading, setLanguagesLoading] = useState(false);

  const [includePartners, setIncludePartners] = useState(false);

  // Date range
  const [rangeLabel, setRangeLabel] = useState('1y');
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(12, 'month'));
  const [dateTo, setDateTo] = useState(dayjs().subtract(1, 'day'));

  // DataGrid
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tabs
  const [tabValue, setTabValue] = useState(0);
  const [tabs, setTabs] = useState([
    {
      id: 'tab-1',
      label: 'Research 1',
      keywords: '',
      rows: [],
      isDeletable: false
    },
  ]);

  // Editing tab name
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState('');

  // Add to existing state
  const [savedKeywords, setSavedKeywords] = useState([]);

  // ----------------------------------------------------------------
  // Load countries/languages on mount
  useEffect(() => {
    async function loadCountries() {
      setCountriesLoading(true);
      try {
        // Check local cache
        const cachedData = localStorage.getItem(COUNTRIES_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setCountries(data);
            setCountriesLoading(false);
            return;
          }
        }
        // Fetch if no cache or expired
        const data = await fetchCountries();
        setCountries(data || []);
        localStorage.setItem(
          COUNTRIES_CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setCountriesLoading(false);
      }
    }

    async function loadLanguages() {
      setLanguagesLoading(true);
      try {
        // Check local cache
        const cachedData = localStorage.getItem(LANGUAGES_CACHE_KEY);
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            setLanguages(data);
            setLanguagesLoading(false);
            return;
          }
        }
        // Fetch if no cache or expired
        const data = await fetchLanguages();
        setLanguages(data || []);
        localStorage.setItem(
          LANGUAGES_CACHE_KEY,
          JSON.stringify({ data, timestamp: Date.now() })
        );
      } catch (err) {
        console.error('Error fetching languages:', err);
      } finally {
        setLanguagesLoading(false);
      }
    }

    loadCountries();
    loadLanguages();
  }, [user]);

  // Update dateFrom/dateTo whenever rangeLabel changes
  useEffect(() => {
    const { from, to } = getDateRangeByLabel(rangeLabel);
    setDateFrom(from);
    setDateTo(to);
  }, [rangeLabel]);

  // ----------------------------------------------------------------
  // Load all saved tabs exactly once when user is defined
  useEffect(() => {
    if (!user) return;

    const loadSavedResearch = async () => {
      try {
        const researchRef = collection(db, 'users', user.uid, 'keywordResearch');
        const querySnapshot = await getDocs(query(researchRef));

        const savedTabs = [];
        querySnapshot.forEach((docSnap) => {
          savedTabs.push({
            id: docSnap.id,
            ...docSnap.data(),
          });
        });

        if (savedTabs.length > 0) {
          // Replace local tabs with whatever is in Firestore
          setTabs(savedTabs);
          // Show the first tab by default
          setTabValue(0);
          setKeywords(savedTabs[0]?.keywords || '');
          setRows(savedTabs[0]?.rows || []);
        } else {
          // If no saved tabs, keep the default single tab
          setTabs([
            {
              id: 'tab-1',
              label: 'Research 1',
              keywords: '',
              rows: [],
              isDeletable: false
            },
          ]);
          setTabValue(0);
          setKeywords('');
          setRows([]);
        }
      } catch (error) {
        console.error('Error loading saved research:', error);
      }
    };

    loadSavedResearch();
  }, [user]);

  // Add this effect to load saved keywords
  useEffect(() => {
    if (!user) return;

    const loadSavedKeywords = async () => {
      try {
        const savedRef = collection(db, 'users', user.uid, 'savedKeywords');
        const querySnapshot = await getDocs(query(savedRef));
        
        const keywords = [];
        querySnapshot.forEach(doc => {
          keywords.push(doc.data());
        });
        
        setSavedKeywords(keywords);
      } catch (error) {
        console.error('Error loading saved keywords:', error);
      }
    };

    loadSavedKeywords();
  }, [user]);

  // ----------------------------------------------------------------
  // Run search
  const handleSearch = async () => {
    // If user clicked the "Saved Words" tab (the last tab),
    // or the plus tab, do nothing:
    if (tabValue >= tabs.length) return;

    const keywordArray = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean)
      .slice(0, 20);

    const payload = {
      keywords: keywordArray,
      location_code: country?.location_code || null,
      language_code: language?.language_code || null,
      search_partners: includePartners,
      date_from: dateFrom.format('YYYY-MM-DD'),
      date_to: dateTo.format('YYYY-MM-DD'),
    };

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_URL}/dataforseo/keywords`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (data.result && Array.isArray(data.result)) {
        const formatted = formatRows(data.result);

        // Update only the current tab's data in local state
        const updatedTabs = tabs.map((tab, index) => {
          if (index === tabValue) {
            return {
              ...tab,
              keywords,
              rows: formatted,
              payload,
              lastUpdated: new Date().toISOString()
            };
          }
          return tab;
        });

        setTabs(updatedTabs);
        setRows(formatted);

        // Save the current tab to Firestore
        const currentTab = updatedTabs[tabValue];
        if (user && currentTab) {
          await setDoc(
            doc(db, 'users', user.uid, 'keywordResearch', currentTab.id),
            currentTab,
            { merge: true }
          );
        }
      }
    } catch (error) {
      console.error('Failed to fetch or save keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // Changing which tab is active
  const handleTabChange = (event, newValue) => {
    // If newValue == tabs.length, that's the + tab
    if (newValue === tabs.length) {
      // ignore here; handleAddTab() is called on its icon's onClick
      return;
    }
    // If newValue == tabs.length+1, that's the "Saved Words" tab
    if (newValue === tabs.length + 1) {
      setTabValue(newValue);
      setKeywords('');
      setRows([]);
      return;
    }
    // Otherwise it's a normal tab 0..tabs.length-1
    setTabValue(newValue);
    const targetTab = tabs[newValue];
    setKeywords(targetTab?.keywords || '');
    setRows(targetTab?.rows || []);
  };

  // Create a new blank tab
  const handleAddTab = async () => {
    if (!user) return;

    const newTabId = `tab-${Date.now()}`;
    const newTab = {
      id: newTabId,
      label: 'New Research',
      keywords: '',
      rows: [],
      isDeletable: true,
      lastUpdated: new Date().toISOString(),
    };

    try {
      // Add to local state
      const newTabs = [...tabs, newTab];
      setTabs(newTabs);

      // Clear the fields and switch to that new tab
      setKeywords('');
      setRows([]);
      setTabValue(newTabs.length - 1);

      // Save the new tab to Firestore
      await setDoc(doc(db, 'users', user.uid, 'keywordResearch', newTabId), newTab);
    } catch (error) {
      console.error('Error creating new tab:', error);
    }
  };

  // Deleting an existing tab
  const handleDeleteTab = async (tabIndex) => {
    if (!user) return;
    const tabToDelete = tabs[tabIndex];
    if (!tabToDelete) return;

    try {
      // Remove from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'keywordResearch', tabToDelete.id));

      // Remove from local state
      const newTabs = tabs.filter((_, i) => i !== tabIndex);
      setTabs(newTabs);

      // If we deleted the currently active tab, switch to another
      if (tabValue === tabIndex) {
        const newActive = Math.max(0, tabIndex - 1);
        setTabValue(newActive);
        const targetTab = newTabs[newActive];
        setKeywords(targetTab?.keywords || '');
        setRows(targetTab?.rows || []);
      } else if (tabValue > tabIndex) {
        // Shift active index one back
        setTabValue((val) => val - 1);
      }
    } catch (error) {
      console.error('Error deleting tab:', error);
    }
  };

  // ----------------------------------------------------------------
  // Renaming a tab
  const handleTabDoubleClick = (tabId, currentLabel) => {
    setEditingTabId(tabId);
    setEditingTabName(currentLabel);
  };
  const handleTabNameChange = (event) => {
    setEditingTabName(event.target.value);
  };
  const handleTabNameSave = async () => {
    if (!user || !editingTabName.trim()) {
      setEditingTabId(null);
      setEditingTabName('');
      return;
    }
    try {
      const updatedTabs = tabs.map((t) =>
        t.id === editingTabId
          ? { ...t, label: editingTabName.trim() }
          : t
      );
      const tabToUpdate = updatedTabs.find((t) => t.id === editingTabId);

      // Save in Firestore
      await setDoc(
        doc(db, 'users', user.uid, 'keywordResearch', editingTabId),
        { ...tabToUpdate },
        { merge: true }
      );

      setTabs(updatedTabs);
    } catch (error) {
      console.error('Error updating tab name:', error);
    } finally {
      setEditingTabId(null);
      setEditingTabName('');
    }
  };

  // Add these handlers
  const handleSaveKeyword = (keyword) => {
    setSavedKeywords(prev => [...prev, keyword]);
  };

  const handleRemoveKeyword = (keyword) => {
    setSavedKeywords(prev => prev.filter(k => k.keyword !== keyword.keyword));
  };

  // ----------------------------------------------------------------
  // Render
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
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Grid container spacing={3}>
              <Grid item xs={12} md={12}>
                <Typography variant="h4" component="h1">
                  Keyword Research
                </Typography>
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mt: 1, mb: 3 }}
                >
                  Research and find keywords for your business
                </Typography>
              </Grid>

              <Grid item xs={12} md={12}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs
                    value={tabValue}
                    onChange={handleTabChange}
                    aria-label="keyword research tabs"
                  >
                    {/* Render the "real" research tabs */}
                    {tabs.map((tab) => (
                      <Tab 
                        key={tab.id}
                        label={
                          editingTabId === tab.id ? (
                            <ClickAwayListener onClickAway={handleTabNameSave}>
                              <TextField
                                size="small"
                                value={editingTabName}
                                onChange={handleTabNameChange}
                                onKeyDown={(e) => {
                                  // Stop propagation for all keys to prevent tab switching
                                  e.stopPropagation();
                                  
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleTabNameSave();
                                  }
                                  if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingTabId(null);
                                    setEditingTabName('');
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                sx={{
                                  '& .MuiInputBase-root': {
                                    height: '24px',
                                    fontSize: '0.875rem',
                                    backgroundColor: 'white',
                                  },
                                  '& input': {
                                    userSelect: 'none'
                                  }
                                }}
                              />
                            </ClickAwayListener>
                          ) : (
                            <Box 
                              sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                cursor: 'text'
                              }}
                              onDoubleClick={() => handleTabDoubleClick(tab.id, tab.label)}
                            >
                              {tab.label}
                              {tab.isDeletable && (
                                <span  // Use span instead of Box to avoid button nesting
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTab(tabs.indexOf(tab));
                                  }}
                                  sx={{ 
                                    display: 'inline-flex',
                                    ml: 1,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <CloseIcon fontSize="small" />
                                </span>
                              )}
                            </Box>
                          )
                        }
                      />
                    ))}
                    {/* The plus tab (index == tabs.length) */}
                    <Tab 
                      icon={
                        <span onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleAddTab();
                        }}>
                          <AddIcon />
                        </span>
                      }
                      sx={{ minWidth: '50px' }}
                    />
                    {/* Saved Words tab (index == tabs.length+1) */}
                    <Tab
                      label="Saved Words"
                      sx={{
                        borderLeft: 1,
                        borderColor: 'divider',
                        minWidth: '120px',
                      }}
                    />
                  </Tabs>
                </Box>

                {/* Render each real tab's contents */}
                {tabs.map((tab, index) => (
                  <TabPanel key={tab.id} value={tabValue} index={index}>
                    <SearchControls
                      keywords={keywords}
                      setKeywords={setKeywords}
                      country={country}
                      setCountry={setCountry}
                      countries={countries}
                      countriesLoading={countriesLoading}
                      language={language}
                      setLanguage={setLanguage}
                      languages={languages}
                      languagesLoading={languagesLoading}
                      rangeLabel={rangeLabel}
                      setRangeLabel={setRangeLabel}
                      includePartners={includePartners}
                      setIncludePartners={setIncludePartners}
                      handleSearch={handleSearch}
                    />
                    <Box sx={{ mt: 3 }}>
                      <KeywordDataGrid 
                        rows={rows} 
                        loading={loading}
                        savedKeywords={savedKeywords}
                        onSaveKeyword={handleSaveKeyword}
                        onRemoveKeyword={handleRemoveKeyword}
                      />
                    </Box>
                  </TabPanel>
                ))}

                {/* Saved Words tab */}
                <TabPanel value={tabValue} index={tabs.length + 1}>
                  <KeywordDataGrid 
                    rows={savedKeywords}
                    loading={loading}
                    savedKeywords={savedKeywords}
                    onSaveKeyword={handleSaveKeyword}
                    onRemoveKeyword={handleRemoveKeyword}
                  />
                </TabPanel>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
