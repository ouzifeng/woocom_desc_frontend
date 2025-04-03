import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { auth } from '../../../firebase';

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
  : 'http://localhost:5000';

export default function TopProductsChart({ startDate, endDate, selectedCurrency }) {
  const theme = useTheme();
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [total, setTotal] = React.useState(0);

  const getTrends = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE_URL}/analytics/dashboard/top-products?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const json = await res.json();

      if (!json.products || !Array.isArray(json.products)) {
        console.error('Invalid response format:', json);
        setData([]);
        setTotal(0);
        return;
      }

      const chartData = json.products.map(product => ({
        name: product.path.split('/').pop().replace(/-/g, ' '),
        value: parseFloat(product.revenue || 0),
      }));

      const totalRevenue = chartData.reduce((sum, d) => sum + d.value, 0);

      setData(chartData);
      setTotal(totalRevenue);
    } catch (err) {
      console.error('Error loading top products data:', err);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    getTrends();
  }, [startDate, endDate]);

  if (loading) return <Typography>Loading...</Typography>;
  if (data.length === 0) return <Typography>No data available</Typography>;

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
