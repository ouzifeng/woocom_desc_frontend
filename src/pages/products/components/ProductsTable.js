import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

function renderStatus(status) {
  const colorMap = {
    Published: 'success',
    Draft: 'default',
  };

  return (
    <Chip
      label={status}
      color={colorMap[status] || 'default'}
      size="small"
    />
  );
}

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
  const [error, setError] = useState(null);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const [rowSelectionModel, setRowSelectionModel] = useState([]);

  const fetchData = useCallback(async () => {
    if (user) {
      try {
        const productsCollection = collection(db, 'users', user.uid, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const products = productsSnapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        products.sort((a, b) => {
          const aNum = Number(a.id);
          const bNum = Number(b.id);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return bNum - aNum;
          }
          return b.id.localeCompare(a.id);
        });

        setRows(products);
        setFilteredRows(products);
      } catch (err) {
        setError(err.message);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user, refresh, fetchData]);

  useEffect(() => {
    let filtered = rows;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter((row) =>
        decodeHtmlEntities(row.name || '').toLowerCase().includes(lower)
      );
    }

    if (statusFilter) {
      filtered = filtered.filter((row) => (row.status || '').toLowerCase() === statusFilter);
    }

    if (improvedFilter) {
      filtered = filtered.filter((row) => String(row.improved) === improvedFilter);
    }

    setFilteredRows(filtered);
  }, [searchTerm, statusFilter, improvedFilter, rows]);

  const handleImprovedChange = async (id, checked) => {
    if (user) {
      try {
        const productDocRef = doc(db, 'users', user.uid, 'products', String(id));
        await updateDoc(productDocRef, { improved: checked });
        setRefresh((prev) => !prev);
      } catch (err) {
        console.error('Error updating product:', err);
      }
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
          inputProps={{ 'aria-label': 'Improved switch' }}
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
          style={{ width: '50px', height: '50px', marginTop: '10px', marginBottom: '10px' }}
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
              setRowSelectionModel(newSelection);
              setSelectedRows(newSelection);
            }}
            onRowClick={handleRowClick}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
            }
            slotProps={{
              filterPanel: {
                filterFormProps: {
                  logicOperatorInputProps: { variant: 'outlined', size: 'small' },
                  columnInputProps: { variant: 'outlined', size: 'small', sx: { mt: 'auto' } },
                  operatorInputProps: { variant: 'outlined', size: 'small', sx: { mt: 'auto' } },
                  valueInputProps: {
                    InputComponentProps: { variant: 'outlined', size: 'small' },
                  },
                },
              },
            }}
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
