import * as React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import StatCard from './StatCard';
import Copyright from '../internals/components/Copyright';
import { auth } from '../../../firebase';
import { TextField } from '@mui/material';
import dayjs from 'dayjs';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
  : 'http://localhost:5000'

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

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();
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
    if (trend == null || isNaN(trend)) return '0%';
    const value = Math.abs(trend).toFixed(1);
    return trend > 0 ? `▲ ${value}%` : trend < 0 ? `▼ ${value}%` : '0%';
  };

  const data = overview ? [
    {
      title: 'Visitors',
      value: `${overview.users?.value || 0}`,
      interval: `${startDate} → ${endDate}`,
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
      value: `$${Number(overview.revenue?.value || 0).toFixed(2)}`,
      interval: `${startDate} → ${endDate}`,
      trend: overview.revenue?.trend >= 0 ? 'up' : 'down',
      trendLabel: formatTrend(overview.revenue?.trend),
      data: []
    }
  ] : [];

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, mx: 'auto' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>Overview</Typography>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Start Date"
            type="date"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="End Date"
            type="date"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
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

          <Grid item xs={12} md={6}>{dummyChart('Sessions')}</Grid>
          <Grid item xs={12} md={6}>{dummyChart('Page Views')}</Grid>

          <Grid item xs={12} md={4}>{dummyChart('Top Products')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Conversion Funnel')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Traffic Channels')}</Grid>

          <Grid item xs={12} md={4}>{dummyChart('Devices')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Avg Order Value')}</Grid>
          <Grid item xs={12} md={4}>{dummyChart('Refund Rate')}</Grid>

          <Grid item xs={12} md={6}>{dummyChart('Bounce Rate')}</Grid>
          <Grid item xs={12} md={6}>{dummyChart('Cart Abandonment')}</Grid>

          <Grid item xs={12}>{dummyChart('Revenue Trend')}</Grid>
        </Grid>
      )}

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
