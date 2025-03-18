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
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';

const emotionalTriggers = [
  'Aspiration', 'Belonging', 'Curiosity', 'Exclusivity', 'FOMO', 
  'Guilt', 'Joy/Excitement', 'Nostalgia', 'Security', 'Trust'
];

export default function ProductPositioning() {
  const [user] = useAuthState(auth);
  const [uniqueSellingPoints, setUniqueSellingPoints] = React.useState('');
  const [productType, setProductType] = React.useState('');
  const [emotionalTriggersSelected, setEmotionalTriggersSelected] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'ProductPositioning', 'settings');
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUniqueSellingPoints(data.uniqueSellingPoints || '');
            setProductType(data.productType || '');
            setEmotionalTriggersSelected(data.emotionalTriggers || []);
          }
        } catch (error) {
          console.error('Error fetching product positioning data:', error);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      const productPositioningData = {};
      if (uniqueSellingPoints) productPositioningData.uniqueSellingPoints = uniqueSellingPoints;
      if (productType) productPositioningData.productType = productType;
      if (emotionalTriggersSelected.length > 0) productPositioningData.emotionalTriggers = emotionalTriggersSelected;

      try {
        const userDocRef = doc(db, 'users', user.uid, 'ProductPositioning', 'settings');
        await setDoc(userDocRef, productPositioningData, { merge: true });
        console.log('Product positioning data saved successfully');
        setModalOpen(true);
      } catch (error) {
        console.error('Error saving product positioning data:', error);
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
            Product Positioning
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
                <TableCell>Unique Selling Points (USPs)</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter unique selling points"
                    fullWidth
                    value={uniqueSellingPoints}
                    onChange={(e) => setUniqueSellingPoints(e.target.value)}
                  />
                </TableCell>
                <TableCell>Emphasize key differentiators.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Product Type</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter product type"
                    fullWidth
                    value={productType}
                    onChange={(e) => setProductType(e.target.value)}
                  />
                </TableCell>
                <TableCell>Price and market positioning clarity.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Emotional Triggers</TableCell>
                <TableCell>
                  <Autocomplete
                    multiple
                    options={emotionalTriggers}
                    value={emotionalTriggersSelected}
                    onChange={(event, newValue) => setEmotionalTriggersSelected(newValue)}
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
                        placeholder="Select emotional triggers"
                        fullWidth
                      />
                    )}
                  />
                </TableCell>
                <TableCell>Drive purchase motivation.</TableCell>
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
            Product positioning data saved successfully!
          </Alert>
        </Box>
      </Modal>
    </Box>
  );
}
