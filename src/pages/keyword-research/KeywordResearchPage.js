import * as React from 'react';
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Autocomplete from '@mui/material/Autocomplete';
import dayjs from 'dayjs';
import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect } from 'react';

import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase';

export default function KeywordResearchPage(props) {
  const [user] = useAuthState(auth);
  const [keywords, setKeywords] = React.useState('');
  const [location, setLocation] = React.useState(null);
  const [language, setLanguage] = React.useState(null);
  const [includePartners, setIncludePartners] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState(dayjs().subtract(12, 'month'));
  const [dateTo, setDateTo] = React.useState(dayjs().subtract(1, 'day'));
  const [loading, setLoading] = React.useState(false);
  const [locationOptions, setLocationOptions] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [languagesLoading, setLanguagesLoading] = useState(true);

  const handleSearch = async () => {
    if (!keywords.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/keywords`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          keywords: keywords.split(',').map(k => k.trim()),
          location_name: location?.location_name,
          language_name: language?.language_name,
          search_partners: includePartners,
          date_from: dateFrom.format('YYYY-MM-DD'),
          date_to: dateTo.format('YYYY-MM-DD')
        })
      });
      const data = await response.json();
      console.log('Keyword data:', data);
      // Handle the response data here
    } catch (error) {
      console.error('Error fetching keyword data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Search locations when typing
  const searchLocations = async (searchTerm) => {
    if (!searchTerm) {
      setLocationOptions([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/search-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ searchTerm })
      });
      const data = await response.json();
      if (data.tasks?.[0]?.result) {
        setLocationOptions(data.tasks[0].result);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      setLanguagesLoading(true);
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/dataforseo/languages/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        });
        const data = await response.json();
        console.log('Languages response:', data);
        if (data.tasks?.[0]?.result) {
          setLanguages(data.tasks[0].result);
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      } finally {
        setLanguagesLoading(false);
      }
    };
  
    fetchLanguages();
  }, []);
  

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
              <Grid item xs={12}>
                <Typography variant="h4" component="h1">
                  Keyword Research
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
                  Research keywords using Google Ads data
                </Typography>

                {/* Search Interface */}
                <Box sx={{ mb: 4 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Enter keywords (comma separated, max 20)"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="Enter up to 20 keywords, separated by commas"
                        helperText="Maximum 80 characters per keyword"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Autocomplete
                        value={location}
                        onChange={(event, newValue) => setLocation(newValue)}
                        options={locationOptions}
                        getOptionLabel={(option) => option.location_name}
                        onInputChange={(event, value) => {
                          if (value) searchLocations(value);
                        }}
                        loading={searchLoading}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            label="Location"
                            placeholder="Type to search locations..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Autocomplete
                        options={languages}
                        getOptionLabel={(option) => option.language_name || ''}
                        loading={languagesLoading}
                        value={language}
                        onChange={(event, newValue) => setLanguage(newValue)}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Language"
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {languagesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Date From"
                          value={dateFrom}
                          onChange={setDateFrom}
                          maxDate={dateTo}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DatePicker
                          label="Date To"
                          value={dateTo}
                          onChange={setDateTo}
                          minDate={dateFrom}
                          maxDate={dayjs().subtract(1, 'day')}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                          onClick={handleSearch}
                          disabled={!keywords.trim() || loading}
                        >
                          {loading ? 'Searching...' : 'Search'}
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Results table will go here */}
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
} 