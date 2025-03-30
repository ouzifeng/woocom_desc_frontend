// KeywordResearchPage.jsx
import React, { useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';
import Grid from '@mui/material/Grid';

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

// Caching keys
const CACHE_KEY = 'keyword-research-cache';
const CACHE_PAYLOAD_KEY = 'keyword-research-payload';

export default function KeywordResearchPage(props) {
  const [user] = useAuthState(auth);

  // Keywords
  const [keywords, setKeywords] = useState('');
  // Country & Language
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(null);
  const [languagesLoading, setLanguagesLoading] = useState(false);

  // Partners
  const [includePartners, setIncludePartners] = useState(false);

  // Date range
  const [rangeLabel, setRangeLabel] = useState('1y');
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(12, 'month'));
  const [dateTo, setDateTo] = useState(dayjs().subtract(1, 'day'));

  // DataGrid
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usedCache, setUsedCache] = useState(false);

  // ------------------ FETCHING ON MOUNT ------------------
  useEffect(() => {
    // Load countries
    async function loadCountries() {
      setCountriesLoading(true);
      try {
        const data = await fetchCountries();
        setCountries(data || []);
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setCountriesLoading(false);
      }
    }

    // Load languages
    async function loadLanguages() {
      setLanguagesLoading(true);
      try {
        const data = await fetchLanguages();
        setLanguages(data || []);
      } catch (err) {
        console.error('Error fetching languages:', err);
      } finally {
        setLanguagesLoading(false);
      }
    }

    loadCountries();
    loadLanguages();
  }, [user]);

  // Recompute dateFrom/dateTo whenever rangeLabel changes
  useEffect(() => {
    const { from, to } = getDateRangeByLabel(rangeLabel);
    setDateFrom(from);
    setDateTo(to);
  }, [rangeLabel]);

  // Attempt to load existing cache on mount
  useEffect(() => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedPayload = localStorage.getItem(CACHE_PAYLOAD_KEY);
    if (cachedData && cachedPayload) {
      console.log('Found existing cache on mount');
      const parsedData = JSON.parse(cachedData);
      const rowsFormatted = formatRows(parsedData);
      setRows(rowsFormatted);
      setUsedCache(true);
    }
  }, []);

  // ------------------ SEARCH FUNCTION ------------------
  const handleSearch = async () => {
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

    // Check if same as last cached payload
    const lastPayload = localStorage.getItem(CACHE_PAYLOAD_KEY);
    if (lastPayload) {
      const parsedPayload = JSON.parse(lastPayload);
      if (JSON.stringify(parsedPayload) === JSON.stringify(payload)) {
        console.log('✅ Payload unchanged; using cached results');
        setUsedCache(true);
        return;
      }
    }

    // If changed, clear old cache
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_PAYLOAD_KEY);
    setLoading(true);
    setUsedCache(false);

    try {
      // Make request
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      console.log('API result:', data);

      if (data.result && Array.isArray(data.result)) {
        const formatted = formatRows(data.result);
        setRows(formatted);
        // Cache
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.result));
        localStorage.setItem(CACHE_PAYLOAD_KEY, JSON.stringify(payload));
        console.log('🗃️ New data cached');
      } else {
        console.warn('No "result" array in data:', data);
        setRows([]);
      }
    } catch (error) {
      console.error('Failed to fetch keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ------------------ RENDER ------------------
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h4">Keyword Research</Typography>
                    <Typography variant="body1" color="text.secondary">
                      Research keywords using Google Ads data
                    </Typography>
                  </Box>
                  {usedCache && (
                    <Typography variant="body2" color="success.main">
                      ✅ Showing cached results
                    </Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12} md={12}>
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
              </Grid>

              <Grid item xs={12} md={12}>
                <KeywordDataGrid
                  rows={rows}
                  loading={loading}
                />
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
