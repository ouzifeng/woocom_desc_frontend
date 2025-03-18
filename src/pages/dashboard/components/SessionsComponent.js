import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const auth = getAuth();
const db = getFirestore();

const fetchGoogleAnalyticsSessions = async (selectedProperty, startDate, endDate, setSessions) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('No authenticated user');
    return;
  }

  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    console.error('No user document found');
    return;
  }

  const { googleAnalytics } = userDoc.data();
  if (!googleAnalytics || !googleAnalytics.accessToken) {
    console.error('No Google Analytics access token found');
    return;
  }

  const accessToken = googleAnalytics.accessToken;

  try {
    const reportUrl = `https://analyticsdata.googleapis.com/v1beta/${selectedProperty}:runReport`;

    const reportRequestBody = {
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: 'sessions' }],
    };

    const response = await fetch(reportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(reportRequestBody),
    });

    if (!response.ok) {
      throw new Error(`Error fetching GA4 report: ${response.statusText}`);
    }

    const reportData = await response.json();
    const sessions = reportData.rows?.[0]?.metricValues?.[0]?.value || '0';
    setSessions(sessions);
  } catch (error) {
    console.error('Error fetching Google Analytics data:', error);
  }
};

export default function SessionsComponent() {
  const [selectedProperty, setSelectedProperty] = React.useState('');
  const [startDate, setStartDate] = React.useState(dayjs().subtract(7, 'day'));
  const [endDate, setEndDate] = React.useState(dayjs());
  const [sessions, setSessions] = React.useState('');

  React.useEffect(() => {
    if (selectedProperty) {
      fetchGoogleAnalyticsSessions(selectedProperty, startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD'), setSessions);
    }
  }, [selectedProperty, startDate, endDate]);

  return (
    <Box sx={{ width: '100%', maxWidth: { sm: '100%', md: '1700px' }, p: 2 }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Google Analytics Sessions
      </Typography>
      <DatePicker
        label="Start Date"
        value={startDate}
        onChange={(newValue) => setStartDate(newValue)}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
      <DatePicker
        label="End Date"
        value={endDate}
        onChange={(newValue) => setEndDate(newValue)}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Sessions: {sessions}
      </Typography>
    </Box>
  );
}
