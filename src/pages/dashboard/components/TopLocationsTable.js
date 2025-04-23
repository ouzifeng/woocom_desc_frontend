import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Stack, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useBrand } from '../../../contexts/BrandContext';
import { API_BASE_URL, getAuthHeaders } from './MainGrid';

export default function TopLocationsTable({ startDate, endDate }) {
  const { activeBrandId } = useBrand();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({ startDate, endDate, brandId: activeBrandId });
        const res = await fetch(`${API_BASE_URL}/analytics/dashboard/locations?${params}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch locations');
        const json = await res.json();
        setLocations(json.locations || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (activeBrandId) fetchData();
  }, [startDate, endDate, activeBrandId]);

  const totalSessions = locations.reduce((sum, l) => sum + l.sessions, 0);
  const formatPercent = (value) => totalSessions ? `${((value / totalSessions) * 100).toFixed(1)}%` : '0%';

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" gutterBottom>Top Locations</Typography>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Chip size="small" color="primary" label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`} />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Country</TableCell>
                <TableCell align="right">Sessions</TableCell>
                <TableCell align="right">Share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((row, i) => (
                <TableRow key={`${row.country}-${i}`}>
                  <TableCell>{row.country}</TableCell>
                  <TableCell align="right">{row.sessions.toLocaleString()}</TableCell>
                  <TableCell align="right">{formatPercent(row.sessions)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
