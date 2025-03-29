import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import SaveIcon from '@mui/icons-material/Save';
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import Modal from '@mui/material/Modal';

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

export default function BrandStrategyPage(props) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [formData, setFormData] = React.useState({
    // Mission & Vision
    missionStatement: '',
    visionStatement: '',
    
    // Audience & Market
    primaryAudience: '',
    customerPainPoints: '',
    competitiveLandscape: '',
    
    // Brand Positioning
    positioningStatement: '',
    
    // Differentiation
    uniqueSellingPoints: '',
    proofPoints: '',
    onlyWeStatement: '',
    
    // Brand Values
    coreValues: '',
    valueDefinitions: '',
    
    // Brand Promise
    brandPromise: '',
    
    // Brand Personality
    brandPersonality: '',
    toneOfVoice: '',
    vocabularyGuidelines: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const docRef = doc(db, 'users', user.uid, 'BrandStrategy', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFormData(docSnap.data());
          }
        } catch (error) {
          console.error('Error fetching brand strategy data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'BrandStrategy', 'settings');
      await setDoc(docRef, formData, { merge: true });
      setModalOpen(true);
      setTimeout(() => setModalOpen(false), 3000);
    } catch (error) {
      console.error('Error saving brand strategy data:', error);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  if (loading) {
    return (
      <AppTheme {...props}>
        <CssBaseline enableColorScheme />
        <Box sx={{ display: 'flex' }}>
          <SideMenu user={user} />
          <AppNavbar />
          <Box
            component="main"
            sx={(theme) => ({
              flexGrow: 1,
              backgroundColor: theme.vars
                ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
                : alpha(theme.palette.background.default, 1),
              overflow: 'auto',
            })}
          >
            <Stack
              spacing={2}
              sx={{
                alignItems: 'center',
                mx: 3,
                pb: 5,
                mt: { xs: 8, md: 0 },
              }}
            >
              <Header />
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h4" component="h1">
                    Brand Strategy
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    Create and manage your brand strategy
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Box sx={{ display: 'flex' }}>
        <SideMenu user={user} />
        <AppNavbar />
        <Box
          component="main"
          sx={(theme) => ({
            flexGrow: 1,
            backgroundColor: theme.vars
              ? `rgba(${theme.vars.palette.background.defaultChannel} / 1)`
              : alpha(theme.palette.background.default, 1),
            overflow: 'auto',
          })}
        >
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              mx: 3,
              pb: 5,
              mt: { xs: 8, md: 0 },
            }}
          >
            <Header />
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h4" component="h1">
                    Brand Strategy
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      component="a" 
                      href="/brand_strategy.docx" 
                      download
                    >
                      Download Example
                    </Button>
                    <Button variant="contained" color="primary" onClick={handleSave}>
                      Save All
                    </Button>
                  </Box>
                </Box>

                {/* Mission & Vision Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Mission & Vision</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Mission Statement</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            fullWidth
                            placeholder="Example: 'To empower busy parents by delivering healthy, convenient meal options, while minimizing environmental impact.'"
                            value={formData.missionStatement}
                            onChange={handleChange('missionStatement')}
                          />
                        </TableCell>
                        <TableCell>Your brand's core purpose and reason for being.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vision Statement</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="Example: 'To become the go-to brand for eco-friendly household products across North America.'"
                            fullWidth
                            value={formData.visionStatement}
                            onChange={handleChange('visionStatement')}
                          />
                        </TableCell>
                        <TableCell>Your brand's aspirational future state.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Audience & Market Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Audience & Market</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Primary Target Audience</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="Who is your dream customer? Consider demographics (age, location, income) and psychographics (values, lifestyle)."
                            fullWidth
                            value={formData.primaryAudience}
                            onChange={handleChange('primaryAudience')}
                          />
                        </TableCell>
                        <TableCell>Define your ideal customer profile and target market.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Customer Pain Points</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="What problems, frustrations, or ambitions does this audience have that your product solves?"
                            fullWidth
                            value={formData.customerPainPoints}
                            onChange={handleChange('customerPainPoints')}
                          />
                        </TableCell>
                        <TableCell>Identify the key problems your brand solves.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Competitive Landscape</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="List your top 2-3 competitors and what differentiates your brand from each."
                            fullWidth
                            value={formData.competitiveLandscape}
                            onChange={handleChange('competitiveLandscape')}
                          />
                        </TableCell>
                        <TableCell>Analyze your position relative to competitors.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Brand Positioning Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Brand Positioning</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Positioning Statement</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="For [target audience], [Brand Name] is the [category] that [unique benefit], because [reason/differentiator]."
                            fullWidth
                            value={formData.positioningStatement}
                            onChange={handleChange('positioningStatement')}
                          />
                        </TableCell>
                        <TableCell>Define your unique place in the market.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Differentiation & USP Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Differentiation & USP</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Unique Selling Points</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="List your top 3 unique benefits or features that set you apart."
                            fullWidth
                            value={formData.uniqueSellingPoints}
                            onChange={handleChange('uniqueSellingPoints')}
                          />
                        </TableCell>
                        <TableCell>Your key differentiators in the market.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Proof Points</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="How can you prove these USPs? (e.g., certifications, awards, origin story)"
                            fullWidth
                            value={formData.proofPoints}
                            onChange={handleChange('proofPoints')}
                          />
                        </TableCell>
                        <TableCell>Evidence that supports your claims.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>"Only We" Statement</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="Complete the phrase: 'Only we...' (e.g., 'Only we deliver next-day shipping on custom furniture')"
                            fullWidth
                            value={formData.onlyWeStatement}
                            onChange={handleChange('onlyWeStatement')}
                          />
                        </TableCell>
                        <TableCell>Your singular point of difference.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Brand Values Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Brand Values</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Core Values</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="List the 3-5 values at the heart of your brand (e.g., transparency, innovation, community)"
                            fullWidth
                            value={formData.coreValues}
                            onChange={handleChange('coreValues')}
                          />
                        </TableCell>
                        <TableCell>The principles that guide your brand.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Value Definitions</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="For each value, write a brief statement clarifying what it means in practice."
                            fullWidth
                            value={formData.valueDefinitions}
                            onChange={handleChange('valueDefinitions')}
                          />
                        </TableCell>
                        <TableCell>How your values translate to action.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Brand Promise Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Brand Promise</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Brand Promise</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="Write a 1-sentence brand promise, from the customer's perspective (e.g., 'We promise fast, hassle-free shipping on every order, guaranteed')"
                            fullWidth
                            value={formData.brandPromise}
                            onChange={handleChange('brandPromise')}
                          />
                        </TableCell>
                        <TableCell>What customers can always expect from you.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Brand Personality Section */}
                <TableContainer>
                  <Table sx={{ mb: 2 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '20%' }}>Brand Personality</TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                        <TableCell sx={{ width: '40%' }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Brand Personality</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="Choose 3-5 adjectives that describe your brand as if it were a person (e.g., friendly, confident, quirky)"
                            fullWidth
                            value={formData.brandPersonality}
                            onChange={handleChange('brandPersonality')}
                          />
                        </TableCell>
                        <TableCell>The human characteristics of your brand.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Tone of Voice</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="How should your brand speak to customers? Formal, casual, witty, educational, etc.?"
                            fullWidth
                            value={formData.toneOfVoice}
                            onChange={handleChange('toneOfVoice')}
                          />
                        </TableCell>
                        <TableCell>Your brand's communication style.</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Vocabulary Guidelines</TableCell>
                        <TableCell>
                          <StyledTextField
                            variant="outlined"
                            multiline
                            minRows={4}
                            maxRows={8}
                            placeholder="Any words or phrases you specifically want to use or avoid in your brand communications?"
                            fullWidth
                            value={formData.vocabularyGuidelines}
                            onChange={handleChange('vocabularyGuidelines')}
                          />
                        </TableCell>
                        <TableCell>Specific language dos and don'ts.</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
            </Grid>
          </Grid>
        </Stack>
      </Box>
    </Box>
    <Modal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      aria-labelledby="modal-title"
    >
      <Box sx={{ 
        position: 'absolute', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        width: 400, 
        bgcolor: 'background.paper', 
        boxShadow: 24, 
        p: 4 
      }}>
        <Alert onClose={() => setModalOpen(false)} severity="success">
          Brand strategy saved successfully!
        </Alert>
      </Box>
    </Modal>
  </AppTheme>
);
} 