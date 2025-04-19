import * as React from 'react';
import { useState } from 'react';
import { Box, Typography, Button, Card, Alert } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import Papa from 'papaparse';
import { useToast } from '../../../components/ToasterAlert';
import { useBrand } from '../../../contexts/BrandContext';
import CircularProgress from '@mui/material/CircularProgress';

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
  const { activeBrand, activeBrandId, loading: brandLoading } = useBrand();
  const [importStatus, setImportStatus] = useState('');
  const [error, setError] = useState(null);
  const [importing, setImporting] = useState(false);
  const { showToast } = useToast();

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if we have an active brand
    if (!activeBrandId) {
      setError('No active brand selected. Please select a brand before importing products.');
      return;
    }

    setImporting(true);
    setError(null);
    
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const data = results.data;
        setImportStatus(`Found ${data.length} rows. Starting import...`);
        
        if (!user) {
          setError('User not authenticated');
          setImporting(false);
          return;
        }
        
        try {
          // Use the brand products collection path
          const brandProductsCollection = collection(
            db, 
            'users', 
            user.uid, 
            'brands', 
            activeBrandId, 
            'products'
          );
          
          console.log(`Importing products to: users/${user.uid}/brands/${activeBrandId}/products`);
          
          let importedCount = 0;
          for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (row.product_id) { // Check if product_id is present
              const productData = {
                id: row.product_id,
                name: row.name,
                image: row.image_url,
                description: row.description,
                brandId: activeBrandId, // Store the brand ID with the product
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              
              await setDoc(doc(brandProductsCollection, row.product_id), productData);
              importedCount++;
              setImportStatus(`Importing ${importedCount} of ${data.length}...`);
            }
          }
          
          showToast(`CSV import successful. Imported ${importedCount} of ${data.length} rows into ${activeBrand.name}.`, 'success');
          setImportStatus('');
        } catch (error) {
          console.error('Error importing CSV:', error);
          setError(`Failed to import CSV: ${error.message}`);
          showToast('Failed to import CSV', 'error');
        } finally {
          setImporting(false);
        }
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setError(`Failed to parse CSV file: ${error.message}`);
        showToast('Failed to parse CSV file', 'error');
        setImporting(false);
        setImportStatus('');
      },
    });
  };

  return (
    <SettingsCard variant="outlined">
      <Typography variant="h6" gutterBottom align="center">
        CSV Import
      </Typography>
      
      {brandLoading ? (
        <Box display="flex" justifyContent="center" my={3}>
          <CircularProgress />
        </Box>
      ) : !activeBrand ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please select a brand before importing products.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Products will be imported to: <strong>{activeBrand.name}</strong>
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box
        component="form"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Button 
          variant="contained" 
          component="label"
          disabled={importing || brandLoading || !activeBrand}
        >
          {importing ? 'Importing...' : 'Upload CSV'}
          <input 
            type="file" 
            hidden 
            onChange={handleFileUpload} 
            accept=".csv"
            disabled={importing || brandLoading || !activeBrand}
          />
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
        <Button 
          variant="contained" 
          href="/sample.csv" 
          download
          disabled={importing}
        >
          Download Sample CSV
        </Button>
        
        {importing && (
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="textSecondary">
              {importStatus}
            </Typography>
          </Box>
        )}
      </Box>
    </SettingsCard>
  );
}
