import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://us-central1-apps-84c5e.cloudfunctions.net/api'
  : 'http://localhost:5000';

const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Helper function to get cache key
const getCacheKey = (brandId, startDate, endDate) => {
  return `top_products_${brandId}_${startDate}_${endDate}`;
};

// Helper function to check if cache is valid
const isValidCache = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Helper function to get cached data
const getCachedData = (cacheKey) => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (!isValidCache(timestamp)) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
};

// Helper function to set cached data
const setCachedData = (cacheKey, data) => {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error writing to cache:', error);
  }
};

export default function TopProductsChart({ startDate, endDate, selectedCurrency }) {
  const theme = useTheme();
  const { activeBrandId } = useBrand();
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
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

    const cacheKey = getCacheKey(activeBrandId, startDate, endDate);
    const cachedData = getCachedData(cacheKey);

    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/top-products?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

  if (loading) return <Typography>Loading...</Typography>;
  
  if (error) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Top Products
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
            Top Products
          </Typography>
          <Typography>No products data available for the selected period</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Top Products by Revenue
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: selectedCurrency,
              }).format(total)}
            </Typography>
            <Chip size="small" color="primary" label={`${startDate} → ${endDate}`} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Revenue by product for the selected period
          </Typography>
        </Stack>

        <BarChart
          colors={[theme.palette.primary.main]}
          xAxis={[{
            scaleType: 'band',
            data: data.map(d => d.name),
          }]}
          series={[{
            id: 'revenue',
            label: 'Revenue',
            data: data.map(d => d.value),
          }]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        />
      </CardContent>
    </Card>
  );
}
