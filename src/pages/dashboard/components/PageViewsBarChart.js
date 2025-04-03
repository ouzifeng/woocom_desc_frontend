import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { BarChart } from '@mui/x-charts/BarChart';
import { auth } from '../../../firebase';

export default function PageViewsBarChart({ startDate, endDate }) {
  const theme = useTheme();
  const [labels, setLabels] = React.useState([]);
  const [views, setViews] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = await getAuthHeader();
        const res = await fetch(`${process.env.NODE_ENV === 'production' 
          ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com' 
          : 'http://localhost:5000'}/analytics/dashboard/trends?startDate=${startDate}&endDate=${endDate}`, { headers });

        const data = await res.json();
        const trends = data.trends || [];

        setLabels(trends.map(t => t.date));
        setViews(trends.map(t => parseInt(t.pageViews || 0, 10)));
      } catch (err) {
        console.error('Error loading page views:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  const colorPalette = [
    theme.palette.primary.dark,
    theme.palette.primary.main,
    theme.palette.primary.light,
  ];

  const totalViews = views.reduce((sum, val) => sum + val, 0);

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
            <Chip size="small" color="primary" label={`${startDate} → ${endDate}`} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Page views during selected range
          </Typography>
        </Stack>

        <BarChart
          colors={colorPalette}
          xAxis={[{ scaleType: 'band', data: labels }]}
          series={[
            {
              id: 'page-views',
              label: 'Page Views',
              data: views,
            }
          ]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
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
