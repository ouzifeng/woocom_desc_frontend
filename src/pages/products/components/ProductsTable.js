import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { DataGrid } from '@mui/x-data-grid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { TableLoadingSpinner } from './TableLoadingSpinner';
import { useBrand } from '../../../contexts/BrandContext';

import {
  Box,
  Typography,
  Chip,
  Switch,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
} from '@mui/material';

/** Status chip */
function renderStatus(status) {
  const colorMap = {
    publish: 'success',
    draft: 'default',
  };
  return (
    <Chip label={status} color={colorMap[status] || 'default'} size="small" />
  );
}

/** Decode HTML */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function ProductsTable() {
  const { refresh, setRefresh, setSelectedRows } = useOutletContext();
  const [user] = useAuthState(auth);
  const { activeBrandId, activeBrand } = useBrand();
  const [rows, setRows] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
    rowCount: 0,
  });

  const [statusFilter, setStatusFilter] = useState('');
  const [improvedFilter, setImprovedFilter] = useState('');

  const navigate = useNavigate();

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleImprovedFilterChange = (e) => {
    setImprovedFilter(e.target.value);
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    if (!activeBrandId) {
      setError('No brand selected. Please select a brand to view products.');
      setLoading(false);
      setRows([]);
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const token = await user.getIdToken();
      const url = new URL(`${process.env.REACT_APP_API_URL}/product/product-table`);
      url.searchParams.append('page', paginationModel.page + 1);
      url.searchParams.append('pageSize', paginationModel.pageSize);
      url.searchParams.append('sortField', 'name');
      url.searchParams.append('sortDirection', 'asc');
      url.searchParams.append('status', statusFilter || '');
      url.searchParams.append('improved', improvedFilter || '');
      url.searchParams.append('brandId', activeBrandId);

      console.log(`Fetching products for brand: ${activeBrandId}`);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();

      setRows(data.products);
      setPaginationModel((prev) => ({
        ...prev,
        rowCount: data.totalProducts,
      }));
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user, paginationModel.page, paginationModel.pageSize, statusFilter, improvedFilter, activeBrandId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refresh, activeBrandId]);

  const handleImprovedChange = async (id, checked) => {
    if (!user || !activeBrandId) return;
    try {
      const productDocRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'products', String(id));
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
      renderCell: (params) => renderStatus(params.value),
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
    navigate(`/products/${params.id}`);
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {!activeBrandId ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Please select a brand to view products.
        </Alert>
      ) : error ? (
        <Typography variant="body2" color="error">
          {`Error fetching products: ${error}`}
        </Typography>
      ) : (
        <>
          {activeBrand && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              Showing products for brand: <strong>{activeBrand.name}</strong>
            </Typography>
          )}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              mb: 2,
              width: '100%',
              maxWidth: 400
            }}
          >
            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={handleStatusChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="publish">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: 1 }}>
              <InputLabel>Improved</InputLabel>
              <Select
                value={improvedFilter}
                label="Improved"
                onChange={handleImprovedFilterChange}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ position: 'relative' }}>
            {loading && <TableLoadingSpinner />}
          <DataGrid
              autoHeight
            pagination
              paginationMode="server"
              rowCount={paginationModel.rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            rowHeight={70}
              rows={rows}
            columns={columns}
            checkboxSelection
            disableRowSelectionOnClick
            disableColumnResize
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(newSelection) => {
              const validSelection = newSelection.filter((id) =>
                  rows.some((row) => String(row.id) === String(id))
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
          </Box>
        </>
      )}
    </Box>
  );
}
