import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';

export default function AverageOrderValue({ aov, totalOrders, totalRevenue, startDate, endDate, selectedCurrency }) {
  const formatCurrency = (value) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: selectedCurrency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Average Order Value
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="p">
              {formatCurrency(aov)}
            </Typography>
            <Chip
              size="small"
              color="primary"
              label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Based on {totalOrders} orders
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
} 