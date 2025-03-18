import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { useNavigate } from 'react-router-dom';

/** A helper that converts Firestore status -> UI label + MUI color */
function renderStatus(status) {
  // Map "Published" -> "success" (green), "Draft" -> "default" (gray)
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

export default function ProductsTable({ refresh, setRefresh }) {
  const [user] = useAuthState(auth);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Keep pagination model in state so it doesn't default to 100 rows
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  // Fetch Firestore data
  const fetchData = useCallback(async () => {
    if (user) {
      try {
        const productsCollection = collection(db, 'users', user.uid, 'products');
        const productsSnapshot = await getDocs(productsCollection);
        const products = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort products in descending order by product ID
        products.sort((a, b) => b.id - a.id);
        setRows(products);
        setMessage(`Fetched ${products.length} products`);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user, refresh, fetchData]);

  // Define your columns
  const columns = [
    { field: 'id', headerName: 'ID', width: 150 },
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
          style={{ width: '50px', height: '50px', marginTop: "10px", marginBottom: "10px" }}
        />
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1 },
  ];

  const handleRowClick = (params) => {
    navigate(`/products/${params.id}`);
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      {error ? (
        <Typography variant="body2" color="error">
          {`Error fetching products: ${error}`}
        </Typography>
      ) : (
        <>
          {message && (
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              {message}
            </Typography>
          )}
          <DataGrid
            pagination
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            pageSizeOptions={[10, 20, 50]}
            rowHeight={70}
            rows={rows}
            columns={columns}
            checkboxSelection
            disableColumnResize
            onRowClick={handleRowClick}
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
            }
            slotProps={{
              filterPanel: {
                filterFormProps: {
                  logicOperatorInputProps: {
                    variant: 'outlined',
                    size: 'small',
                  },
                  columnInputProps: {
                    variant: 'outlined',
                    size: 'small',
                    sx: { mt: 'auto' },
                  },
                  operatorInputProps: {
                    variant: 'outlined',
                    size: 'small',
                    sx: { mt: 'auto' },
                  },
                  valueInputProps: {
                    InputComponentProps: {
                      variant: 'outlined',
                      size: 'small',
                    },
                  },
                },
              },
            }}
            sx={{
              '& .even': { backgroundColor: '#fafafa' },
              '& .odd': { backgroundColor: '#ffffff' },
              '.MuiDataGrid-row': {
                cursor: 'pointer',
              },
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
