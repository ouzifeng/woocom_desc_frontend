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
import { useBrand } from '../../../contexts/BrandContext';

const emotionalTriggers = [
  'Aspiration', 'Belonging', 'Curiosity', 'Exclusivity', 'FOMO', 
  'Guilt', 'Joy/Excitement', 'Nostalgia', 'Security', 'Trust'
];

export default function ProductPositioning() {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [uniqueSellingPoints, setUniqueSellingPoints] = React.useState('');
  const [productType, setProductType] = React.useState('');
  const [emotionalTriggersSelected, setEmotionalTriggersSelected] = React.useState([]);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      if (user && activeBrandId) {
        try {
          setError('');
          const docRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'ProductPositioning', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUniqueSellingPoints(data.uniqueSellingPoints || '');
            setProductType(data.productType || '');
            setEmotionalTriggersSelected(data.emotionalTriggers || []);
          }
        } catch (error) {
          console.error('Error fetching product positioning data:', error);
          setError('Failed to load product positioning settings');
        }
      }
    };
    fetchData();
  }, [user, activeBrandId]);

  const handleSave = async () => {
    if (user && activeBrandId) {
      const productPositioningData = {};
      if (uniqueSellingPoints) productPositioningData.uniqueSellingPoints = uniqueSellingPoints;
      if (productType) productPositioningData.productType = productType;
      if (emotionalTriggersSelected.length > 0) productPositioningData.emotionalTriggers = emotionalTriggersSelected;
      
      productPositioningData.brandId = activeBrandId;

      try {
        const docRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'ProductPositioning', 'settings');
        await setDoc(docRef, productPositioningData, { merge: true });
        console.log('Product positioning data saved successfully');
        setModalOpen(true);
        setError('');
      } catch (error) {
        console.error('Error saving product positioning data:', error);
        setError('Failed to save product positioning settings');
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
        <Alert severity="warning">Please select a brand to view product positioning settings.</Alert>
      </Box>
    );
  }

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
        aria-labelledby="save-confirmation-modal"
        aria-describedby="confirmation-of-product-positioning-save"
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
          <Typography id="confirmation-of-product-positioning-save">
            Your product positioning settings have been updated.
          </Typography>
          <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
