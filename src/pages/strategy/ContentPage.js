import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { CssBaseline } from '@mui/material';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { Editor } from '@tinymce/tinymce-react';
import Paper from '@mui/material/Paper';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useBrand } from '../../contexts/BrandContext';
import Alert from '@mui/material/Alert';

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

export default function ContentPage() {
  const { id } = useParams();
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editorContent, setEditorContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [outlineGenerated, setOutlineGenerated] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      if (user && id && activeBrandId) {
        try {
          // First try to get from content collection with brand isolation
          const contentDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'content', id);
          const contentDoc = await getDoc(contentDocRef);
          
          if (contentDoc.exists()) {
            const contentData = contentDoc.data();
            setContent(contentData);
            setEditorContent(contentData.content || '');
          } else {
            // If not found in content collection, try to get from contentStrategy
            const strategyDoc = await getDoc(doc(db, 'users', user.uid, 'brands', activeBrandId, 'contentStrategy', 'current'));
            if (strategyDoc.exists()) {
              const strategyData = strategyDoc.data();
              const contentItem = strategyData.strategy.find(item => item.id === id);
              if (contentItem) {
                setContent(contentItem);
                setEditorContent(contentItem.content || '');
                // Create the content document with brand isolation
                await setDoc(contentDocRef, {
                  ...contentItem,
                  content: contentItem.content || '',
                  lastUpdated: new Date().toISOString(),
                  brandId: activeBrandId
                });
              } else {
                setError('Content not found');
              }
            } else {
              setError('Content not found');
            }
          }
        } catch (err) {
          console.error('Error fetching content:', err);
          setError('Error fetching content');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        if (!activeBrandId) {
          setError('Please select a brand first');
        }
      }
    };
    fetchContent();
  }, [user, id, activeBrandId]);

  const handleSave = async () => {
    if (!user || !id || !activeBrandId) return;
    
    setSaving(true);
    try {
      const contentDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'content', id);
      console.log('Saving content to:', contentDocRef.path);
      console.log('Content to save:', editorContent);
      
      await updateDoc(contentDocRef, {
        content: editorContent,
        lastUpdated: new Date().toISOString()
      });
      
      // Verify the save
      const savedDoc = await getDoc(contentDocRef);
      console.log('Saved document:', savedDoc.data());
      
      setNotificationMessage('Content saved successfully!');
      setTimeout(() => setNotificationMessage(''), 3000);
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!user || !id || !activeBrandId) return;
    
    setGenerating(true);
    try {
      const outlineResponse = await fetch(`${process.env.REACT_APP_API_URL}/deepseek/generate-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: content.title,
          keywords: content.outline.split(','),
          type: content.type,
          brandId: activeBrandId
        }),
      });

      const outlineData = await outlineResponse.json();
      if (outlineData.result === 'Success') {
        setEditorContent(outlineData.outline);
        setOutlineGenerated(true);
        setNotificationMessage('Outline generated successfully!');
      } else {
        setError('Failed to generate outline');
      }
    } catch (err) {
      console.error('Error generating outline:', err);
      setError('Failed to generate outline');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!user || !id || !activeBrandId || !outlineGenerated) return;
    
    setGenerating(true);
    try {
      const contentResponse = await fetch(`${process.env.REACT_APP_API_URL}/deepseek/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: content.title,
          keywords: content.outline.split(','),
          type: content.type,
          outline: editorContent, // Use the current outline in the editor
          brandId: activeBrandId
        }),
      });

      const contentData = await contentResponse.json();
      if (contentData.result === 'Success') {
        setEditorContent(contentData.content);
        setNotificationMessage('Content generated successfully!');
      } else {
        setError('Failed to generate content');
      }
    } catch (err) {
      console.error('Error generating content:', err);
      setError('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!activeBrandId) {
    return (
      <AppTheme>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppNavbar />
          <SideMenu />
          <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
            <Header />
            <Alert severity="warning" sx={{ mt: 4 }}>
              Please select a brand to view content.
            </Alert>
          </Box>
        </Box>
      </AppTheme>
    );
  }

  return (
    <AppTheme>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppNavbar />
        <SideMenu />
        <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
          <Header />
          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={12} md={10}>
              <Box sx={{ p: 3 }}>
                <Box sx={{ position: 'relative' }}>
                  {generating && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        zIndex: 1000,
                      }}
                    >
                      <CircularProgress size={60} />
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        {outlineGenerated ? 'Generating Content...' : 'Generating Outline...'}
                      </Typography>
                    </Box>
                  )}

                  {analyzing && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        zIndex: 1000,
                      }}
                    >
                      <CircularProgress size={60} />
                      <Typography variant="h6" sx={{ mt: 2 }}>
                        Analyzing Content...
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1">
                      {content?.title || 'Untitled Content'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      {!outlineGenerated ? (
                        <Button 
                          variant="outlined"
                          onClick={handleGenerateOutline}
                          startIcon={<AutoFixHighIcon />}
                          disabled={generating}
                        >
                          {generating ? 'Generating...' : 'Generate Outline'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outlined"
                          onClick={handleGenerateContent}
                          startIcon={<AutoFixHighIcon />}
                          disabled={generating}
                        >
                          {generating ? 'Generating...' : 'Generate Content'}
                        </Button>
                      )}
                      <Button 
                        variant="contained" 
                        onClick={handleSave}
                        disabled={saving || generating}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Box>

                  {notificationMessage && (
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      sx={{ 
                        mb: 2,
                        p: 1,
                        bgcolor: 'success.light',
                        color: 'success.contrastText',
                        borderRadius: 1
                      }}
                    >
                      {notificationMessage}
                    </Typography>
                  )}

                  <Editor
                    tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@5.10.2/tinymce.min.js"
                    value={editorContent}
                    onEditorChange={(content) => setEditorContent(content)}
                    init={{
                      height: 500,
                      menubar: true,
                      plugins: [
                        'advlist autolink lists link image charmap print preview anchor',
                        'searchreplace visualblocks code fullscreen',
                        'insertdatetime media table paste code help wordcount'
                      ],
                      toolbar: `undo redo | formatselect | bold italic backcolor | 
                                alignleft aligncenter alignright alignjustify | 
                                bullist numlist outdent indent | removeformat | help`
                    }}
                  />

                  {analysisResults && (
                    <Box sx={{ mt: 4, mb: 4 }}>
                      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AnalyticsIcon />
                        Content Analysis Results
                      </Typography>
                      
                      {/* Meta Description */}
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Suggested Meta Description
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                          <Typography variant="body1">
                            {analysisResults.metaDescription}
                          </Typography>
                        </Paper>
                      </Box>

                      {/* Keyword Analysis */}
                      <Typography variant="subtitle1" gutterBottom>
                        Keyword Analysis
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Keyword</TableCell>
                              <TableCell align="right">Count</TableCell>
                              <TableCell align="right">Density</TableCell>
                              <TableCell>Recommendation</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {analysisResults.keywordAnalysis.map((analysis, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  {analysis.keyword}
                                </TableCell>
                                <TableCell align="right">{analysis.count}</TableCell>
                                <TableCell align="right">{analysis.density}</TableCell>
                                <TableCell>
                                  <Typography
                                    variant="body2"
                                    color={
                                      analysis.recommendation.toLowerCase().includes('good') ? 'success.main' :
                                      analysis.recommendation.toLowerCase().includes('needs') ? 'warning.main' :
                                      analysis.recommendation.toLowerCase().includes('over') ? 'error.main' :
                                      'text.primary'
                                    }
                                  >
                                    {analysis.recommendation}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Total Word Count */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Total Word Count: {analysisResults.totalWords}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={2}>
              <Card sx={{ 
                p: 2, 
                border: '1px solid #ccc', 
                borderRadius: 2,
                mt: 2
              }}>
                <Typography variant="h6" gutterBottom>
                  Content Details
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Type
                  </Typography>
                  <Chip 
                    label={content?.type || 'Unknown'} 
                    color="primary" 
                    variant="outlined"
                    sx={{ mb: 2 }}
                  />
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Focus Keywords
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {content?.outline?.split(',').map((keyword, index) => (
                      <Chip 
                        key={index}
                        label={keyword.trim()} 
                        variant="outlined"
                        size="small"
                        sx={{ width: 'fit-content' }}
                      />
                    ))}
                  </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={!editorContent || editorContent.trim().length === 0 || analyzing}
                    onClick={async () => {
                      try {
                        setAnalyzing(true);
                        // Fetch brand settings with brand isolation
                        const brandIdentityDoc = await getDoc(doc(db, 'users', user.uid, 'brands', activeBrandId, 'BrandIdentity', 'settings'));
                        const marketAudienceDoc = await getDoc(doc(db, 'users', user.uid, 'brands', activeBrandId, 'MarketAudience', 'settings'));
                        const productPositioningDoc = await getDoc(doc(db, 'users', user.uid, 'brands', activeBrandId, 'ProductPositioning', 'settings'));
                        const referencesExamplesDoc = await getDoc(doc(db, 'users', user.uid, 'brands', activeBrandId, 'ReferencesExamples', 'settings'));

                        const brandSettings = {
                          brandIdentity: brandIdentityDoc.exists() ? brandIdentityDoc.data() : {},
                          marketAudience: marketAudienceDoc.exists() ? marketAudienceDoc.data() : {},
                          productPositioning: productPositioningDoc.exists() ? productPositioningDoc.data() : {},
                          referencesExamples: referencesExamplesDoc.exists() ? referencesExamplesDoc.data() : {}
                        };

                        const response = await fetch(`${process.env.REACT_APP_API_URL}/deepseek/analyze-content`, {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            content: editorContent,
                            keywords: content?.outline?.split(','),
                            title: content?.title,
                            brandSettings,
                            brandId: activeBrandId
                          }),
                        });

                        const data = await response.json();
                        if (data.result === 'Success') {
                          setAnalysisResults(data);
                          setNotificationMessage('Analysis completed successfully!');
                        } else {
                          setError('Failed to analyze content');
                        }
                      } catch (err) {
                        console.error('Error analyzing content:', err);
                        setError('Failed to analyze content');
                      } finally {
                        setAnalyzing(false);
                      }
                    }}
                    startIcon={<AnalyticsIcon />}
                  >
                    Analyze Content
                  </Button>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AppTheme>
  );
} 