import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

import {
  Box,
  Typography,
  Chip,
  Switch,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Button,
} from '@mui/material';

import debounce from 'lodash.debounce';
import { GridToolbarContainer } from '@mui/x-data-grid';
import TranslateIcon from '@mui/icons-material/Translate';

/** Decode HTML entities */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function LanguageProductTable({ 
  refresh, 
  setRefresh, 
  setSelectedRows, 
  languageCode,
  isMainTab 
}) {
  const [user] = useAuthState(auth);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Load filters from localStorage or use default values
  const loadInitialFilters = () => {
    try {
      const savedFilters = localStorage.getItem('productTableFilters');
      if (savedFilters) {
        const { timestamp, filters } = JSON.parse(savedFilters);
        const isExpired = Date.now() - timestamp > 24 * 60 * 60 * 1000; // 24 hours
        
        if (!isExpired) {
          return filters;
        }
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
    
    // Default values if no saved filters or expired
    return {
      searchTerm: '',
      translatedFilter: ''
    };
  };

  // Initialize state with saved filters
  const initialFilters = loadInitialFilters();
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm);
  const [translatedFilter, setTranslatedFilter] = useState(initialFilters.translatedFilter);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filtersData = {
      timestamp: Date.now(),
      filters: {
        searchTerm,
        translatedFilter
      }
    };
    localStorage.setItem('productTableFilters', JSON.stringify(filtersData));
  }, [searchTerm, translatedFilter]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTranslatedFilterChange = (e) => {
    setTranslatedFilter(e.target.value);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const productsCollection = collection(db, 'users', user.uid, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const products = productsSnapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        if (!isMainTab) {
          // For language tabs, show the translated fields (or empty if not translated)
          return {
            id: docSnap.id,
            image: data.image,
            name: data[`${languageCode}_name`] || '', // Don't fallback to original name
            description: data[`${languageCode}_description`] || '',
            translated: Boolean(data[`${languageCode}_name`] && data[`${languageCode}_description`]),
            original_name: data.name, // Keep original for reference
            original_description: data.description // Keep original for reference
          };
        }
        return {
          id: docSnap.id,
          ...data
        };
      });

      // Sort descending by numeric ID if possible
      products.sort((a, b) => {
        const aNum = Number(a.id);
        const bNum = Number(b.id);
        return !isNaN(aNum) && !isNaN(bNum) ? bNum - aNum : b.id.localeCompare(a.id);
      });

      setRows(products);
      setFilteredRows(products);
    } catch (err) {
      setError(err.message);
    }
  }, [user, isMainTab, languageCode]);

  useEffect(() => {
    fetchData();
  }, [user, refresh, fetchData]);

  // Debounced filter logic
  const debouncedFilter = useMemo(() =>
    debounce((input, translated, allRows) => {
      let filtered = [...allRows];

      if (input) {
        const lower = input.toLowerCase();
        filtered = filtered.filter((row) =>
          decodeHtmlEntities(row.name || '').toLowerCase().includes(lower)
        );
      }

      if (translated) {
        filtered = filtered.filter((row) => {
          if (translated === 'true') {
            return Boolean(row.translated) === true;
          } else {
            return !row.translated;
          }
        });
      }

      setFilteredRows(filtered);
      setRowSelectionModel([]);
      setSelectedRows([]);
    }, 300), [setSelectedRows]
  );

  useEffect(() => {
    debouncedFilter(searchTerm, translatedFilter, rows);
  }, [searchTerm, translatedFilter, rows, debouncedFilter]);

  const handleTranslatedChange = async (id, checked) => {
    if (!user) return;

    try {
      const productDocRef = doc(db, 'users', user.uid, 'products', String(id));
      await updateDoc(productDocRef, { translated: checked });
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const handleStartTranslation = async (productIds) => {
    if (!user) return;
    
    try {
      const batch = writeBatch(db);
      
      productIds.forEach(productId => {
        const productRef = doc(db, 'users', user.uid, 'products', productId);
        batch.update(productRef, {
          [`${languageCode}_name`]: '',
          [`${languageCode}_description`]: '',
          translated: false
        });
      });

      await batch.commit();
      setRefresh(prev => !prev);
    } catch (error) {
      console.error('Error starting translation:', error);
    }
  };

  // Update columns definition based on language
  const columns = useMemo(() => {
    if (isMainTab) {
      return [
        { field: 'id', headerName: 'ID', width: 150 },
        {
          field: 'image',
          headerName: 'Image',
          width: 150,
          renderCell: (params) => (
            <img
              src={params.value}
              alt=""
              style={{
                width: '50px',
                height: '50px',
                objectFit: 'cover',
                marginTop: '10px',
                marginBottom: '10px',
              }}
            />
          ),
        },
        {
          field: 'translated',
          headerName: 'Translated',
          width: 150,
          renderCell: (params) => (
            <Switch
              checked={Boolean(params.value)}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => handleTranslatedChange(params.id, event.target.checked)}
            />
          ),
        },
        {
          field: 'name',
          headerName: 'Name',
          flex: 1,
          renderCell: (params) => decodeHtmlEntities(params.value),
        }
      ];
    } else {
      // Language tab columns
      return [
        { field: 'id', headerName: 'ID', width: 100 },
        {
          field: 'image',
          headerName: 'Image',
          width: 100,
          renderCell: (params) => (
            <img
              src={params.value}
              alt=""
              style={{
                width: '40px',
                height: '40px',
                objectFit: 'cover',
              }}
            />
          ),
        },
        {
          field: 'original_name',
          headerName: 'Original Name',
          flex: 1,
          renderCell: (params) => decodeHtmlEntities(params.value),
        },
        {
          field: 'translation_status',
          headerName: 'Status',
          width: 150,
          renderCell: (params) => {
            const hasTranslationStarted = params.row[`${languageCode}_name`] !== undefined;
            
            if (!hasTranslationStarted) {
              return (
                <Button
                  startIcon={<TranslateIcon />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartTranslation([params.row.id]);
                  }}
                >
                  Start Translation
                </Button>
              );
            }

            return (
              <Chip 
                label={params.row.translated ? "Translated" : "In Progress"} 
                color={params.row.translated ? "success" : "warning"}
                size="small" 
              />
            );
          }
        },
        {
          field: 'name',
          headerName: 'Translated Name',
          flex: 1,
          renderCell: (params) => {
            const hasTranslationStarted = params.row[`${languageCode}_name`] !== undefined;
            return hasTranslationStarted ? decodeHtmlEntities(params.value || '') : '-';
          },
        }
      ];
    }
  }, [isMainTab, languageCode, handleTranslatedChange, handleStartTranslation]);

  // Add handler for cell editing
  const handleCellEdit = async (params) => {
    if (!user) return;

    try {
      const productDocRef = doc(db, 'users', user.uid, 'products', String(params.id));
      await updateDoc(productDocRef, {
        [params.field]: params.value
      });
      setRefresh(prev => !prev);
    } catch (err) {
      console.error('Error updating translation:', err);
    }
  };

  const handleRowClick = (params) => {
    if (isMainTab) {
      window.location.href = `/products/${params.id}`;
    } else {
      window.location.href = `/translations/${params.id}_${languageCode}`;
    }
  };

  // Add toolbar with batch actions
  const CustomToolbar = () => {
    if (isMainTab) return null;

    return (
      <GridToolbarContainer>
        <Button
          startIcon={<TranslateIcon />}
          disabled={rowSelectionModel.length === 0}
          onClick={() => handleStartTranslation(rowSelectionModel)}
        >
          Start Translation for Selected ({rowSelectionModel.length})
        </Button>
      </GridToolbarContainer>
    );
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {error ? (
        <Typography variant="body2" color="error">
          {`Error fetching products: ${error}`}
        </Typography>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
              mb: 2,
            }}
          >
            <TextField
              label="Search Products"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ flexGrow: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Translated</InputLabel>
              <Select
                value={translatedFilter}
                label="Translated"
                onChange={handleTranslatedFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <DataGrid
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            rowHeight={70}
            rows={filteredRows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            disableColumnResize
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(newSelection) => {
              const validSelection = newSelection.filter((id) =>
                filteredRows.some((row) => row.id === id)
              );
              setRowSelectionModel(validSelection);
              setSelectedRows(validSelection);
            }}
            onRowClick={handleRowClick}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
            }
            sx={{
              '& .even': { backgroundColor: '#fafafa' },
              '& .odd': { backgroundColor: '#ffffff' },
              '.MuiDataGrid-row': { cursor: 'pointer' },
              '.MuiDataGrid-cell': {
                lineHeight: 'normal !important',
                display: 'flex',
                alignItems: 'center',
              },
            }}
            onCellEditCommit={handleCellEdit}
            components={{
              Toolbar: CustomToolbar
            }}
          />
        </>
      )}
    </Box>
  );
}
