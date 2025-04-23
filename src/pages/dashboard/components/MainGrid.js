import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import StatCard from './StatCard';
import Copyright from '../internals/components/Copyright';
import { auth } from '../../../firebase';
import { TextField, Select, MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import SessionsChart from './SessionsComponent';
import PageViewsBarChart from './PageViewsBarChart';
import TopProductsChart from './TopProductsChart';
import RevenueTrendChart from './RevenueTrendChart';
import { useBrand } from '../../../contexts/BrandContext';
import TopSellingProducts from './TopSellingProducts';
import AverageOrderValue from './AverageOrderValue';
import ConversionRate from './ConversionRate';
import TrafficChannelsChart from './TrafficChannelsChart';
import DeviceBreakdownTable from './DeviceBreakDownTable';
import TopLocationsTable from './TopLocationsTable';
import GoogleAdsKeywordsTable from './GoogleAdsKeyWordsTable';
import GoogleAdsSearchQueriesTable from './GoogleAdsSearchQueriesTable';
import BounceRateCard from './BounceRateCard';
import { useStoreConnection } from '../../../contexts/StoreConnectionContext';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

export const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://us-central1-apps-84c5e.cloudfunctions.net/api'
  : 'http://localhost:5000';

export const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds

// Shared cache utilities
export const getCacheKey = (type, brandId, startDate, endDate) => {
  return `${type}_${brandId}_${startDate}_${endDate}`;
};

export const isValidCache = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export const getCachedData = (cacheKey) => {
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

export const setCachedData = (cacheKey, data) => {
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

// Helper function to get auth headers
export const getAuthHeaders = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

// Currency options
const currencyOptions = [
  { code: 'USD', symbol: '$' },
  { code: 'GBP', symbol: '£' },
  { code: 'EUR', symbol: '€' },
  { code: 'JPY', symbol: '¥' },
];

const dummyChart = (title) => (
  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
    <Typography variant="subtitle1" gutterBottom>{title}</Typography>
    <Box sx={{ height: 200, background: '#f5f5f5', borderRadius: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="body2" color="text.secondary">[Chart Placeholder]</Typography>
    </Box>
  </Paper>
);

export default function MainGrid() {
  const [loading, setLoading] = React.useState(true);
  const [overview, setOverview] = React.useState(null);
  const [startDate, setStartDate] = React.useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [tempStartDate, setTempStartDate] = React.useState(startDate);
  const [tempEndDate, setTempEndDate] = React.useState(endDate);
  const [comparisonPeriod, setComparisonPeriod] = React.useState('');
  const [selectedCurrency, setSelectedCurrency] = React.useState('USD');
  const { activeBrandId } = useBrand();
  const { hasGoogleAnalytics, loading: gaLoading } = useStoreConnection();
  const navigate = useNavigate();

  // Helper function to get cache key for overview
  const getOverviewCacheKey = (brandId, startDate, endDate) => {
    return `overview_data_${brandId}_${startDate}_${endDate}`;
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

  // Clear overview data when brand changes
  React.useEffect(() => {
    console.log('Brand changed to:', activeBrandId);
    setOverview(null);
    setLoading(true);
  }, [activeBrandId]);

  // Load saved currency preference on mount
  React.useEffect(() => {
    const cached = localStorage.getItem('selectedCurrency');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Date.now() < parsed.expiry) {
          setSelectedCurrency(parsed.currency);
        }
      } catch (e) {
        console.error('Error parsing cached currency:', e);
      }
    }
  }, []);

  const handleCurrencyChange = (event) => {
    const newCurrency = event.target.value;
    setSelectedCurrency(newCurrency);
    const expiry = Date.now() + 365 * 24 * 60 * 60 * 1000; // 1 year
    localStorage.setItem('selectedCurrency', JSON.stringify({ currency: newCurrency, expiry }));
  };

  const updateDates = React.useCallback(() => {
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    
    // Calculate and display comparison period
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const prevStart = new Date(start.getTime() - diffDays * 24 * 60 * 60 * 1000);
    setComparisonPeriod(`${prevStart.toISOString().split('T')[0]} → ${start.toISOString().split('T')[0]}`);
  }, [tempStartDate, tempEndDate]);

  const fetchOverview = async () => {
    try {
      if (!activeBrandId) {
        console.error('No active brand selected');
        setLoading(false);
        setOverview(null);
        return;
      }

      const cacheKey = getCacheKey('overview', activeBrandId, startDate, endDate);
      const cachedData = getCachedData(cacheKey);

      if (cachedData) {
        console.log('Using cached overview data:', cachedData);
        setOverview(cachedData);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const headers = await getAuthHeaders();
      if (!headers) {
        throw new Error('Not authenticated');
      }

      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/overview?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`, {
        headers
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch overview data');
      }

      const data = await res.json();
      console.log('Received overview data:', data);

      setCachedData(cacheKey, data);
      setOverview(data);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
      setOverview(null);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeBrandId) {
      fetchOverview();
    }
  }, [startDate, endDate, activeBrandId]);

  const formatTrend = (trend) => {
    console.log('Formatting trend:', trend);
    if (trend == null || isNaN(trend)) return '0%';
    const value = Math.abs(trend).toFixed(1);
    return trend > 0 ? `▲ ${value}%` : trend < 0 ? `▼ ${value}%` : '0%';
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
    }).format(value);
  };

  const data = overview ? [
    {
      title: 'Visitors',
      value: `${overview.users?.value || 0}`,
      interval: `${startDate} → ${endDate}`,
      comparison: comparisonPeriod,
      trend: overview.users?.trend >= 0 ? 'up' : 'down',
      trendLabel: formatTrend(overview.users?.trend),
      data: []
    },
    {
      title: 'Checkout Started',
      value: `${overview.checkouts?.value || 0}`,
      interval: `${startDate} → ${endDate}`,
      trend: overview.checkouts?.trend >= 0 ? 'up' : 'down',
      trendLabel: formatTrend(overview.checkouts?.trend),
      data: []
    },
    {
      title: 'Purchases',
      value: `${overview.conversions?.value || 0}`,
      interval: `${startDate} → ${endDate}`,
      trend: overview.conversions?.trend >= 0 ? 'up' : 'down',
      trendLabel: formatTrend(overview.conversions?.trend),
      data: []
    },
    {
      title: 'Revenue',
      value: formatCurrency(overview.revenue?.value || 0),
      interval: `${startDate} → ${endDate}`,
      trend: overview.revenue?.trend >= 0 ? 'up' : 'down',
      trendLabel: formatTrend(overview.revenue?.trend),
      data: []
    }
  ] : [];

  console.log('Raw overview data:', overview);
  console.log('Processed card data:', data.map(card => ({
    title: card.title,
    trend: card.trend,
    trendLabel: card.trendLabel,
    rawTrend: overview[card.title.toLowerCase().replace(' ', '')]?.trend
  })));

  if (gaLoading) {
    return (
      <Box sx={{ width: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!hasGoogleAnalytics) {
    return (
      <Box sx={{ width: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Google Analytics Required
        </Typography>
        <Typography sx={{ mb: 3, maxWidth: 400, textAlign: 'center' }}>
          To access the dashboard features, you need to connect your Google Analytics account.<br/>
          This will allow us to provide you with valuable insights and analytics about your store's performance.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/settings')}>
          Connect Google Analytics
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mx: 'auto' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>Overview</Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            value={tempStartDate}
            onChange={(e) => setTempStartDate(e.target.value)}
            onBlur={updateDates}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="End Date"
            type="date"
            fullWidth
            value={tempEndDate}
            onChange={(e) => setTempEndDate(e.target.value)}
            onBlur={updateDates}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={1}>
          <Select
            value={selectedCurrency}
            onChange={handleCurrencyChange}
            fullWidth
            displayEmpty
            size="medium"
          >
            {currencyOptions.map((option) => (
              <MenuItem key={option.code} value={option.code}>
                {option.symbol} ({option.code})
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary">
            Comparing to previous period: {comparisonPeriod}
          </Typography>
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {data.map((card, index) => (
            <Grid item key={index} xs={12} sm={6} md={3}>
              <StatCard {...card} />
            </Grid>
          ))}
          <Grid item xs={12}>
            <RevenueTrendChart 
              startDate={startDate} 
              endDate={endDate} 
              selectedCurrency={selectedCurrency} 
            />
          </Grid>

          <Grid item xs={12} md={6}><SessionsChart startDate={startDate} endDate={endDate} /></Grid>
          <Grid item xs={12} md={6}><PageViewsBarChart startDate={startDate} endDate={endDate} /></Grid>

          {/* Row 4: Commerce & Conversion */}
          <Grid item xs={12} md={4}>
            <AverageOrderValue 
              aov={overview && overview.conversions && overview.revenue ? (parseInt(overview.conversions.value || 0, 10) > 0 ? parseFloat(overview.revenue.value || 0) / parseInt(overview.conversions.value || 0, 10) : 0) : 0}
              totalOrders={overview?.conversions?.value || 0}
              totalRevenue={overview?.revenue?.value || 0}
              startDate={startDate} 
              endDate={endDate} 
              selectedCurrency={selectedCurrency} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <ConversionRate 
              conversionRate={overview && overview.conversions && overview.users ? (parseInt(overview.users.value || 0, 10) > 0 ? (parseInt(overview.conversions.value || 0, 10) / parseInt(overview.users.value || 0, 10)) * 100 : 0) : 0}
              conversions={overview?.conversions?.value || 0}
              visitors={overview?.users?.value || 0}
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <BounceRateCard 
              bounceRate={overview && overview.bounceRate ? parseFloat(overview.bounceRate.value || 0) : 0}
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>

          {/* Row 5: Audience & Geography */}
          <Grid item xs={12} md={6}>
            <TopLocationsTable 
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <DeviceBreakdownTable 
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>

          {/* Row 6: Acquisition & Channels */}
          <Grid item xs={12} md={6}>
            <TrafficChannelsChart 
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TopSellingProducts 
              startDate={startDate} 
              endDate={endDate} 
              selectedCurrency={selectedCurrency} 
            />
          </Grid>

          {/* Row 7: Google Ads */}
          <Grid item xs={12} md={6}>
            <GoogleAdsKeywordsTable 
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <GoogleAdsSearchQueriesTable 
              startDate={startDate} 
              endDate={endDate} 
            />
          </Grid>
        </Grid>
      )}

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
