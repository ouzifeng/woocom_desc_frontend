import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';

export default function AiSettings({
  useBrandGuidelines,
  setUseBrandGuidelines,
  useProductImage,
  setUseProductImage,
  seoTerms,
  setSeoTerms,
  useWordCount,
  setUseWordCount,
  wordCount,
  setWordCount,
  useEmojis,
  setUseEmojis,
  addSpecifications,
  setAddSpecifications
}) {
  // State to toggle whether SEO terms should be used
  const [useSeoTerms, setUseSeoTerms] = React.useState(false);

  // Set default values for the checkboxes
  React.useEffect(() => {
    setUseBrandGuidelines(true);
    setUseProductImage(true);
    setUseWordCount(true);
    setWordCount('500');
  }, [setUseBrandGuidelines, setUseProductImage, setUseWordCount, setWordCount]);

  return (
    <Box
      sx={{
        p: 2,
        border: '1px solid #ccc',
        borderRadius: 2,
        width: '100%',
        minWidth: 'auto',
      }}
    >
      <Typography variant="h6" gutterBottom>
        AI Settings
      </Typography>

      {/* All checkboxes in one FormGroup */}
      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={useBrandGuidelines} onChange={() => setUseBrandGuidelines((prev) => !prev)} />}
          label="Use brand guidelines"
        />
        <FormControlLabel
          control={<Checkbox checked={useProductImage} onChange={() => setUseProductImage((prev) => !prev)} />}
          label="Use product image"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={useSeoTerms}
              onChange={() => setUseSeoTerms((prev) => !prev)}
            />
          }
          label="Add SEO Terms"
        />
        {/* Only show the Autocomplete if "SEO Terms" is checked */}
        {useSeoTerms && (
          <Box>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={seoTerms}
              onChange={(event, newValue) => setSeoTerms(newValue)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    {...getTagProps({ index })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  placeholder="Enter SEO terms"
                  size="small"
                />
              )}
            />
          </Box>
        )}
        <FormControlLabel
          control={
            <Checkbox
              checked={useWordCount}
              onChange={() => setUseWordCount((prev) => !prev)}
            />
          }
          label="Specify Word Count"
        />
        {/* Only show the TextField if "Specify Word Count" is checked */}
        {useWordCount && (
          <Box>
            <TextField
              variant="outlined"
              placeholder="Enter word count or range (e.g., 300-500)"
              size="small"
              fullWidth
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
            />
          </Box>
        )}
        <FormControlLabel
          control={<Checkbox checked={useEmojis} onChange={() => setUseEmojis((prev) => !prev)} />}
          label="Use emojis"
        />
        <FormControlLabel
          control={<Checkbox checked={addSpecifications} onChange={() => setAddSpecifications((prev) => !prev)} />}
          label="Add specifications"
        />
      </FormGroup>
    </Box>
  );
}
