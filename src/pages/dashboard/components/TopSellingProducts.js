import * as React from 'react';
import {
  Card, CardContent, Typography,
  Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Box, Chip
} from '@mui/material';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';
import { API_BASE_URL, getCacheKey, getCachedData, setCachedData, getAuthHeaders } from './MainGrid';

// Helper to decode HTML entities like &quot; and &amp;
const decodeHtml = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

export default function TopSellingProductsTable({ startDate, endDate, selectedCurrency }) {
  const { activeBrandId } = useBrand();
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Clear data when brand changes
  React.useEffect(() => {
    setData([]);
    setLoading(true);
    setError(null);
  }, [activeBrandId]);

  const fetchTopProducts = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      setLoading(false);
      setData([]);
      return;
    }

    const cacheKey = getCacheKey('top_products', activeBrandId, startDate, endDate);
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/top-products?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`, {
        headers
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch top products');
      }

      const json = await res.json();
      
      // Cache the data
      setCachedData(cacheKey, json.products);
      
      setData(json.products);
    } catch (err) {
      console.error('Error loading top products:', err);
      setError(err.message || 'Failed to load top products');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeBrandId) {
      fetchTopProducts();
    }
  }, [startDate, endDate, activeBrandId]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
    }).format(value || 0);
  };

  if (loading) return <Typography>Loading...</Typography>;

  if (error) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Top Selling Products
          </Typography>
          <Typography color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Top Selling Products
          </Typography>
          <Typography>No product data available for the selected period</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography component="h2" variant="subtitle2">
            Top Selling Products
          </Typography>
          <Chip
            size="small"
            color="primary"
            label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
          />
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Product Name</TableCell>
                <TableCell align="right">Units Sold</TableCell>
                <TableCell align="right">Revenue</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((product, i) => (
                <TableRow key={product.itemName}>
                  <TableCell>{decodeHtml(product.itemName)}</TableCell>
                  <TableCell align="right">{product.itemsPurchased}</TableCell>
                  <TableCell align="right">{formatCurrency(product.itemRevenue)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
