// KeywordDataGrid.jsx
import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Box, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Typography,
  TextField,
  Stack
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import IconButton from '@mui/material/IconButton';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';

// Add debounce helper at the top
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function KeywordDataGrid({ 
  rows, 
  loading, 
  savedKeywords = [], // Add default value
  onSaveKeyword, 
  onRemoveKeyword 
}) {
  const [user] = useAuthState(auth);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);

  // Filter states
  const [volumeRange, setVolumeRange] = useState([0, 0]);
  const [cpcRange, setCpcRange] = useState([0, 0]);
  const [competitionValues, setCompetitionValues] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('all');
  const [compIndexRange, setCompIndexRange] = useState([0, 0]);
  
  // Current filter values
  const [currentVolumeRange, setCurrentVolumeRange] = useState([0, 0]);
  const [currentCpcRange, setCurrentCpcRange] = useState([0, 0]);
  const [currentCompIndexRange, setCurrentCompIndexRange] = useState([0, 0]);

  // Add these states for temporary input values
  const [tempInputs, setTempInputs] = useState({
    volumeMin: '',
    volumeMax: '',
    cpcMin: '',
    cpcMax: '',
    compIndexMin: '',
    compIndexMax: ''
  });

  // Calculate ranges when rows change
  useEffect(() => {
    if (rows.length > 0) {
      const volumes = rows.map(row => row.searchVolume);
      const cpcs = rows.map(row => row.cpc);
      const indices = rows.map(row => row.competitionIndex);
      const uniqueComps = [...new Set(rows.map(row => row.competition))];

      setVolumeRange([Math.min(...volumes), Math.max(...volumes)]);
      setCpcRange([Math.min(...cpcs), Math.max(...cpcs)]);
      setCompIndexRange([Math.min(...indices), Math.max(...indices)]);
      setCompetitionValues(uniqueComps);
      
      // Initialize current ranges
      setCurrentVolumeRange([Math.min(...volumes), Math.max(...volumes)]);
      setCurrentCpcRange([Math.min(...cpcs), Math.max(...cpcs)]);
      setCurrentCompIndexRange([Math.min(...indices), Math.max(...indices)]);

      // Initialize temp inputs
      setTempInputs({
        volumeMin: Math.min(...volumes).toString(),
        volumeMax: Math.max(...volumes).toString(),
        cpcMin: Math.min(...cpcs).toFixed(2),
        cpcMax: Math.max(...cpcs).toFixed(2),
        compIndexMin: Math.min(...indices).toString(),
        compIndexMax: Math.max(...indices).toString()
      });
    }
  }, [rows]);

  // Handle input changes without immediate filtering
  const handleInputChange = (field) => (event) => {
    const value = event.target.value;
    setTempInputs(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle when input loses focus or Enter is pressed
  const handleInputCommit = (type, index) => (event) => {
    if (event.type === 'blur' || (event.type === 'keydown' && event.key === 'Enter')) {
      event.preventDefault();
      
      let value = parseFloat(event.target.value);
      if (isNaN(value)) return;

      switch(type) {
        case 'volume':
          setCurrentVolumeRange(prev => {
            const newRange = [...prev];
            newRange[index] = value;
            return newRange;
          });
          break;
        case 'cpc':
          setCurrentCpcRange(prev => {
            const newRange = [...prev];
            newRange[index] = value;
            return newRange;
          });
          break;
        case 'compIndex':
          setCurrentCompIndexRange(prev => {
            const newRange = [...prev];
            newRange[index] = value;
            return newRange;
          });
          break;
      }
    }
  };

  // Filtered rows
  const [filteredRows, setFilteredRows] = useState(rows);

  // Debounced filter function
  const debouncedFilter = React.useCallback(
    debounce((newFilters) => {
      const filtered = rows.filter(row => {
        const volumeMatch = row.searchVolume >= newFilters.volume[0] && 
                          row.searchVolume <= newFilters.volume[1];
        
        const cpcMatch = row.cpc >= newFilters.cpc[0] && 
                        row.cpc <= newFilters.cpc[1];
        
        const compMatch = newFilters.competition === 'all' || 
                         row.competition === newFilters.competition;
        
        const indexMatch = row.competitionIndex >= newFilters.compIndex[0] && 
                          row.competitionIndex <= newFilters.compIndex[1];
        
        return volumeMatch && cpcMatch && compMatch && indexMatch;
      });
      
      setFilteredRows(filtered);
    }, 300), // 300ms delay
    [rows]
  );

  // Update filters with debounce
  useEffect(() => {
    debouncedFilter({
      volume: currentVolumeRange,
      cpc: currentCpcRange,
      competition: selectedCompetition,
      compIndex: currentCompIndexRange
    });
  }, [currentVolumeRange, currentCpcRange, selectedCompetition, currentCompIndexRange]);

  // Render filter controls with improved layout
  const FilterControls = () => (
    <Box sx={{ 
      p: 2, 
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 2,
      alignItems: 'start',
      bgcolor: '#f5f6fa',
      borderRadius: 1,
      mb: 2
    }}>
      {/* Volume Filter */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          Volume Range
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            type="number"
            value={tempInputs.volumeMin}
            onChange={handleInputChange('volumeMin')}
            onBlur={handleInputCommit('volume', 0)}
            onKeyDown={handleInputCommit('volume', 0)}
            InputProps={{ 
              inputProps: { 
                min: volumeRange[0],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
          <Typography sx={{ mx: 0.5 }}>-</Typography>
          <TextField
            size="small"
            type="number"
            value={tempInputs.volumeMax}
            onChange={handleInputChange('volumeMax')}
            onBlur={handleInputCommit('volume', 1)}
            onKeyDown={handleInputCommit('volume', 1)}
            InputProps={{ 
              inputProps: { 
                max: volumeRange[1],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
        </Box>
      </Box>

      {/* CPC Filter */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          CPC Range ($)
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            type="number"
            value={tempInputs.cpcMin}
            onChange={handleInputChange('cpcMin')}
            onBlur={handleInputCommit('cpc', 0)}
            onKeyDown={handleInputCommit('cpc', 0)}
            InputProps={{ 
              inputProps: { 
                min: cpcRange[0],
                step: 0.01
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
          <Typography sx={{ mx: 0.5 }}>-</Typography>
          <TextField
            size="small"
            type="number"
            value={tempInputs.cpcMax}
            onChange={handleInputChange('cpcMax')}
            onBlur={handleInputCommit('cpc', 1)}
            onKeyDown={handleInputCommit('cpc', 1)}
            InputProps={{ 
              inputProps: { 
                max: cpcRange[1],
                step: 0.01
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
        </Box>
      </Box>

      {/* Competition Filter */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          Competition
        </Typography>
        <FormControl fullWidth>
          <Select
            value={selectedCompetition}
            onChange={(e) => setSelectedCompetition(e.target.value)}
            size="small"
            sx={{ height: '40px' }}
          >
            <MenuItem value="all">All</MenuItem>
            {competitionValues.map(value => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Competition Index Filter */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          Competition Index
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            type="number"
            value={tempInputs.compIndexMin}
            onChange={handleInputChange('compIndexMin')}
            onBlur={handleInputCommit('compIndex', 0)}
            onKeyDown={handleInputCommit('compIndex', 0)}
            InputProps={{ 
              inputProps: { 
                min: compIndexRange[0],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
          <Typography sx={{ mx: 0.5 }}>-</Typography>
          <TextField
            size="small"
            type="number"
            value={tempInputs.compIndexMax}
            onChange={handleInputChange('compIndexMax')}
            onBlur={handleInputCommit('compIndex', 1)}
            onKeyDown={handleInputCommit('compIndex', 1)}
            InputProps={{ 
              inputProps: { 
                max: compIndexRange[1],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
        </Box>
      </Box>
    </Box>
  );

  // Move handleSaveToggle inside component
  const handleSaveToggle = async (keyword) => {
    if (!user) return;

    try {
      if (savedKeywords.some(k => k.keyword === keyword.keyword)) {
        // Remove from saved words
        await deleteDoc(
          doc(db, 'users', user.uid, 'savedKeywords', keyword.keyword)
        );
        onRemoveKeyword?.(keyword);
      } else {
        // Add to saved words
        await setDoc(
          doc(db, 'users', user.uid, 'savedKeywords', keyword.keyword),
          {
            ...keyword,
            savedAt: new Date().toISOString()
          }
        );
        onSaveKeyword?.(keyword);
      }
    } catch (error) {
      console.error('Error toggling saved keyword:', error);
    }
  };

  const columns = [
    {
      field: 'keyword',
      headerName: 'Keyword',
      flex: 1,
      minWidth: 200
    },
    {
      field: 'searchVolume',
      headerName: 'Volume',
      width: 130,
      type: 'number'
    },
    {
      field: 'cpc',
      headerName: 'CPC ($)',
      width: 100,
      type: 'number'
    },
    {
      field: 'competition',
      headerName: 'Competition',
      width: 130
    },
    {
      field: 'competitionIndex',
      headerName: 'Comp. Index',
      width: 130,
      type: 'number'
    },
    {
      field: 'save',
      headerName: 'Save',
      width: 70,
      renderCell: (params) => {
        const isSaved = savedKeywords.some(k => k.keyword === params.row.keyword);
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveToggle(params.row);
            }}
          >
            {isSaved ? <RemoveIcon /> : <AddIcon />}
          </IconButton>
        );
      },
      headerAlign: 'center',
      align: 'center'
    }
  ];

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <FilterControls />
      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        pageSizeOptions={[10, 20, 50]}
        paginationModel={{
          pageSize: 10,
          page: 0,
        }}
        rowHeight={70}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newSelection) => {
          const validSelection = newSelection.filter((id) =>
            rows.some((row) => row.id === id)
          );
          setRowSelectionModel(validSelection);
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{
          flex: '1 1 0%',
          boxSizing: 'border-box',
          position: 'relative',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderRadius: 'var(--unstable_DataGrid-radius, 8px)',
          color: 'var(--template-palette-text-primary)',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          fontSize: '0.875rem',
          lineHeight: 1.43,
          outline: 'none',
          height: '100%',
          display: 'flex',
          minWidth: 0,
          minHeight: 0,
          flexDirection: 'column',
          overflowAnchor: 'none',
          '--DataGrid-overlayHeight': '300px',
          overflow: 'clip',
          borderColor: 'var(--template-palette-divider)',
          backgroundColor: 'var(--template-palette-background-default)',
          
          // Row and cell styling
          '& .even': { backgroundColor: '#fafafa' },
          '& .odd': { backgroundColor: '#ffffff' },
          '.MuiDataGrid-cell': {
            lineHeight: 'normal !important',
            display: 'flex',
            alignItems: 'center',
            border: 'none'
          },
          '.MuiDataGrid-row': {
            borderBottom: '1px solid var(--template-palette-TableCell-border)',
            cursor: 'pointer'
          },
          '.MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f6fa',
            borderBottom: '1px solid #ddd',
            minHeight: '56px !important',
            height: '56px !important',
            maxHeight: '56px !important'
          },
          '.MuiDataGrid-main': { border: 'none' },
          '.MuiDataGrid-columnHeader': { border: 'none' },
          '.MuiDataGrid-footerContainer': { border: 'none' },
          
          // DataGrid variables
          '--unstable_DataGrid-radius': '8px',
          '--unstable_DataGrid-headWeight': '500',
          '--unstable_DataGrid-overlayBackground': 'rgba(var(--template-palette-background-defaultChannel) / var(--template-palette-action-disabledOpacity))',
          '--DataGrid-containerBackground': 'var(--template-palette-background-default)',
          '--DataGrid-pinnedBackground': 'var(--template-palette-background-default)',
          '--DataGrid-rowBorderColor': 'var(--template-palette-TableCell-border)',
          '--DataGrid-cellOffsetMultiplier': '2',
          '--DataGrid-width': '0px',
          '--DataGrid-hasScrollX': '0',
          '--DataGrid-hasScrollY': '0',
          '--DataGrid-scrollbarSize': '10px',
          '--DataGrid-rowWidth': '0px',
          '--DataGrid-columnsTotalWidth': '0px',
          '--DataGrid-leftPinnedWidth': '0px',
          '--DataGrid-rightPinnedWidth': '0px',
          '--DataGrid-headerHeight': '56px',
          '--DataGrid-headersTotalHeight': '56px',
          '--DataGrid-topContainerHeight': '56px',
          '--DataGrid-bottomContainerHeight': '0px'
        }}
      />
    </Box>
  );
}
