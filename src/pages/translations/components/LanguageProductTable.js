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
  CircularProgress,
} from '@mui/material';

import debounce from 'lodash.debounce';
import { GridToolbarContainer } from '@mui/x-data-grid';
import TranslateIcon from '@mui/icons-material/Translate';
import AutoTranslateIcon from '@mui/icons-material/GTranslate';
import { languages } from './LanguageOptions';

/** Decode HTML entities */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function LanguageProductTable({ 
  refresh, 
  setRefresh, 
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

  // Add these new states near the top with other state declarations
  const [translationStatus, setTranslationStatus] = useState('');
  const [translatingProductId, setTranslatingProductId] = useState(null);

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
        return {
          id: docSnap.id,
          image: data.image,
          // For main tab, use original fields. For language tabs, use translated fields
          name: isMainTab ? data.name : (data[`${languageCode}_name`] || ''),
          description: isMainTab ? data.description : (data[`${languageCode}_description`] || ''),
          translated: Boolean(data[`${languageCode}_name`] && data[`${languageCode}_description`]),
          // Keep originals for translation function
          original_name: data.name,
          original_description: data.description,
          // Keep the language-specific fields for switch state
          [`${languageCode}_name`]: data[`${languageCode}_name`] || '',
          [`${languageCode}_description`]: data[`${languageCode}_description`] || ''
        };
      });

      console.log('Fetched products:', products); // Debug log
      setRows(products);
      setFilteredRows(products);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    }
  }, [user, languageCode, isMainTab]);

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
    }, 300), []
  );

  useEffect(() => {
    debouncedFilter(searchTerm, translatedFilter, rows);
    setRowSelectionModel([]);
  }, [searchTerm, translatedFilter, rows, debouncedFilter]);

  const handleTranslatedChange = useCallback(async (id, checked) => {
    if (!user) return;

    try {
      const productDocRef = doc(db, 'users', user.uid, 'products', String(id));
      await updateDoc(productDocRef, { translated: checked });
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  }, [user, setRefresh]);

  const handleStartTranslation = useCallback(async (productIds) => {
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
  }, [user, languageCode, setRefresh]);

  const handleAutoTranslate = useCallback(async (productId, originalName, originalDescription) => {
    if (!user) return;

    try {
      setTranslatingProductId(productId);
      setTranslationStatus('Sending translation to the translation agent...');

      const languageName = languages.find(lang => lang.code === languageCode)?.name || languageCode;

      setTranslationStatus('Translating...');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/translations/translate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: {
            name: originalName,
            description: originalDescription
          },
          targetLanguage: languageName,
          languageCode: languageCode
        }),
      });

      const data = await response.json();
      
      if (data.result === 'Success') {
        setTranslationStatus('Translation success!');
        // Update Firestore
        const productRef = doc(db, 'users', user.uid, 'products', productId);
        await updateDoc(productRef, {
          [`${languageCode}_name`]: data.translatedContent.name,
          [`${languageCode}_description`]: data.translatedContent.description,
          translated: true
        });

        // Clear status after a delay
        setTimeout(() => {
          setTranslationStatus('');
          setTranslatingProductId(null);
        }, 3000);

        await fetchData();
        setRefresh(prev => !prev);
      }
    } catch (error) {
      console.error('Error auto-translating:', error);
      setTranslationStatus('Translation failed');
      setTimeout(() => {
        setTranslationStatus('');
        setTranslatingProductId(null);
      }, 3000);
    }
  }, [user, languageCode, setRefresh, fetchData]);

  // Update columns definition based on language
  const columns = useMemo(() => {
    if (isMainTab) {
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
          field: 'name',
          headerName: 'Name',
          flex: 1,
          renderCell: (params) => decodeHtmlEntities(params.value),
        },
        {
          field: 'description',
          headerName: 'Description',
          flex: 2,
          renderCell: (params) => decodeHtmlEntities(params.value),
        }
      ];
    } else {
      // Language tab - ONLY show translated fields
      return [
        { field: 'id', headerName: 'ID', width: 80 },
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
          field: 'name',
          headerName: 'Name',
          flex: 1,
          renderCell: (params) => decodeHtmlEntities(params.value),
        },
        {
          field: 'description',
          headerName: 'Description',
          flex: 2,
          renderCell: (params) => decodeHtmlEntities(params.value),
        },
        {
          field: 'translated',
          headerName: 'Translated',
          width: 100,
          renderCell: (params) => (
            <Switch
              checked={Boolean(params.row[`${languageCode}_name`] && params.row[`${languageCode}_description`])}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => {
                if (event.target.checked) {
                  // If turning on, trigger translation
                  handleAutoTranslate(
                    params.row.id,
                    params.row.original_name,
                    params.row.original_description
                  );
                } else {
                  // If turning off, remove translations
                  const productRef = doc(db, 'users', user.uid, 'products', params.row.id);
                  updateDoc(productRef, {
                    [`${languageCode}_name`]: '',
                    [`${languageCode}_description`]: '',
                    translated: false
                  }).then(() => {
                    setRefresh(prev => !prev);
                  });
                }
              }}
            />
          ),
        }
      ];
    }
  }, [isMainTab, languageCode, handleAutoTranslate]);

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
      // For language tabs, navigate to product page with language suffix
      window.location.href = `/products/${params.id}_${languageCode}`;
    }
  };

  // Add toolbar with batch actions
  const CustomToolbar = () => {
    if (isMainTab) return null;

    const handleBatchTranslate = async (checked) => {
      if (rowSelectionModel.length === 0) return;

      for (const id of rowSelectionModel) {
        const row = rows.find(r => r.id === id);
        if (row) {
          if (checked) {
            // If turning on, translate
            await handleAutoTranslate(
              row.id, 
              row.original_name,
              row.original_description
            );
          } else {
            // If turning off, remove translations
            const productRef = doc(db, 'users', user.uid, 'products', row.id);
            await updateDoc(productRef, {
              [`${languageCode}_name`]: '',
              [`${languageCode}_description`]: '',
              translated: false
            });
          }
        }
      }
      setRefresh(prev => !prev);
    };

    return (
      <GridToolbarContainer>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            Translate Selected ({rowSelectionModel.length})
          </Typography>
          <Switch
            disabled={rowSelectionModel.length === 0}
            checked={false}
            onChange={(e) => handleBatchTranslate(e.target.checked)}
          />
        </Box>
      </GridToolbarContainer>
    );
  };

  // Add languageCode to dependency array of useEffect to clear selection on tab change
  useEffect(() => {
    setRowSelectionModel([]); // Clear selection when tab changes
  }, [languageCode]);

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

          {/* Add translation status indicator */}
          {translationStatus && (
            <Box 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                gap: 1,
                color: translationStatus.includes('success') ? 'success.main' : 'info.main'
              }}
            >
              {translationStatus.includes('Translating') && (
                <CircularProgress size={20} color="inherit" />
              )}
              <Typography variant="body2">
                {translatingProductId && `Product ${translatingProductId}: `}
                {translationStatus}
              </Typography>
            </Box>
          )}

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
              const validSelection = newSelection.filter(id => 
                filteredRows.some(row => row.id === id)
              );
              setRowSelectionModel(validSelection);
            }}
            keepNonExistentRowsSelected={false}
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
