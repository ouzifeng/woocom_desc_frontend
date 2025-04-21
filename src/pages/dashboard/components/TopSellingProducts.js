import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography,
  Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
  Box, Chip
} from '@mui/material';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

// Helper to decode HTML entities like &quot; and &amp;
const decodeHtml = (html) => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://us-central1-apps-84c5e.cloudfunctions.net/api'
  : 'http://localhost:5000';

export default function TopSellingProductsTable({ startDate, endDate, selectedCurrency }) {
  const { activeBrandId } = useBrand();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getTopProducts = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      const res = await fetch(
        `${API_BASE_URL}/analytics/dashboard/top-products?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch top products');
      }

      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error('Error loading product data:', err);
      setError(err.message || 'Failed to load product data');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBrandId) {
      getTopProducts();
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

  if (products.length === 0) {
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
              {products.map((product, i) => (
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
