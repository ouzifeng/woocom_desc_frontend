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

export default function ReferencesExamples() {
  const [user] = useAuthState(auth);
  const [referenceUrls, setReferenceUrls] = React.useState('');
  const [exampleDescriptions, setExampleDescriptions] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'ReferencesExamples', 'settings');
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setReferenceUrls(data.referenceUrls || '');
            setExampleDescriptions(data.exampleDescriptions || '');
          }
        } catch (error) {
          console.error('Error fetching references and examples data:', error);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      const referencesExamplesData = {};
      if (referenceUrls) referencesExamplesData.referenceUrls = referenceUrls;
      if (exampleDescriptions) referencesExamplesData.exampleDescriptions = exampleDescriptions;

      try {
        const userDocRef = doc(db, 'users', user.uid, 'ReferencesExamples', 'settings');
        await setDoc(userDocRef, referencesExamplesData, { merge: true });
        console.log('References and examples data saved successfully');
        setModalOpen(true);
      } catch (error) {
        console.error('Error saving references and examples data:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

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
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <Alert onClose={handleCloseModal} severity="success">
            References and examples data saved successfully!
          </Alert>
        </Box>
      </Modal>
    </Box>
  );
}
