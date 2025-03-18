import * as React from 'react';
import dayjs from 'dayjs';
import Typography from '@mui/material/Typography';

export default function TodayDate() {
  const today = dayjs().format('MMM DD, YYYY');

  return (
    <Typography variant="body1" sx={{ ml: 2 }}>
      {today}
    </Typography>
  );
}
