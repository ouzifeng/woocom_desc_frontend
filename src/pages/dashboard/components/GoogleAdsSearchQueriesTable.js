import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography,
  Stack, Chip, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import { useBrand } from '../../../contexts/BrandContext';
import { API_BASE_URL, getAuthHeaders } from './MainGrid';

export default function GoogleAdsSearchQueriesTable({ startDate, endDate }) {
  const { activeBrandId } = useBrand();
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({ startDate, endDate, brandId: activeBrandId });
        const res = await fetch(`${API_BASE_URL}/analytics/dashboard/ads-search-queries?${params}`, { headers });
        if (!res.ok) throw new Error('Failed to fetch search queries');
        const json = await res.json();
        setQueries(json.queries || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (activeBrandId) fetchData();
  }, [startDate, endDate, activeBrandId]);

  const totalSessions = queries.reduce((sum, q) => sum + q.sessions, 0);
  const formatPercent = (value) => totalSessions ? `${((value / totalSessions) * 100).toFixed(1)}%` : '0%';

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Google Ads Search Queries
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Chip size="small" color="primary" label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`} />
        </Stack>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Search Query</TableCell>
                <TableCell align="right">Sessions</TableCell>
                <TableCell align="right">Share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {queries.map((row, i) => (
                <TableRow key={`${row.query}-${i}`}>
                  <TableCell>{row.query || '(not set)'}</TableCell>
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
