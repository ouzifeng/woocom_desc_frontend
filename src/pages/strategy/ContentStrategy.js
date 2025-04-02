import * as React from 'react';
import { alpha } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { DataGrid } from '@mui/x-data-grid';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import AppNavbar from '../dashboard/components/AppNavbar';
import Header from '../dashboard/components/Header';
import SideMenu from '../dashboard/components/SideMenu';
import AppTheme from '../shared-theme/AppTheme';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { Paper } from '@mui/material';
import { Alert } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import FolderIcon from '@mui/icons-material/Folder';
import ArticleIcon from '@mui/icons-material/Article';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import { useNavigate } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function ContentStrategy(props) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [articleCount, setArticleCount] = React.useState(100);
  const [error, setError] = React.useState(null);
  const [generatedStatus, setGeneratedStatus] = React.useState({});
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 50,
    page: 0,
  });
  const [expandedPillars, setExpandedPillars] = React.useState(new Set());
  const navigate = useNavigate();

  // Initial state for the DataGrid
  const initialState = {
    pagination: {
      paginationModel: { pageSize: 50, page: 0 },
    },
    tree: {
      expandedRowIds: [], // Start with all rows collapsed
    },
  };

  // Parse markdown into structured data
  const parseMarkdownToStructure = (markdownText) => {
    if (!markdownText) return [];
    
    const lines = markdownText.split('\n').filter(line => line.trim());
    const result = [];
    let currentId = 0;
    
    const getLevel = (line) => {
      if (line.startsWith('##')) return line.split(' ')[0].length;
      return 0;
    };

    const cleanTitle = (line) => {
      return line
        .replace(/^#+\s*/, '')  // Remove heading markers
        .replace(/\*\*/g, '')   // Remove bold markers
        .trim();
    };

    const stack = [{ level: 0, items: result }];
    
    lines.forEach(line => {
      const level = getLevel(line);
      const title = cleanTitle(line);
      
      // Determine type based on content
      let type = 'Article';
      if (title.toLowerCase().includes('objective')) type = 'Objective';
      else if (title.toLowerCase().includes('target audience')) type = 'Audience';
      else if (title.toLowerCase().includes('pillar')) type = 'Pillar';
      else if (title.toLowerCase().includes('cluster')) type = 'Cluster';
      else if (title.toLowerCase().includes('spoke')) type = 'Spoke';
      
      // Build hierarchy path
      const hierarchy = [];
      for (let i = 1; i < stack.length; i++) {
        hierarchy.push(stack[i].id);
      }

      const item = {
        id: ++currentId,
        title,
        type,
        hierarchy,
        outline: ''  // Will be filled if there's content below
      };

      // Find correct parent level
      while (stack.length > 1 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      // If this line doesn't start with #, it's content for the previous item
      if (level === 0 && stack.length > 1) {
        const parent = stack[stack.length - 1].items[stack[stack.length - 1].items.length - 1];
        if (parent) {
          parent.outline = parent.outline ? parent.outline + ' ' + title : title;
        }
      } else {
        stack[stack.length - 1].items.push(item);
        stack.push({ level, items: [], id: item.id });
      }
    });

    return result;
  };

  // Validate and transform rows before setting them
  const setValidatedRows = (newRows) => {
    if (!Array.isArray(newRows)) {
      console.error('Invalid rows data:', newRows);
      return;
    }
    
    // If the first item looks like markdown, parse it
    if (newRows.length === 1 && typeof newRows[0] === 'string') {
      const parsedRows = parseMarkdownToStructure(newRows[0]);
      setRows(parsedRows);
      return;
    }
    
    // Otherwise handle as regular row data
    const validatedRows = newRows.filter(row => 
      row && 
      typeof row === 'object' && 
      row.id && 
      row.title
    ).map(row => ({
      ...row,
      hierarchy: row.hierarchy || [],
      type: row.type || 'Article',
      outline: row.outline || ''
    }));
    
    setRows(validatedRows);
  };

  // Load saved strategy from cache or database
  const loadSavedStrategy = React.useCallback(async () => {
    if (!user) return;

    try {
      // Try to get from cache first
      const cachedStrategy = localStorage.getItem('contentStrategy');
      if (cachedStrategy) {
        const { timestamp, data } = JSON.parse(cachedStrategy);
        // Check if cache is less than 24 hours old
        if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          setValidatedRows(data);
          return;
        }
      }

      // If no cache or expired, get from database
      const strategyDoc = await getDocs(collection(db, 'users', user.uid, 'contentStrategy'));
      if (!strategyDoc.empty) {
        const strategyData = strategyDoc.docs[0].data().strategy;
        setValidatedRows(strategyData);
        
        // Save to cache
        localStorage.setItem('contentStrategy', JSON.stringify({
          timestamp: Date.now(),
          data: strategyData
        }));
      }
    } catch (err) {
      console.error('Error loading strategy:', err);
      setError('Failed to load saved strategy');
    }
  }, [user]);

  // Load saved strategy on component mount
  React.useEffect(() => {
    loadSavedStrategy();
  }, [loadSavedStrategy]);

  // Check content generation status for all rows
  React.useEffect(() => {
    const checkContentStatus = async () => {
      if (!user) return;

      try {
        // Get all content documents that have content
        const contentCollection = collection(db, 'users', user.uid, 'content');
        const contentSnapshot = await getDocs(contentCollection);
        
        // Create a map of content IDs that exist
        const contentMap = {};
        contentSnapshot.forEach(doc => {
          if (doc.data().content) {
            contentMap[doc.id] = true;
          }
        });
        
        setGeneratedStatus(contentMap);
      } catch (err) {
        console.error('Error checking content status:', err);
        setGeneratedStatus({});
      }
    };

    checkContentStatus();
  }, [user]);

  // Toggle pillar expansion
  const togglePillar = (pillarId) => {
    const newExpanded = new Set(expandedPillars);
    if (newExpanded.has(pillarId)) {
      newExpanded.delete(pillarId);
    } else {
      newExpanded.add(pillarId);
    }
    setExpandedPillars(newExpanded);
  };

  // Sort and filter rows based on expanded state
  const sortedRows = React.useMemo(() => {
    if (!rows) return [];
    
    const result = [];
    const pillars = rows.filter(row => row.type === 'Pillar');
    
    pillars.forEach(pillar => {
      // Always add pillar
      result.push(pillar);
      
      // If pillar is expanded, add its content
      if (expandedPillars.has(pillar.id)) {
        const pillarContent = rows.filter(row => 
          row.type !== 'Pillar' && 
          row.hierarchy && 
          row.hierarchy[0] === pillar.id
        ).sort((a, b) => {
          if (a.type === 'Cluster' && b.type !== 'Cluster') return -1;
          if (a.type !== 'Cluster' && b.type === 'Cluster') return 1;
          return a.id.localeCompare(b.id);
        });
        
        result.push(...pillarContent);
      }
    });
    
    return result;
  }, [rows, expandedPillars]);

  // Update the indentation based on hierarchy
  const getIndentation = (row) => {
    return row.type === 'Pillar' ? 0 : 2; // Everything else is indented once
  };

  const columns = [
    { 
      field: 'title', 
      headerName: 'Title', 
      flex: 1,
      minWidth: 300,
      renderCell: (params) => {
        const isPillar = params.row.type === 'Pillar';
        const isCluster = params.row.type === 'Cluster';
        const paddingLeft = isPillar ? 0 : 2;
        
        return (
          <Box 
            sx={{ 
              pl: paddingLeft, 
              display: 'flex', 
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: 1
            }}>
              {isPillar && (
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePillar(params.row.id);
                  }}
                  sx={{ minWidth: 24 }}
                >
                  {expandedPillars.has(params.row.id) ? '−' : '+'}
                </Button>
              )}
              {isPillar && <StarIcon color="primary" />}
              {isCluster && <FolderIcon color="secondary" />}
              {!isPillar && !isCluster && <ArticleIcon color="success" />}
              <Typography
                variant="body2"
                sx={{
                  fontWeight: isPillar ? 600 : isCluster ? 500 : 400,
                  color: isPillar ? 'primary.main' : isCluster ? 'secondary.main' : 'text.primary'
                }}
              >
                {params.value}
              </Typography>
            </Box>
          </Box>
        );
      }
    },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.row.type}
          size="small"
          color={
            params.row.type === 'Pillar' ? 'primary' :
            params.row.type === 'Cluster' ? 'secondary' :
            'success'
          }
        />
      )
    },
    { 
      field: 'outline', 
      headerName: 'Focus Keywords', 
      flex: 1,
      minWidth: 300,
      renderCell: (params) => (
        <Box sx={{ 
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center'
        }}>
          {params.value.split(',').map((keyword, index) => (
            <Chip
              key={index}
              label={keyword.trim()}
              size="small"
              variant="outlined"
              sx={{ 
                mr: 0.5,
                backgroundColor: 'background.paper'
              }}
            />
          ))}
        </Box>
      )
    },
    {
      field: 'generated',
      headerName: 'Generated',
      width: 100,
      renderCell: (params) => {
        return generatedStatus[params.row.id] ? (
          <CheckCircleIcon color="success" />
        ) : null;
      }
    }
  ];

  const handleGenerate = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get saved keywords
      const keywordsSnapshot = await getDocs(collection(db, 'users', user.uid, 'savedKeywords'));
      const savedKeywords = keywordsSnapshot.docs.map(doc => doc.data().keyword);
      
      if (savedKeywords.length === 0) {
        setError('No saved keywords found. Please save some keywords first.');
        return;
      }

      // Get existing strategy
      const strategyDoc = await getDocs(collection(db, 'users', user.uid, 'contentStrategy'));
      const existingStrategy = strategyDoc.empty ? [] : strategyDoc.docs[0].data().strategy;

      // Generate new strategy
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/deepseek/generate-content-strategy`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywords: savedKeywords,
            articleCount: 11, // Fixed number for one pillar + 10 supporting pieces
            existingStrategy // Pass existing strategy to backend
          }),
        }
      );

      const data = await response.json();
      
      if (data.result === 'Success') {
        // Save to database
        await setDoc(doc(collection(db, 'users', user.uid, 'contentStrategy'), 'current'), {
          strategy: data.strategy,
          timestamp: new Date().toISOString()
        });

        // Save to cache
        localStorage.setItem('contentStrategy', JSON.stringify({
          timestamp: Date.now(),
          data: data.strategy
        }));

        setValidatedRows(data.strategy);
      } else {
        setError(data.message || 'Failed to generate content strategy');
      }
    } catch (err) {
      setError('Failed to generate content strategy. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle row click to navigate to content page
  const handleRowClick = async (params) => {
    try {
      const contentRef = doc(db, 'users', user.uid, 'content', params.row.id);
      const contentDoc = await getDoc(contentRef);
      
      // Only update if the document doesn't exist or doesn't have content
      if (!contentDoc.exists() || !contentDoc.data().content) {
        await setDoc(contentRef, {
          ...params.row,
          content: '',
          lastUpdated: new Date().toISOString()
        });
      }
      
      // Navigate to content page
      navigate(`/strategy/${params.row.id}`);
    } catch (err) {
      console.error('Error handling row click:', err);
      setError('Failed to navigate to content page');
    }
  };

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
                <Typography variant="h4" gutterBottom>
                  Content Strategy Generator
                </Typography>
                
                <Typography variant="body1" paragraph>
                  Generate a content strategy with one pillar article and its supporting content. Each generation will create:
                </Typography>
                
                <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
                  <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">1 Pillar Article</Typography>
                    <Typography variant="body2">Main topic hub with comprehensive coverage</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h6" color="secondary">5 Cluster Articles</Typography>
                    <Typography variant="body2">Subtopics that support the main pillar</Typography>
                  </Paper>
                  <Paper sx={{ p: 2, flex: 1, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main">5 Supporting Articles</Typography>
                    <Typography variant="body2">Detailed content for each cluster</Typography>
                  </Paper>
                </Box>

                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleGenerate}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {loading ? 'Generating...' : 'Generate New Content Strategy'}
                  </Button>
                  
                  {error && (
                    <Alert severity="error" sx={{ flex: 1 }}>
                      {error}
                    </Alert>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ height: 600, width: '100%', mt: 2 }}>
                  <DataGrid
                    rows={sortedRows}
                    columns={columns}
                    loading={loading}
                    treeData
                    getTreeDataPath={(row) => row.path}
                    defaultGroupingExpansionDepth={0}
                    pagination
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    pageSizeOptions={[10, 20, 50]}
                    initialState={{
                      pagination: {
                        paginationModel: { pageSize: 50, page: 0 },
                      },
                    }}
                    rowHeight={60}
                    disableRowSelectionOnClick
                    onRowClick={handleRowClick}
                    sx={{
                      '& .MuiDataGrid-cell': { cursor: 'pointer' },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </Box>
    </AppTheme>
  );
} 