import * as React from 'react';
import { useState } from 'react';
import { Box, Typography, Button, Card, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import Papa from 'papaparse';

const SettingsCard = styled(Card)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  padding: theme.spacing(4),
  gap: theme.spacing(2),
  margin: 'auto',
  [theme.breakpoints.up('sm')]: {
    maxWidth: '450px',
  },
  boxShadow: '0px 4px 10px rgba(0,0,0,0.08)',
  overflow: 'auto'
}));

export default function CsvImport() {
  const [user] = useAuthState(auth);
  const [message, setMessage] = useState('');
  const [importStatus, setImportStatus] = useState('');

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          const data = results.data;
          setImportStatus(`Found ${data.length} rows. Starting import...`);
          if (user) {
            try {
              const userProductsCollection = collection(db, 'users', user.uid, 'products');
              let importedCount = 0;
              for (let i = 0; i < data.length; i++) {
                const row = data[i];
                if (row.product_id) { // Check if product_id is present
                  const productData = {
                    id: row.product_id,
                    name: row.name,
                    image: row.image_url,
                    description: row.description,
                  };
                  await setDoc(doc(userProductsCollection, row.product_id), productData);
                  importedCount++;
                  setImportStatus(`Importing ${importedCount} of ${data.length}...`);
                }
              }
              setMessage(`CSV import successful. Imported ${importedCount} of ${data.length} rows.`);
            } catch (error) {
              console.error('Error importing CSV:', error);
              setMessage('Failed to import CSV');
            }
          }
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setMessage('Failed to parse CSV');
        },
      });
    }
  };

  return (
    <SettingsCard variant="outlined">
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
          <input type="file" hidden onChange={handleFileUpload} />
        </Button>
        <Typography variant="body1" gutterBottom align="left">
          Import products via CSV. Each CSV should have 4 columns with these exact headers:
        </Typography>
        <Typography variant="body1" gutterBottom align="left">
          - product_id
        </Typography>
        <Typography variant="body1" gutterBottom align="left">
          - name
        </Typography>
        <Typography variant="body1" gutterBottom align="left">
          - image_url
        </Typography>
        <Typography variant="body1" gutterBottom align="left">
          - description
        </Typography>
        <Typography variant="body1" gutterBottom align="left">
          Download the sample CSV below:
        </Typography>
        <Button variant="contained" href="/sample.csv" download>
          Download Sample CSV
        </Button>
        {importStatus && (
          <Alert severity="info">
            {importStatus}
          </Alert>
        )}
        {message && (
          <Alert severity={message.includes('successful') ? 'success' : 'error'}>
            {message}
          </Alert>
        )}
      </Box>
    </SettingsCard>
  );
}
