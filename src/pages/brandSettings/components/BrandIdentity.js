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
import { useBrand } from '../../../contexts/BrandContext';

const archetypes = ['Hero', 'Rebel', 'Caregiver', 'Creator', 'Sage'];
const tones = ['Friendly', 'Professional', 'Casual', 'Formal'];
const pronounOptions = ['You/Your (Direct)', 'We/Our'];
const vocabLevels = ['Simple', 'Intermediate', 'Advanced'];

export default function BrandIdentity() {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [brandName, setBrandName] = React.useState('');
  const [brandTagline, setBrandTagline] = React.useState('');
  const [brandArchetype, setBrandArchetype] = React.useState('');
  const [brandValues, setBrandValues] = React.useState('');
  const [brandStory, setBrandStory] = React.useState('');
  const [toneOfVoice, setToneOfVoice] = React.useState('');
  const [pronouns, setPronouns] = React.useState('');
  const [vocabLevel, setVocabLevel] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const fetchData = async () => {
      if (user && activeBrandId) {
        try {
          setError('');
          const docRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'BrandIdentity', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBrandName(data.brandName || '');
            setBrandTagline(data.brandTagline || '');
            setBrandArchetype(data.brandArchetype || '');
            setBrandValues(data.brandValues || '');
            setBrandStory(data.brandStory || '');
            setToneOfVoice(data.toneOfVoice || '');
            setPronouns(data.pronouns || '');
            setVocabLevel(data.vocabLevel || '');
          }
        } catch (error) {
          console.error('Error fetching brand identity data:', error);
          setError('Failed to load brand settings');
        }
      }
    };
    fetchData();
  }, [user, activeBrandId]);

  const handleSave = async () => {
    if (user && activeBrandId) {
      const brandIdentityData = {};
      if (brandName) brandIdentityData.brandName = brandName;
      if (brandTagline) brandIdentityData.brandTagline = brandTagline;
      if (brandArchetype) brandIdentityData.brandArchetype = brandArchetype;
      if (brandValues) brandIdentityData.brandValues = brandValues;
      if (brandStory) brandIdentityData.brandStory = brandStory;
      if (toneOfVoice) brandIdentityData.toneOfVoice = toneOfVoice;
      if (pronouns) brandIdentityData.pronouns = pronouns;
      if (vocabLevel) brandIdentityData.vocabLevel = vocabLevel;
      
      brandIdentityData.brandId = activeBrandId;

      try {
        const docRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'BrandIdentity', 'settings');
        await setDoc(docRef, brandIdentityData, { merge: true });
        console.log('Brand identity data saved successfully');
        setModalOpen(true);
        setError('');
      } catch (error) {
        console.error('Error saving brand identity data:', error);
        setError('Failed to save brand settings');
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
        <Alert severity="warning">Please select a brand to view brand settings.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Paper sx={{ width: '100%', overflow: 'hidden' }} elevation={3}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2, mx: 2 }}>
          <Typography variant="h6" gutterBottom>
            Brand Identity
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
                <TableCell>Brand Name</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter brand name"
                    fullWidth
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                  />
                </TableCell>
                <TableCell>Clearly identifies brand.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Brand Tagline</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter brand tagline"
                    fullWidth
                    value={brandTagline}
                    onChange={(e) => setBrandTagline(e.target.value)}
                  />
                </TableCell>
                <TableCell>Communicates core brand message.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Brand Archetype</TableCell>
                <TableCell>
                  <TextField
                    select
                    variant="outlined"
                    placeholder="Select brand archetype"
                    fullWidth
                    value={brandArchetype}
                    onChange={(e) => setBrandArchetype(e.target.value)}
                  >
                    {archetypes.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>Align messaging with universal storytelling frameworks.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Brand Values</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter brand values"
                    fullWidth
                    value={brandValues}
                    onChange={(e) => setBrandValues(e.target.value)}
                  />
                </TableCell>
                <TableCell>Consistency with core beliefs.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Brand Story</TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    placeholder="Enter brand story"
                    fullWidth
                    value={brandStory}
                    onChange={(e) => setBrandStory(e.target.value)}
                  />
                </TableCell>
                <TableCell>Humanizes brand and deepens customer engagement.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Tone of Voice</TableCell>
                <TableCell>
                  <TextField
                    select
                    variant="outlined"
                    placeholder="Select tone of voice"
                    fullWidth
                    value={toneOfVoice}
                    onChange={(e) => setToneOfVoice(e.target.value)}
                  >
                    {tones.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>Maintain consistency in brand voice.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Pronouns</TableCell>
                <TableCell>
                  <TextField
                    select
                    variant="outlined"
                    placeholder="Select pronouns"
                    fullWidth
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                  >
                    {pronounOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>Establish voice clarity.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Vocabulary Level</TableCell>
                <TableCell>
                  <TextField
                    select
                    variant="outlined"
                    placeholder="Select vocabulary level"
                    fullWidth
                    value={vocabLevel}
                    onChange={(e) => setVocabLevel(e.target.value)}
                  >
                    {vocabLevels.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>Tailor to audience understanding.</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="save-confirmation-modal"
        aria-describedby="confirmation-of-brand-identity-save"
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
          borderRadius: 1,
        }}>
          <Typography id="save-confirmation-modal" variant="h6" component="h2" gutterBottom>
            Changes Saved Successfully
          </Typography>
          <Typography id="confirmation-of-brand-identity-save">
            Your brand identity settings have been updated.
          </Typography>
          <Button onClick={handleCloseModal} sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </Box>
  );
}
