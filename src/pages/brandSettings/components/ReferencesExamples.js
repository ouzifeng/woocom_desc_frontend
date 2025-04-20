import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Alert from '@mui/material/Alert';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useBrand } from '../../../contexts/BrandContext';

export default function ReferencesExamples() {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [referenceUrls, setReferenceUrls] = React.useState('');
  const [exampleDescriptions, setExampleDescriptions] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      if (user && activeBrandId) {
        try {
          setError('');
          // Updated path to use brand isolation
          const docRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'ReferencesExamples', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setReferenceUrls(data.referenceUrls || '');
            setExampleDescriptions(data.exampleDescriptions || '');
          }
        } catch (error) {
          console.error('Error fetching references and examples data:', error);
          setError('Failed to load references and examples settings');
        }
      }
    };
    fetchData();
  }, [user, activeBrandId]);

  const handleSave = async () => {
    if (user && activeBrandId) {
      const referencesExamplesData = {};
      if (referenceUrls) referencesExamplesData.referenceUrls = referenceUrls;
      if (exampleDescriptions) referencesExamplesData.exampleDescriptions = exampleDescriptions;
      
      // Add brandId to the data
      referencesExamplesData.brandId = activeBrandId;

      try {
        // Updated path to use brand isolation
        const docRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'ReferencesExamples', 'settings');
        await setDoc(docRef, referencesExamplesData, { merge: true });
        console.log('References and examples data saved successfully');
        setModalOpen(true);
        setError('');
      } catch (error) {
        console.error('Error saving references and examples data:', error);
        setError('Failed to save references and examples settings');
      }
    } else if (!activeBrandId) {
      setError('Please select a brand first');
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  if (!activeBrandId) {
    return (
      <Box sx={{ mb: 4 }}>
        <Alert severity="warning">Please select a brand to view references and examples settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ width: '100%', overflow: 'hidden' }} elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2, mx: 2 }}>
          <Typography variant="h6" gutterBottom>
            References & Examples
          </Typography>
          <Button variant="contained" color="primary" onClick={handleSave}>
            Save
          </Button>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        <TableContainer>
          <Table sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: '20%' }}>Item</TableCell>
                <TableCell sx={{ width: '40%' }}>Input</TableCell>
                <TableCell sx={{ width: '40%' }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Reference URLs</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Brand URLs that you like the approach of"
                    fullWidth
                    value={referenceUrls}
                    onChange={(e) => setReferenceUrls(e.target.value)}
                  />
                </TableCell>
                <TableCell>Provide clear guidelines for AI.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Reference Product Pages</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter example product page URLs"
                    multiline
                    fullWidth
                    value={exampleDescriptions}
                    onChange={(e) => setExampleDescriptions(e.target.value)}
                  />
                </TableCell>
                <TableCell>Comma Separated</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="save-confirmation-modal"
        aria-describedby="confirmation-of-references-examples-save"
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 400, 
          bgcolor: 'background.paper', 
          boxShadow: 24, 
          p: 4,
          borderRadius: 1
        }}>
          <Typography id="save-confirmation-modal" variant="h6" component="h2" gutterBottom>
            Changes Saved Successfully
          </Typography>
          <Typography id="confirmation-of-references-examples-save">
            Your references and examples settings have been updated.
          </Typography>
          <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
