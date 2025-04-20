// KeywordDataGrid.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { 
  Box, 
  Button,
  FormControl,
  MenuItem,
  Select, 
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

// If you want even fewer re-renders when the parent changes some unrelated props,
// you can wrap the entire component in React.memo:
//
// export default React.memo(function KeywordDataGrid({ ... }) {
export default function KeywordDataGrid({ 
  // Props from parent
  rows: externalRows = [],
  loading, 
  savedKeywords = [],
  onSaveKeyword, 
  onRemoveKeyword,
  isSavedWordsTab = false,
}) {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ----------------------------------------------------------------
  // 1) Keep a local copy of rows (so we filter in memory, no re-fetch).
  // ----------------------------------------------------------------
  const [allRows, setAllRows] = useState(externalRows);

  // Update local rows when external rows change
  useEffect(() => {
    if (externalRows) {
      setAllRows(externalRows);
      // Reset filters when new data comes in
      setFilteredRows(externalRows);
    }
  }, [externalRows]);

  // ----------------------------------------------------------------
  // 2) This state is the filtered set shown in the DataGrid.
  // ----------------------------------------------------------------
  const [filteredRows, setFilteredRows] = useState(allRows);

  // ----------------------------------------------------------------
  // 3) Figure out min/max for volume, CPC, compIndex
  // ----------------------------------------------------------------
  const [ranges, setRanges] = useState({
    volume: [0, 0],
    cpc: [0, 0],
    compIndex: [0, 0],
  });

  // ----------------------------------------------------------------
  // 4) Use refs for input values to prevent re-renders while typing
  // ----------------------------------------------------------------
  const inputRefs = useRef({
    volumeMin: '',
    volumeMax: '',
    cpcMin: '',
    cpcMax: '',
    compIndexMin: '',
    compIndexMax: '',
    competition: 'all',
  });

  // Add state for competition to prevent flickering
  const [competitionValue, setCompetitionValue] = useState('all');

  // Update ranges when allRows changes
  useEffect(() => {
    if (!allRows.length) {
      setFilteredRows([]);
      return;
    }

    // Compute min/max
    const volumes = allRows.map((r) => r.searchVolume);
    const cpcs = allRows.map((r) => r.cpc);
    const compIndexes = allRows.map((r) => r.competitionIndex);

    const vmin = Math.min(...volumes);
    const vmax = Math.max(...volumes);
    const cmin = Math.min(...cpcs);
    const cmax = Math.max(...cpcs);
    const imin = Math.min(...compIndexes);
    const imax = Math.max(...compIndexes);

    setRanges({
      volume: [vmin, vmax],
      cpc: [cmin, cmax],
      compIndex: [imin, imax],
    });

    // Reset input refs to match new ranges
    inputRefs.current = {
      volumeMin: String(vmin),
      volumeMax: String(vmax),
      cpcMin: cmin.toFixed(2),
      cpcMax: cmax.toFixed(2),
      compIndexMin: String(imin),
      compIndexMax: String(imax),
      competition: 'all',
    };
    setCompetitionValue('all');
  }, [allRows]);

  const handleInputChange = (field) => (event) => {
    if (field === 'competition') {
      setCompetitionValue(event.target.value);
      inputRefs.current[field] = event.target.value;
    } else {
      inputRefs.current[field] = event.target.value;
    }
  };

  // ----------------------------------------------------------------
  // 5) Filter function
  // ----------------------------------------------------------------
  const applyFilters = () => {
    const vMin = parseFloat(inputRefs.current.volumeMin) || 0;
    const vMax = parseFloat(inputRefs.current.volumeMax) || Number.MAX_VALUE;
    const cMin = parseFloat(inputRefs.current.cpcMin) || 0;
    const cMax = parseFloat(inputRefs.current.cpcMax) || Number.MAX_VALUE;
    const iMin = parseFloat(inputRefs.current.compIndexMin) || 0;
    const iMax = parseFloat(inputRefs.current.compIndexMax) || Number.MAX_VALUE;

    const filtered = allRows.filter((row) => {
      const inVolume = row.searchVolume >= vMin && row.searchVolume <= vMax;
      const inCpc = row.cpc >= cMin && row.cpc <= cMax;
      const inIndex = row.competitionIndex >= iMin && row.competitionIndex <= iMax;
      const inCompetition = inputRefs.current.competition === 'all' || row.competition === inputRefs.current.competition;

      return inVolume && inCpc && inIndex && inCompetition;
    });

    setFilteredRows(filtered);
  };

  // ----------------------------------------------------------------
  // 6) Save/Remove toggles
  // ----------------------------------------------------------------
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const handleSaveToggle = async (keywordObj) => {
    if (!user || !activeBrandId) return;

    const alreadySaved = savedKeywords.some((k) => k.keyword === keywordObj.keyword);
    try {
      if (alreadySaved) {
        // Find the saved keyword with this keyword text
        const savedKeyword = savedKeywords.find(k => k.keyword === keywordObj.keyword);
        if (!savedKeyword) {
          console.error('Could not find saved keyword to remove');
          return;
        }
        
        // Use the document ID from the saved keyword
        const keywordId = savedKeyword.id;
        
        if (!keywordId) {
          console.error('Saved keyword missing document ID');
          return;
        }
        
        // Remove the keyword using its document ID
        await deleteDoc(
          doc(db, 'users', user.uid, 'brands', activeBrandId, 'savedKeywords', keywordId)
        );
        onRemoveKeyword?.(keywordObj);
      } else {
        // add a new keyword
        const keywordId = `keyword_${Date.now()}`;
        await setDoc(
          doc(db, 'users', user.uid, 'brands', activeBrandId, 'savedKeywords', keywordId),
          {
            ...keywordObj,
            brandId: activeBrandId,
            savedAt: new Date().toISOString(),
          }
        );
        onSaveKeyword?.(keywordObj);
      }
    } catch (err) {
      console.error('Error toggling saved keyword:', err);
    }
  };

  // Bulk save/remove selected keywords based on tab context
  const handleBulkOperation = async () => {
    if (!user || !activeBrandId || !rowSelectionModel || rowSelectionModel.length === 0) return;

    setIsBulkSaving(true);
    try {
      // Safely get selected rows - ensure we're dealing with arrays
      const selectedRows = Array.isArray(filteredRows) && Array.isArray(rowSelectionModel) 
        ? filteredRows.filter(row => rowSelectionModel.includes(row.id))
        : [];
        
      if (selectedRows.length === 0) {
        console.error('No valid rows selected for bulk operation');
        setSnackbar({
          open: true,
          message: 'No valid rows selected',
          severity: 'error'
        });
        setIsBulkSaving(false);
        return;
      }
      
      let operationCount = 0;
      
      // Create a batch
      const batch = writeBatch(db);
      
      if (isSavedWordsTab) {
        // In Saved Words tab, remove the keywords using their document IDs
        for (const row of selectedRows) {
          // The document ID should be in the row.id field (if loaded from Firestore)
          if (!row || !row.id) {
            console.error('Saved keyword missing document ID:', row);
            continue;
          }
          
          const ref = doc(db, 'users', user.uid, 'brands', activeBrandId, 'savedKeywords', row.id);
          batch.delete(ref);
          if (typeof onRemoveKeyword === 'function') {
            onRemoveKeyword(row);
          }
          operationCount++;
        }
      } else {
        // In Research tab, add new keywords (skip existing ones)
        for (const row of selectedRows) {
          if (!row || !row.keyword) {
            console.error('Invalid row for saving:', row);
            continue;
          }
          
          const alreadySaved = Array.isArray(savedKeywords) 
            ? savedKeywords.some(k => k && k.keyword === row.keyword)
            : false;
            
          if (!alreadySaved) {
            const keywordId = `keyword_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const ref = doc(db, 'users', user.uid, 'brands', activeBrandId, 'savedKeywords', keywordId);
            batch.set(ref, {
              ...row,
              brandId: activeBrandId,
              savedAt: new Date().toISOString(),
            });
            if (typeof onSaveKeyword === 'function') {
              onSaveKeyword(row);
            }
            operationCount++;
          }
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      // Clear selection before updating rows to prevent the error
      setRowSelectionModel([]);
      
      // Show success message
      if (operationCount > 0) {
        setSnackbar({
          open: true,
          message: `Successfully ${isSavedWordsTab ? 'removed' : 'added'} ${operationCount} keywords`,
          severity: 'success'
        });
      } else if (!isSavedWordsTab) {
        setSnackbar({
          open: true,
          message: 'All selected keywords were already saved',
          severity: 'info'
        });
      }
    } catch (err) {
      console.error('Error in bulk operation:', err);
      setSnackbar({
        open: true,
        message: `Error ${isSavedWordsTab ? 'removing' : 'saving'} keywords. Please try again.`,
        severity: 'error'
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // 7) DataGrid columns
  // ----------------------------------------------------------------
  const columns = useMemo(
    () => [
      { field: 'keyword', headerName: 'Keyword', flex: 1, minWidth: 200 },
      { field: 'searchVolume', headerName: 'Volume', width: 130, type: 'number' },
      { field: 'cpc', headerName: 'CPC ($)', width: 100, type: 'number' },
      { field: 'competition', headerName: 'Competition', width: 130 },
      {
        field: 'competitionIndex',
        headerName: 'Comp. Index',
        width: 130,
        type: 'number',
      },
      {
        field: 'save',
        headerName: 'Save',
        width: 70,
        sortable: false,
        renderCell: (params) => {
          const isSaved = Array.isArray(savedKeywords) 
            ? savedKeywords.some(k => k && k.keyword === params.row.keyword)
            : false;
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
        align: 'center',
      },
    ],
    [savedKeywords]
  );

  // ----------------------------------------------------------------
  // 8) DataGrid pagination, selection, etc.
  // ----------------------------------------------------------------
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [rowSelectionModel, setRowSelectionModel] = useState([]);

  // ----------------------------------------------------------------
  // 9) Filter Controls
  // ----------------------------------------------------------------
  const FilterControls = () => (
    <Box
      sx={{
      p: 2, 
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 2,
      alignItems: 'start',
      bgcolor: '#f5f6fa',
      borderRadius: 1,
        mb: 2,
      }}
    >
      {/* Volume Filter */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          Volume Range
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            type="text"
            defaultValue={inputRefs.current.volumeMin}
            onChange={handleInputChange('volumeMin')}
            InputProps={{ 
              inputProps: { 
                min: ranges.volume[0],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
          <Typography sx={{ mx: 0.5 }}>-</Typography>
          <TextField
            size="small"
            type="text"
            defaultValue={inputRefs.current.volumeMax}
            onChange={handleInputChange('volumeMax')}
            InputProps={{ 
              inputProps: { 
                max: ranges.volume[1],
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
            type="text"
            defaultValue={inputRefs.current.cpcMin}
            onChange={handleInputChange('cpcMin')}
            InputProps={{ 
              inputProps: { 
                min: ranges.cpc[0],
                step: 0.01
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
          <Typography sx={{ mx: 0.5 }}>-</Typography>
          <TextField
            size="small"
            type="text"
            defaultValue={inputRefs.current.cpcMax}
            onChange={handleInputChange('cpcMax')}
            InputProps={{ 
              inputProps: { 
                max: ranges.cpc[1],
                step: 0.01
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
        </Box>
      </Box>

      {/* Competition */}
      <Box>
        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
          Competition
        </Typography>
        <FormControl fullWidth size="small">
          <Select
            value={competitionValue}
            onChange={handleInputChange('competition')}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="LOW">Low</MenuItem>
            <MenuItem value="MEDIUM">Medium</MenuItem>
            <MenuItem value="HIGH">High</MenuItem>
            <MenuItem value="N/A">N/A</MenuItem>
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
            type="text"
            defaultValue={inputRefs.current.compIndexMin}
            onChange={handleInputChange('compIndexMin')}
            InputProps={{ 
              inputProps: { 
                min: ranges.compIndex[0],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
          <Typography sx={{ mx: 0.5 }}>-</Typography>
          <TextField
            size="small"
            type="text"
            defaultValue={inputRefs.current.compIndexMax}
            onChange={handleInputChange('compIndexMax')}
            InputProps={{ 
              inputProps: { 
                max: ranges.compIndex[1],
                step: 1
              },
              sx: { height: '40px' }
            }}
            fullWidth
          />
        </Box>
      </Box>

      {/* Apply Filters Button and Bulk Operation Button */}
      <Box gridColumn="span 4" sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={applyFilters}>
          Apply Filters
        </Button>
        {rowSelectionModel.length > 0 && (
          <Button 
            variant="contained" 
            color={isSavedWordsTab ? "error" : "primary"}
            onClick={handleBulkOperation}
            startIcon={isBulkSaving ? <CircularProgress size={20} color="inherit" /> : (isSavedWordsTab ? <RemoveIcon /> : <AddIcon />)}
            disabled={isBulkSaving}
          >
            {isBulkSaving 
              ? 'Processing...' 
              : `${isSavedWordsTab ? 'Bulk Remove' : 'Bulk Save'} (${rowSelectionModel.length})`
            }
          </Button>
        )}
      </Box>
    </Box>
  );

  // ----------------------------------------------------------------
  // 10) Render
  // ----------------------------------------------------------------
  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <FilterControls />

      <DataGrid
        rows={filteredRows}
        columns={columns}
        loading={loading}
        autoHeight
        checkboxSelection
        disableRowSelectionOnClick
        pageSizeOptions={[10, 20, 50]}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        rowHeight={60}
        rowSelectionModel={rowSelectionModel}
        onRowSelectionModelChange={(newSelection) => {
          // Only keep those that exist in filteredRows
          const valid = newSelection.filter((id) =>
            filteredRows.some((row) => row.id === id)
          );
          setRowSelectionModel(valid);
        }}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        sx={{
          '& .even': { backgroundColor: '#fff' },
          '& .odd': { backgroundColor: '#fafafa' },
                      '& .MuiDataGrid-columnHeader': {
                        backgroundColor: '#f5f6fa',
                      },
          '.MuiDataGrid-row': {
            borderBottom: '1px solid #ddd',
            cursor: 'pointer',
          },
          borderRadius: 1,
          border: '1px solid #ddd',
        }}
      />

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ 
          clickAwayListener: { 
            disableReactTree: true 
          } 
        }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
