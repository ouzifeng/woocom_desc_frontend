import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';
import { API_BASE_URL, getCacheKey, getCachedData, setCachedData, getAuthHeaders } from './MainGrid';

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

export default function PageViewsBarChart({ startDate, endDate }) {
  const theme = useTheme();
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

  const fetchPageViews = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      setLoading(false);
      setData([]);
      return;
    }

    const cacheKey = getCacheKey('page_views', activeBrandId, startDate, endDate);
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

      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/trends?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`, {
        headers
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch page views');
      }

      const json = await res.json();
      const pageViewsData = json.trends || [];
      
      // Cache the data
      setCachedData(cacheKey, pageViewsData);
      
      setData(pageViewsData);
    } catch (err) {
      console.error('Error loading page views:', err);
      setError(err.message || 'Failed to load page views');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeBrandId) {
      fetchPageViews();
    }
  }, [startDate, endDate, activeBrandId]);

  const colorPalette = [
    theme.palette.primary.dark,
    theme.palette.primary.main,
    theme.palette.primary.light,
  ];

  // Calculate total views from the pageViews field in the trends data
  const totalViews = data.reduce((sum, item) => sum + (parseInt(item.pageViews || 0, 10)), 0);

  if (loading) return <Typography>Loading...</Typography>;
  
  if (error) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Page Views
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
            Page Views
          </Typography>
          <Typography>No page views data available for the selected period</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Page Views
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="p">
              {totalViews.toLocaleString()}
            </Typography>
            <Chip size="small" color="primary" label={formatDateRange(startDate, endDate)} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Page views during selected range
          </Typography>
        </Stack>

        <BarChart
          colors={colorPalette}
          xAxis={[{ 
            scaleType: 'band', 
            data: data.map(d => formatDate(d.date)),
            tickLabelStyle: {
              angle: 45,
              textAnchor: 'start',
              fontSize: 12
            }
          }]}
          series={[
            {
              id: 'page-views',
              label: 'Page Views',
              data: data.map(d => parseInt(d.pageViews || 0, 10)),
            }
          ]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
          grid={{ horizontal: true }}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
        />
      </CardContent>
    </Card>
  );
}
