import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
  : 'http://localhost:5000';

// Helper function to parse dates safely
const parseDate = (dateStr) => {
  try {
    // Handle YYYYMMDD format
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return new Date(year, parseInt(month, 10) - 1, day);
    }
    
    // Try parsing the date directly
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    return date;
  } catch (error) {
    console.warn(`Error parsing date: ${dateStr}`, error);
    return null;
  }
};

// Helper function to format dates
const formatDate = (dateStr) => {
  const date = parseDate(dateStr);
  if (!date) return dateStr; // Return original string if parsing fails
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Helper function to format date range
const formatDateRange = (startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  if (!start || !end) {
    return `${startDate} → ${endDate}`;
  }
  
  return `${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(start)} → ${new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(end)}`;
};

export default function RevenueTrendChart({ startDate, endDate, selectedCurrency }) {
  const theme = useTheme();
  const { activeBrandId } = useBrand();
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);
  const [error, setError] = React.useState(null);

  const getTrends = async () => {
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
        `${API_BASE_URL}/analytics/dashboard/trends?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch revenue trends');
      }
      
      const json = await res.json();

      const chartData = json.trends.map(row => ({
        date: row.date,
        value: parseFloat(row.revenue),
      }));

      const totalRevenue = chartData.reduce((sum, d) => sum + d.value, 0);

      setData(chartData);
      setTotal(totalRevenue);
    } catch (err) {
      console.error('Error loading revenue data:', err);
      setError(err.message || 'Failed to load revenue data');
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeBrandId) {
      getTrends();
    }
  }, [startDate, endDate, activeBrandId]);

  if (loading) return <Typography>Loading...</Typography>;
  
  if (error) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Revenue Trend
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
            Revenue Trend
          </Typography>
          <Typography>No revenue data available for the selected period</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Revenue Trend
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4">
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: selectedCurrency,
              }).format(total)}
            </Typography>
            <Chip size="small" color="primary" label={formatDateRange(startDate, endDate)} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Based on daily purchase revenue
          </Typography>
        </Stack>

        <LineChart
          colors={[theme.palette.primary.main]}
          xAxis={[{
            scaleType: 'point',
            data: data.map(d => formatDate(d.date)),
            tickLabelStyle: {
              angle: 45,
              textAnchor: 'start',
              fontSize: 12
            }
          }]}
          series={[{
            id: 'revenue',
            label: 'Revenue',
            data: data.map(d => d.value),
            curve: 'linear',
          }]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        />
      </CardContent>
    </Card>
  );
}
