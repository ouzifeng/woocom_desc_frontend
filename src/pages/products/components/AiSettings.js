import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-root': {
    padding: '12px 16px',
    height: 'auto'
  },
  '& .MuiInputBase-input': {
    padding: '0',
    height: 'auto !important',
    minHeight: '120px'
  },
  '& .MuiOutlinedInput-root': {
    height: 'auto'
  },
  '& .MuiInputBase-multiline': {
    padding: '0'
  },
  '& textarea': {
    overflow: 'hidden !important',
    resize: 'none',
    height: 'auto !important',
    boxSizing: 'border-box',
    padding: '16px !important'
  }
}));

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
  setAddSpecifications,
  productImageUrl,
  additionalRequests,
  setAdditionalRequests
}) {
  const [useSeoTerms, setUseSeoTerms] = React.useState(false);
  const [useAdditionalRequests, setUseAdditionalRequests] = React.useState(false);

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

      <FormGroup>
        <FormControlLabel
          control={<Checkbox checked={useBrandGuidelines} onChange={() => setUseBrandGuidelines((prev) => !prev)} />}
          label="Use brand guidelines"
        />
        <FormControlLabel
          control={<Checkbox checked={useProductImage} onChange={() => setUseProductImage((prev) => !prev)} />}
          label="Use product image"
        />
        
        {useProductImage && productImageUrl && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Card sx={{ maxWidth: 300, mx: 'auto' }}>
              <CardMedia
                component="img"
                height="200"
                image={productImageUrl}
                alt="Product Image"
                sx={{ objectFit: 'contain' }}
              />
            </Card>
          </Box>
        )}
        
        <FormControlLabel
          control={
            <Checkbox
              checked={useSeoTerms}
              onChange={() => setUseSeoTerms((prev) => !prev)}
            />
          }
          label="Add SEO Terms"
        />
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
        <FormControlLabel
          control={
            <Checkbox
              checked={useAdditionalRequests}
              onChange={() => setUseAdditionalRequests((prev) => !prev)}
            />
          }
          label="Additional requests"
        />
      </FormGroup>

      {useAdditionalRequests && (
        <Box sx={{ mt: 1, mb: 2 }}>
          <TextField
            fullWidth
            multiline
            variant="outlined"
            placeholder="Add custom requests"
            value={additionalRequests}
            onChange={(e) => setAdditionalRequests(e.target.value)}
            sx={{
              '& .MuiInputBase-root': {
                padding: '12px 16px',
                height: 'auto'
              },
              '& .MuiInputBase-input': {
                padding: '0',
                height: 'auto !important',
                minHeight: '120px'
              },
              '& textarea': {
                overflow: 'hidden !important',
                resize: 'none',
                height: 'auto !important',
                boxSizing: 'border-box',
                padding: '16px !important'
              }
            }}
          />
        </Box>
      )}
    </Box>
  );
}
