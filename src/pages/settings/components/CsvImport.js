import * as React from 'react';
import { Box, Typography, Button, Card } from '@mui/material';
import { styled } from '@mui/material/styles';

const ImportCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignSelf: 'center',
  width: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow:
    'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
  ...theme.applyStyles('dark', {
    boxShadow:
      'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
  }),
}));

export default function CsvImport() {
  return (
    <ImportCard variant="outlined">
      <Typography variant="h6" gutterBottom align="center">
        CSV Import
      </Typography>
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Button variant="contained" component="label">
          Upload CSV
          <input type="file" hidden />
        </Button>
               <Typography variant="p" gutterBottom align="left">
            Import products via CSV. Each CSV should have 4 columns with these exact headers:
        </Typography>
               <Typography variant="p" gutterBottom align="left">
            - product_id
        </Typography>
               <Typography variant="p" gutterBottom align="left">
            - name
        </Typography>
               <Typography variant="p" gutterBottom align="left">
            - image_url
        </Typography>
               <Typography variant="p" gutterBottom align="left">
            - description
        </Typography>        
        
        <Typography variant="p" gutterBottom align="left">
            Download the sample CSV below
        </Typography>   
        <Button variant="contained" component="label">
          Download Sample CSV
          <input type="file" hidden />
        </Button>             
      </Box>
    </ImportCard>
  );
}
