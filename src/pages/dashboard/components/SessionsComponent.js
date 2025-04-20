import * as React from 'react';
import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { auth } from '../../../firebase';
import { useBrand } from '../../../contexts/BrandContext';

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

export default function SessionsChart({ startDate, endDate }) {
  const theme = useTheme();
  const { activeBrandId } = useBrand();
  const [sessionsData, setSessionsData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://woocomdescbackend-451f66b3eb02.herokuapp.com'
    : 'http://localhost:5000';

  const getAuthHeader = async () => {
    const user = auth.currentUser;
    if (!user) return null;
    const token = await user.getIdToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const fetchSessionsData = async () => {
    if (!activeBrandId) {
      setError('Please select a brand first');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/analytics/dashboard/trends?startDate=${startDate}&endDate=${endDate}&brandId=${activeBrandId}`, { headers });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch session data');

      const sessions = data.trends || [];
      setSessionsData(sessions);
    } catch (err) {
      setError(err.message);
      setSessionsData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeBrandId) {
      fetchSessionsData();
    }
  }, [startDate, endDate, activeBrandId]);

  const data = sessionsData.map(row => formatDate(row.date));
  const activeUsersData = sessionsData.map(row => parseInt(row.users, 10));
  const totalSessions = activeUsersData.reduce((acc, val) => acc + val, 0);

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
              {totalSessions}
            </Typography>
            <Chip size="small" color="primary" label={formatDateRange(startDate, endDate)} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Active users during selected range
          </Typography>
        </Stack>

        <LineChart
          colors={colorPalette}
          xAxis={[{ 
            scaleType: 'point', 
            data,
            tickLabelStyle: {
              angle: 45,
              textAnchor: 'start',
              fontSize: 12
            }
          }]}
          series={[{
            id: 'sessions',
            label: 'Sessions',
            data: activeUsersData,
            curve: 'linear',
          }]}
          height={250}
          margin={{ left: 50, right: 20, top: 20, bottom: 50 }}
          grid={{ horizontal: true }}
          slotProps={{ legend: { hidden: true } }}
        >
          <AreaGradient color={theme.palette.primary.main} id="sessions" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
