import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography,
  Stack, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { API_BASE_URL, getAuthHeaders } from './MainGrid';
import { useBrand } from '../../../contexts/BrandContext';

export default function TrafficChannelsChart({ startDate, endDate }) {
  const { activeBrandId } = useBrand();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({ startDate, endDate, brandId: activeBrandId });
        const res = await fetch(`${API_BASE_URL}/analytics/dashboard/traffic-channels?${params}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch traffic channels');
        const json = await res.json();
        const sorted = (json.channels || []).sort((a, b) => b.sessions - a.sessions);
        setData(sorted);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (activeBrandId) fetchData();
  }, [startDate, endDate, activeBrandId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  const totalSessions = data.reduce((sum, ch) => sum + ch.sessions, 0);

  const formatPercent = (value) => {
    return totalSessions ? `${((value / totalSessions) * 100).toFixed(1)}%` : '0%';
  };

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Traffic Channels
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Chip
            size="small"
            color="primary"
            label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
          />
        </Stack>

        {data.length === 0 ? (
          <Typography>No channel data available for the selected period</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Source</TableCell>
                  <TableCell align="right">Sessions</TableCell>
                  <TableCell align="right">Share</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, i) => (
                  <TableRow key={`${row.channel}-${i}`}>
                    <TableCell>{row.channel}</TableCell>
                    <TableCell align="right">{row.sessions.toLocaleString()}</TableCell>
                    <TableCell align="right">{formatPercent(row.sessions)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}

 