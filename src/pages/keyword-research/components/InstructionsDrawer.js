import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Divider,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  Search as SearchIcon,
  Language as LanguageIcon,
  Public as CountryIcon,
  CalendarMonth as CalendarIcon,
  Save as SaveIcon,
  Tab as TabIcon,
} from '@mui/icons-material';

export default function InstructionsDrawer({ open, onClose }) {
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 400,
          p: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onClose} sx={{ mr: 1 }}>
          <HelpIcon />
        </IconButton>
        <Typography variant="h6">Keyword Research Guide</Typography>
      </Box>

      <List>
        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <SearchIcon fontSize="small" />
                <Typography variant="subtitle1">Keyword Input</Typography>
              </Box>
            }
            secondary="Enter up to 20 keywords separated by commas. Each keyword will be researched individually. Use specific, relevant keywords for your business."
          />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CountryIcon fontSize="small" />
                <Typography variant="subtitle1">Location Selection</Typography>
              </Box>
            }
            secondary="Select a country to get region-specific search data. This affects search volume and competition metrics. Choose the market you want to target."
          />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <LanguageIcon fontSize="small" />
                <Typography variant="subtitle1">Language Selection</Typography>
              </Box>
            }
            secondary="Select a language to get search data in that language. This affects keyword suggestions and search intent. Choose the language your target audience speaks."
          />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <CalendarIcon fontSize="small" />
                <Typography variant="subtitle1">Date Range</Typography>
              </Box>
            }
            secondary="Choose a time period for the search data. Longer ranges provide more historical data but may take longer to process. Use this to analyze trends."
          />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <SearchIcon fontSize="small" />
                <Typography variant="subtitle1">Search Partners</Typography>
              </Box>
            }
            secondary="Include data from Google's search partner network to get a broader view of search activity. This gives you more comprehensive data."
          />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <SaveIcon fontSize="small" />
                <Typography variant="subtitle1">Saving Keywords</Typography>
              </Box>
            }
            secondary="Click the save icon next to any keyword to add it to your saved keywords. You can access these later in the 'Saved Keywords' tab."
          />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem>
          <ListItemText
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <TabIcon fontSize="small" />
                <Typography variant="subtitle1">Multiple Tabs</Typography>
              </Box>
            }
            secondary="Use different tabs to research different sets of keywords. Each tab maintains its own search history and saved keywords."
          />
        </ListItem>
      </List>
    </Drawer>
  );
} 