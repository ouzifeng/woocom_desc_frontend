import * as React from 'react';
import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export default function TodayDate() {
  const today = dayjs().format('MMM DD, YYYY');

  return (
    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
      <Typography variant="body1" sx={{ ml: 2 }}>
        {today}
      </Typography>
    </Box>
  );
}
