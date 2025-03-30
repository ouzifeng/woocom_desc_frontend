import React, { useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

import { DataGrid } from '@mui/x-data-grid';
import Paper from '@mui/material/Paper';

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

const CACHE_KEY = 'keyword-research-cache';
const CACHE_PAYLOAD_KEY = 'keyword-research-payload';

// Helper to format rows for DataGrid
function formatRows(dataArray) {
  return dataArray.map((item, index) => ({
    id: index,
    keyword: item.keyword || '',
    searchVolume: item.search_volume ?? 0,
    cpc: item.cpc ?? 0,
    competition: item.competition || 'N/A',
    competitionIndex: item.competition_index ?? 0
  }));
}

// Helper: get date range by name
function getDateRangeByLabel(label) {
  const today = dayjs();
  const yesterday = today.subtract(1, 'day');

  switch (label) {
    case '30d':
      // Last 30 days
      return {
        from: yesterday.subtract(30, 'day'),
        to: yesterday
      };
    case 'ytd':
      // Year to date, up to yesterday
      return {
        from: dayjs().startOf('year'),
        to: yesterday
      };
    case '1y':
      // Past 12 months
      return {
        from: yesterday.subtract(12, 'month'),
        to: yesterday
      };
    case '5y':
      // Past 5 years
      return {
        from: yesterday.subtract(5, 'year'),
        to: yesterday
      };
    default:
      // fallback 1y
      return {
        from: yesterday.subtract(12, 'month'),
        to: yesterday
      };
  }
}

export default function KeywordResearchPage(props) {
  const [user] = useAuthState(auth);

  // Keyword input
  const [keywords, setKeywords] = useState('');

  // Country & Language
  const [countries, setCountries] = useState([]);
  const [country, setCountry] = useState(null);
  const [countriesLoading, setCountriesLoading] = useState(false);

  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(null);
  const [languagesLoading, setLanguagesLoading] = useState(false);

  // Search Partners
  const [includePartners, setIncludePartners] = useState(false);

  // Range selection
  const [rangeLabel, setRangeLabel] = useState('1y'); // default 1 year
  const [dateFrom, setDateFrom] = useState(dayjs().subtract(12, 'month'));
  const [dateTo, setDateTo] = useState(dayjs().subtract(1, 'day'));

  // Table data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usedCache, setUsedCache] = useState(false);

  // On mount, fetch countries & languages
  useEffect(() => {
    async function fetchCountries() {
      setCountriesLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/locations/countries`);
        const data = await res.json();
        if (Array.isArray(data.countries)) {
          setCountries(data.countries);
        }
      } catch (err) {
        console.error('Error fetching countries:', err);
      } finally {
        setCountriesLoading(false);
      }
    }

    async function fetchLanguages() {
      setLanguagesLoading(true);
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/languages`);
        const data = await res.json();
        if (data.tasks?.[0]?.result) {
          setLanguages(data.tasks[0].result);
        }
      } catch (err) {
        console.error('Error fetching languages:', err);
      } finally {
        setLanguagesLoading(false);
      }
    }

    fetchCountries();
    fetchLanguages();
  }, []);

  // Recompute dateFrom/dateTo whenever rangeLabel changes
  useEffect(() => {
    const { from, to } = getDateRangeByLabel(rangeLabel);
    setDateFrom(from);
    setDateTo(to);
  }, [rangeLabel]);

  // Attempt to load cached data on mount
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

  // The "Search" button
  const handleSearch = async () => {
    // Build user payload
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
      date_to: dateTo.format('YYYY-MM-DD')
    };

    // 1) Compare with last cached payload
    const lastPayload = localStorage.getItem(CACHE_PAYLOAD_KEY);
    if (lastPayload) {
      const parsedPayload = JSON.parse(lastPayload);
      const samePayload = JSON.stringify(parsedPayload) === JSON.stringify(payload);
      if (samePayload) {
        // If user didn't change anything, just show from cache
        console.log('✅ Payload unchanged; using cached results');
        setUsedCache(true);
        return;
      }
    }

    // 2) Clear old cache, set new request
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_PAYLOAD_KEY);

    setLoading(true);
    setUsedCache(false);

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/keywords`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log('API result:', data);

      if (data.result && Array.isArray(data.result)) {
        // Convert to rows
        const formatted = formatRows(data.result);

        // Show in table
        setRows(formatted);

        // Cache the raw result + the payload
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

  // DataGrid columns
  const columns = [
    {
      field: 'keyword',
      headerName: 'Keyword',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'searchVolume',
      headerName: 'Volume',
      width: 130,
      type: 'number'
    },
    {
      field: 'cpc',
      headerName: 'CPC ($)',
      width: 100,
      type: 'number'
    },
    {
      field: 'competition',
      headerName: 'Competition',
      width: 130
    },
    {
      field: 'competitionIndex',
      headerName: 'Comp. Index',
      width: 130,
      type: 'number'
    }
  ];

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
            p: 3
          })}
        >
          <Stack spacing={2}>
            <Header />
            <Typography variant="h4">Keyword Research</Typography>
            <Typography variant="body1" color="text.secondary">
              Research keywords using Google Ads data (caching & fixed date ranges)
            </Typography>

            {usedCache && (
              <Typography variant="body2" color="success.main">
                ✅ Showing cached results
              </Typography>
            )}

            {/* KEYWORDS, COUNTRY, LANGUAGE */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Enter keywords (comma separated, max 20)"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., japanese knives, gyuto knife"
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={countries}
                  loading={countriesLoading}
                  value={country}
                  onChange={(e, val) => setCountry(val)}
                  getOptionLabel={(option) => option.location_name || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {countriesLoading && <CircularProgress size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={languages}
                  loading={languagesLoading}
                  value={language}
                  onChange={(e, val) => setLanguage(val)}
                  getOptionLabel={(option) => option.language_name || ''}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Language"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {languagesLoading && <CircularProgress size={20} />}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Range selection & auto date logic */}
              <Grid item xs={12} sm={4}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Date Range
                </Typography>
                <Select
                  fullWidth
                  value={rangeLabel}
                  onChange={(e) => setRangeLabel(e.target.value)}
                  variant="outlined"
                >
                  <MenuItem value="30d">Last 30 days</MenuItem>
                  <MenuItem value="ytd">Year to Date</MenuItem>
                  <MenuItem value="1y">1 Year</MenuItem>
                  <MenuItem value="5y">5 Years</MenuItem>
                </Select>
              </Grid>
            </Grid>

            <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={includePartners}
                    onChange={(e) => setIncludePartners(e.target.checked)}
                  />
                }
                label="Include Google Search Partners"
              />
              <Button
                variant="contained"
                disabled={!keywords.trim()}
                onClick={handleSearch}
              >
                Search
              </Button>
            </Stack>

            <Paper sx={{ width: '100%', overflow: 'hidden', mt: 3 }}>
              <DataGrid
                rows={rows}
                columns={columns}
                loading={loading}
                autoHeight
                disableRowSelectionOnClick
                pageSizeOptions={[10, 25, 50]}
              />
            </Paper>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
}
