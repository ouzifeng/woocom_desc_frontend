import React, { useState, useEffect } from 'react';
import { Box, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

const ProductsTable = ({ onSelect }) => {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [rows, setRows] = useState([]);
  const [rowSelectionModel, setRowSelectionModel] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  
  // State to store the total row count separately
  const [totalRows, setTotalRows] = useState(0);

  // Load products using backend pagination
  useEffect(() => {
    const fetchData = async () => {
      if (!user || !activeBrandId) {
        setLoading(false);
        setError('No brand selected');
        setRows([]);
        setTotalRows(0);
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
        url.searchParams.append('brandId', activeBrandId);
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();

        setRows(data.products);
        setTotalRows(data.totalProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
        setRows([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, paginationModel.page, paginationModel.pageSize, activeBrandId, refresh]);

  // Handle row selection and notify parent
  const handleRowSelectionChange = (newSelection) => {
    setRowSelectionModel(newSelection);
    
    // Pass the selected row to the parent
    if (newSelection.length === 1) {
      const selectedRow = rows.find(row => row.id === newSelection[0]);
      if (selectedRow) {
        onSelect(selectedRow);
      }
    } else if (newSelection.length === 0) {
      onSelect(null);
    }
  };

  // Simplified columns
  const columns = [
    {
      field: 'image',
      headerName: 'Image',
      width: 100,
      renderCell: (params) => (
        <img
          src={params.value}
          alt=""
          style={{
            width: '50px',
            height: '50px',
            objectFit: 'cover',
          }}
        />
      ),
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
    },
    {
      field: 'id',
      headerName: 'Product ID',
      width: 100,
    }
  ];

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Products
      </Typography>
      
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.7)',
            zIndex: 1
          }}>
            <CircularProgress />
          </Box>
        )}
      
        <DataGrid
          autoHeight
          pagination
          paginationMode="server"
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          rowHeight={70}
          rows={rows}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={handleRowSelectionChange}
          onRowClick={(params) => handleRowSelectionChange([params.id])}
          getRowClassName={(params) =>
            params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
          }
          sx={{
            '& .even': { backgroundColor: '#fafafa' },
            '& .odd': { backgroundColor: '#ffffff' },
            '.MuiDataGrid-row': { cursor: 'pointer' },
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
        )}
      </Box>
    </Paper>
  );
};

export default ProductsTable; 