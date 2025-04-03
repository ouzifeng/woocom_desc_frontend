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

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
  : 'http://localhost:5000'

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
      setLoading(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();

      console.log("NODE_ENV:", process.env.NODE_ENV); // Check if it's 'development'
      console.log("API URL:", API_BASE_URL); // Check if it points to the correct local API


      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/overview?startDate=${startDate}&endDate=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setOverview(data);
    } catch (err) {
      console.error('Failed to fetch overview:', err);
    } finally {
      setLoading(false);
    }
};


  React.useEffect(() => {
    fetchOverview();
  }, [startDate, endDate]);

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

          <Grid item xs={12} md={4}>
            <TopProductsChart 
              startDate={startDate} 
              endDate={endDate} 
              selectedCurrency={selectedCurrency} 
            />
          </Grid>
          <Grid item xs={12} md={4}>{dummyChart('Conversion Funnel')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Traffic Channels')}</Grid>

          <Grid item xs={12} md={4}>{dummyChart('Devices')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Avg Order Value')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Refund Rate')}</Grid>

          <Grid item xs={12} md={6}>{dummyChart('Bounce Rate')}</Grid>
          <Grid item xs={12} md={6}>{dummyChart('Cart Abandonment')}</Grid>

        </Grid>
      )}

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
