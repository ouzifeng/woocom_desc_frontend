import { Card, CardContent, Typography, Stack, Chip } from '@mui/material';

export default function ConversionRate({ conversionRate, conversions, visitors, startDate, endDate }) {
  const formatPercentage = (value) => new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((value || 0) / 100);

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Conversion Rate
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
            <Typography variant="h4" component="p">
              {formatPercentage(conversionRate)}
            </Typography>
            <Chip
              size="small"
              color="primary"
              label={`${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {conversions} orders from {visitors} visitors
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
} 