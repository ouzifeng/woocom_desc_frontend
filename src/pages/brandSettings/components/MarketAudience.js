import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
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

const genders = ['Male', 'Female', 'Mixed'];
const regionalHumorOptions = ['Yes', 'No'];

export default function MarketAudience() {
  const [user] = useAuthState(auth);
  const [customerAgeRange, setCustomerAgeRange] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [gender, setGender] = React.useState('');
  const [regionalHumor, setRegionalHumor] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid, 'MarketAudience', 'settings');
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCustomerAgeRange(data.customerAgeRange || '');
            setLocation(data.location || '');
            setGender(data.gender || '');
            setRegionalHumor(data.regionalHumor || '');
          }
        } catch (error) {
          console.error('Error fetching market audience data:', error);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (user) {
      const marketAudienceData = {};
      if (customerAgeRange) marketAudienceData.customerAgeRange = customerAgeRange;
      if (location) marketAudienceData.location = location;
      if (gender) marketAudienceData.gender = gender;
      if (regionalHumor) marketAudienceData.regionalHumor = regionalHumor;

      try {
        const userDocRef = doc(db, 'users', user.uid, 'MarketAudience', 'settings');
        await setDoc(userDocRef, marketAudienceData, { merge: true });
        console.log('Market audience data saved successfully');
        setModalOpen(true);
      } catch (error) {
        console.error('Error saving market audience data:', error);
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
            Market & Audience
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
                <TableCell>Customer Age Range</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="18-25"
                    fullWidth
                    value={customerAgeRange}
                    onChange={(e) => setCustomerAgeRange(e.target.value)}
                  />
                </TableCell>
                <TableCell>Rough age range of your customer profile</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Location</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter country or countries"
                    fullWidth
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </TableCell>
                <TableCell>Separated by commas</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Gender</TableCell>
                <TableCell>
                  <TextField
                    select
                    variant="outlined"
                    placeholder="Select gender"
                    fullWidth
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    {genders.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>Male/Female/Mixed</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Use Regional Humor?</TableCell>
                <TableCell>
                  <TextField
                    select
                    variant="outlined"
                    placeholder="Select option"
                    fullWidth
                    value={regionalHumor}
                    onChange={(e) => setRegionalHumor(e.target.value)}
                  >
                    {regionalHumorOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>Avoid cultural misunderstanding.</TableCell>
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
            Market audience data saved successfully!
          </Alert>
        </Box>
      </Modal>
    </Box>
  );
}
