// SearchControls.jsx
import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';

export default function SearchControls({
  keywords,
  setKeywords,
  country,
  setCountry,
  countries,
  countriesLoading,
  language,
  setLanguage,
  languages,
  languagesLoading,
  rangeLabel,
  setRangeLabel,
  includePartners,
  setIncludePartners,
  handleSearch
}) {
  return (
    <>
      {/* Top row of controls - similar to Products page */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 3,
        gap: 2
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={!keywords.trim()}
          >
            Search Keywords
          </Button>
        </Box>
      </Box>

      {/* Search filters row */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap',
        gap: 2,
        mb: 2 
      }}>
        <TextField
          label="Enter keywords (comma separated, max 20)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g., japanese knives, gyuto knife"
          size="small"
          sx={{ flexGrow: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Autocomplete
            options={countries}
            loading={countriesLoading}
            value={country}
            onChange={(e, val) => setCountry(val)}
            getOptionLabel={(option) => option.location_name || ''}
            size="small"
            sx={{ width: 200 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Country"
                size="small"
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
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Autocomplete
            options={languages}
            loading={languagesLoading}
            value={language}
            onChange={(e, val) => setLanguage(val)}
            getOptionLabel={(option) => option.language_name || ''}
            size="small"
            sx={{ width: 200 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Language"
                size="small"
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
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Date Range</InputLabel>
          <Select
            value={rangeLabel}
            onChange={(e) => setRangeLabel(e.target.value)}
            label="Date Range"
          >
            <MenuItem value="30d">Last 30 days</MenuItem>
            <MenuItem value="ytd">Year to Date</MenuItem>
            <MenuItem value="1y">1 Year</MenuItem>
            <MenuItem value="5y">5 Years</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Partners switch */}
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={includePartners}
              onChange={(e) => setIncludePartners(e.target.checked)}
              size="small"
            />
          }
          label="Include Google Search Partners"
        />
      </Box>
    </>
  );
}
