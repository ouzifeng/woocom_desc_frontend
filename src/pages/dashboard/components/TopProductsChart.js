import * as React from 'react';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { useTheme } from '@mui/material/styles';
import { auth } from '../../../firebase';

export default function TopProductsChart() {
  const theme = useTheme();
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        const token = await user.getIdToken();

        const res = await fetch(
          `${process.env.NODE_ENV === 'production'
            ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
            : 'http://localhost:5000'}/analytics/dashboard/top-products`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch');
        setData(json.products);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const colorPalette = [
    theme.palette.primary.main,
    theme.palette.primary.light,
    theme.palette.primary.dark,
  ];

  const xData = data.map(item => item.path);
  const seriesData = data.map(item => parseInt(item.views, 10));

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Top Products
        </Typography>
        <Stack sx={{ justifyContent: 'space-between', mb: 1 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography variant="h4">
              {seriesData.reduce((sum, val) => sum + val, 0)}
            </Typography>
            <Chip size="small" color="primary" label="Last 30 Days" />
          </Stack>
          <Typography variant="caption" color="text.secondary">
            Based on screen page views
          </Typography>
        </Stack>
        <BarChart
          xAxis={[{ scaleType: 'band', data: xData }]}
          series={[{ data: seriesData }]}
          colors={colorPalette}
          height={300}
          margin={{ left: 50, right: 20, top: 20, bottom: 60 }}
          grid={{ horizontal: true }}
        />
      </CardContent>
    </Card>
  );
}
