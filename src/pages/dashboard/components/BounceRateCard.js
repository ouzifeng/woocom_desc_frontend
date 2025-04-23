import React, { useEffect, useState } from 'react';
import {
  Card, CardContent, Typography, Stack, Chip
} from '@mui/material';
import { useBrand } from '../../../contexts/BrandContext';
import { API_BASE_URL, getAuthHeaders } from './MainGrid';

export default function BounceRateCard({ startDate, endDate }) {
  const { activeBrandId } = useBrand();
  const [bounceRate, setBounceRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBounceRate = async () => {
      setLoading(true);
      setError(null);
      try {
        const headers = await getAuthHeaders();
        const params = new URLSearchParams({
          startDate,
          endDate,
          brandId: activeBrandId
        });

        const res = await fetch(`${API_BASE_URL}/analytics/dashboard/bounce-rate?${params}`, {
          headers,
        });

        if (!res.ok) throw new Error('Failed to fetch bounce rate');
        const json = await res.json();
        setBounceRate(json.bounceRate);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (activeBrandId) {
      fetchBounceRate();
    }
  }, [startDate, endDate, activeBrandId]);

  const formatPercentage = (value) => new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value || 0) / 100);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Bounce Rate
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="p">
              {formatPercentage(bounceRate)}
            </Typography>
            <Chip
              size="small"
              color="primary"
              label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Percentage of users who left without interacting
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
