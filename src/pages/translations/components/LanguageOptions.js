import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';

// Languages in their native names, alphabetically ordered
const languages = [
  { code: 'ar', name: 'العربية' },        // Arabic
  { code: 'be', name: 'Беларуская' },     // Belarusian
  { code: 'bg', name: 'Български' },      // Bulgarian
  { code: 'bn', name: 'বাংলা' },          // Bengali
  { code: 'bs', name: 'Bosanski' },       // Bosnian
  { code: 'ca', name: 'Català' },         // Catalan
  { code: 'cs', name: 'Čeština' },        // Czech
  { code: 'cy', name: 'Cymraeg' },        // Welsh
  { code: 'da', name: 'Dansk' },          // Danish
  { code: 'de', name: 'Deutsch' },        // German
  { code: 'el', name: 'Ελληνικά' },       // Greek
  { code: 'en', name: 'English' },        // English
  { code: 'es', name: 'Español' },        // Spanish
  { code: 'et', name: 'Eesti' },          // Estonian
  { code: 'eu', name: 'Euskara' },        // Basque
  { code: 'fa', name: 'فارسی' },         // Persian
  { code: 'fi', name: 'Suomi' },          // Finnish
  { code: 'fr', name: 'Français' },       // French
  { code: 'ga', name: 'Gaeilge' },        // Irish
  { code: 'gd', name: 'Gàidhlig' },       // Scottish Gaelic
  { code: 'gl', name: 'Galego' },         // Galician
  { code: 'he', name: 'עברית' },         // Hebrew
  { code: 'hi', name: 'हिन्दी' },          // Hindi
  { code: 'hr', name: 'Hrvatski' },       // Croatian
  { code: 'hu', name: 'Magyar' },         // Hungarian
  { code: 'hy', name: 'Հայերեն' },       // Armenian
  { code: 'id', name: 'Bahasa Indonesia' }, // Indonesian
  { code: 'is', name: 'Íslenska' },       // Icelandic
  { code: 'it', name: 'Italiano' },       // Italian
  { code: 'ja', name: '日本語' },          // Japanese
  { code: 'ka', name: 'ქართული' },       // Georgian
  { code: 'ko', name: '한국어' },          // Korean
  { code: 'lt', name: 'Lietuvių' },       // Lithuanian
  { code: 'lv', name: 'Latviešu' },       // Latvian
  { code: 'mk', name: 'Македонски' },     // Macedonian
  { code: 'ms', name: 'Bahasa Melayu' },  // Malay
  { code: 'mt', name: 'Malti' },          // Maltese
  { code: 'nl', name: 'Nederlands' },      // Dutch
  { code: 'no', name: 'Norsk' },          // Norwegian
  { code: 'pl', name: 'Polski' },         // Polish
  { code: 'pt', name: 'Português' },      // Portuguese
  { code: 'ro', name: 'Română' },         // Romanian
  { code: 'ru', name: 'Русский' },        // Russian
  { code: 'sk', name: 'Slovenčina' },     // Slovak
  { code: 'sl', name: 'Slovenščina' },    // Slovenian
  { code: 'sq', name: 'Shqip' },          // Albanian
  { code: 'sr', name: 'Српски' },         // Serbian
  { code: 'sv', name: 'Svenska' },        // Swedish
  { code: 'th', name: 'ไทย' },            // Thai
  { code: 'tr', name: 'Türkçe' },         // Turkish
  { code: 'uk', name: 'Українська' },     // Ukrainian
  { code: 'ur', name: 'اردو' },           // Urdu
  { code: 'vi', name: 'Tiếng Việt' },     // Vietnamese
  { code: 'zh', name: '中文' },           // Chinese
];

export default function LanguageOptions({ anchorEl, open, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (language) => {
    onSelect(language);
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          maxHeight: 400,
          width: '300px',
        }
      }}
    >
      <Box sx={{ p: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search languages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </Box>
      
      {filteredLanguages.map((language) => (
        <MenuItem 
          key={language.code} 
          onClick={() => handleSelect(language)}
          sx={{ 
            py: 1,
            '&:hover': {
              backgroundColor: 'action.hover'
            }
          }}
        >
          <ListItemText 
            primary={language.name}
            secondary={language.code.toUpperCase()}
          />
        </MenuItem>
      ))}
    </Menu>
  );
}
