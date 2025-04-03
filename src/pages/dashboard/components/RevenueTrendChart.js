import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { auth } from '../../../firebase';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
  : 'http://localhost:5000';

export default function RevenueTrendChart({ startDate, endDate, selectedCurrency }) {
  const theme = useTheme();
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);

  const getTrends = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const res = await fetch(
        `${API_BASE_URL}/analytics/dashboard/trends?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
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
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getTrends();
  }, [startDate, endDate]);

  if (loading) return <Typography>Loading...</Typography>;

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
            <Chip size="small" color="primary" label={`${startDate} → ${endDate}`} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Based on daily purchase revenue
          </Typography>
        </Stack>

        <LineChart
          colors={[theme.palette.primary.main]}
          xAxis={[{
            scaleType: 'point',
            data: data.map(d => d.date),
          }]}
          series={[{
            id: 'revenue',
            label: 'Revenue',
            data: data.map(d => d.value),
            curve: 'linear',
          }]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        />
      </CardContent>
    </Card>
  );
}
