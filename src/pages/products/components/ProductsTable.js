import * as React from 'react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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
} from '@mui/material';

import debounce from 'lodash.debounce';

/** Helper to render status chip */
function renderStatus(status) {
  const colorMap = {
    Published: 'success',
    Draft: 'default',
  };
  return (
    <Chip label={status} color={colorMap[status] || 'default'} size="small" />
  );
}

/** Decode HTML entities */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function ProductsTable({ refresh, setRefresh, setSelectedRows }) {
  const [user] = useAuthState(auth);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [improvedFilter, setImprovedFilter] = useState('');
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      const productsCollection = collection(db, 'users', user.uid, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const products = productsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

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
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user, refresh, fetchData]);

  // Debounced filter logic
  const debouncedFilter = useMemo(() =>
    debounce((input, status, improved, allRows) => {
      let filtered = [...allRows];

      if (input) {
        const lower = input.toLowerCase();
        filtered = filtered.filter((row) =>
          decodeHtmlEntities(row.name || '').toLowerCase().includes(lower)
        );
      }

      if (status) {
        filtered = filtered.filter((row) => (row.status || '').toLowerCase() === status);
      }

      if (improved) {
        filtered = filtered.filter((row) => String(row.improved) === improved);
      }

      setFilteredRows(filtered);
      setRowSelectionModel([]); // Clear selection to prevent crash
      setSelectedRows([]);
    }, 300), [setSelectedRows]
  );

  useEffect(() => {
    debouncedFilter(searchTerm, statusFilter, improvedFilter, rows);
  }, [searchTerm, statusFilter, improvedFilter, rows, debouncedFilter]);

  const handleImprovedChange = async (id, checked) => {
    if (!user) return;

    try {
      const productDocRef = doc(db, 'users', user.uid, 'products', String(id));
      await updateDoc(productDocRef, { improved: checked });
      setRefresh((prev) => !prev);
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 150 },
    {
      field: 'improved',
      headerName: 'Improved',
      width: 150,
      renderCell: (params) => (
        <Switch
          checked={Boolean(params.value)}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => handleImprovedChange(params.id, event.target.checked)}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const value = params.value === 'publish' ? 'Published' : 'Draft';
        return renderStatus(value);
      },
    },
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
      field: 'name',
      headerName: 'Name',
      flex: 1,
      renderCell: (params) => decodeHtmlEntities(params.value),
    },
  ];

  const handleRowClick = (params) => {
    window.open(`/products/${params.id}`, '_blank');
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
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1 }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="publish">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Improved</InputLabel>
              <Select
                value={improvedFilter}
                label="Improved"
                onChange={(e) => setImprovedFilter(e.target.value)}
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
          />
        </>
      )}
    </Box>
  );
}
