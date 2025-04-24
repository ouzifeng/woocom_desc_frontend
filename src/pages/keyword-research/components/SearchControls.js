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
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';

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
  handleSearch,
  onSuggestClick
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
            sx={{
              '&.Mui-disabled': {
                color: 'grey',
                backgroundColor: 'white',
              }
            }}
          >
            Search Keywords
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onSuggestClick}
          >
            Suggest Keywords
          </Button>
        </Box>
      </Box>

      {/* Search filters row */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            label="Keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Enter keywords (comma separated)"
            size="small"
          />
          <Autocomplete
            options={countries}
            getOptionLabel={(option) => option?.location_name || ''}
            value={country}
            onChange={(_, newValue) => setCountry(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Country"
                size="small"
                fullWidth
              />
            )}
            sx={{ minWidth: 200 }}
            isOptionEqualToValue={(option, value) => option?.location_code === value?.location_code}
          />
          <Autocomplete
            options={languages}
            getOptionLabel={(option) => option?.language_name || ''}
            value={language}
            onChange={(_, newValue) => setLanguage(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Language"
                size="small"
                fullWidth
              />
            )}
            sx={{ minWidth: 200 }}
            isOptionEqualToValue={(option, value) => option?.language_code === value?.language_code}
            getOptionKey={(option) => option?.language_code || Math.random().toString()}
          />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={rangeLabel}
              label="Date Range"
              onChange={(e) => setRangeLabel(e.target.value)}
            >
              <MenuItem value="last_30_days">Last 30 Days</MenuItem>
              <MenuItem value="last_90_days">Last 90 Days</MenuItem>
              <MenuItem value="last_12_months">Last 12 Months</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Include data from Google's search partner network to get a broader view of search activity.">
            <FormControlLabel
              control={
                <Switch
                  checked={includePartners}
                  onChange={(e) => setIncludePartners(e.target.checked)}
                />
              }
              label="Include Google Search Partners"
            />
          </Tooltip>
        </Box>
      </Box>
    </>
  );
}
