import * as React from 'react';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { DataGrid } from '@mui/x-data-grid';

const API_URL = process.env.REACT_APP_API_URL;

export default function SearchResults() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      const query = new URLSearchParams(location.search).get('query');
      if (!query) {
        setError('No search query provided');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/search?query=${query}`);
        const result = await response.json();

        if (result.result === 'Success') {
          setProducts(result.products);
        } else {
          setError(result.message);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setError('Failed to fetch search results');
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [location.search]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 150 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'status', headerName: 'Status', width: 150 },
    { field: 'image', headerName: 'Image', width: 150, renderCell: (params) => (
      <img src={params.value} alt="" style={{ width: '50px', height: '50px' }} />
    )},
  ];

  return (
    <Box sx={{ p: 3 }}>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : (
        <DataGrid rows={products} columns={columns} pageSize={10} autoHeight />
      )}
    </Box>
  );
}
