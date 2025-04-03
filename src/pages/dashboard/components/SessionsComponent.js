import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { auth } from '../../../firebase'; // assuming Firebase auth for token management

function AreaGradient({ color, id }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

AreaGradient.propTypes = {
  color: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
};

export default function SessionsChart() {
  const theme = useTheme();
  const [sessionsData, setSessionsData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // Dynamically set the API base URL based on environment
  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
    : 'http://localhost:5000';

  // Fetch sessions data
  const fetchSessionsData = async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard/trends`, { headers });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch session data');

      // Transform the data into a format that works for the chart
      const sessions = data.trends || [];
      setSessionsData(sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSessionsData();
  }, []);

  const data = sessionsData.map(row => row.date); // Get the date labels
  const activeUsersData = sessionsData.map(row => parseInt(row.users, 10)); // Get the session counts (active users)

  const colorPalette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
  ];

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Sessions
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="p">
              {activeUsersData.reduce((acc, val) => acc + val, 0)} {/* Total Sessions */}
            </Typography>
            <Chip size="small" color="success" label="+35%" />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Active users for the last 30 days
          </Typography>
        </Stack>

        <LineChart
          colors={colorPalette}
          xAxis={[{ scaleType: 'point', data, tickInterval: 5 }]}
          series={[
            {
              id: 'sessions',
              label: 'Sessions',
              data: activeUsersData,
              curve: 'linear',
            },
          ]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 20 }}
          grid={{ horizontal: true }}
        >
          <AreaGradient color={theme.palette.primary.main} id="sessions" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
