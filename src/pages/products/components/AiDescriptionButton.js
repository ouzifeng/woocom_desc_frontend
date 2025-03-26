import * as React from 'react';
import { Button } from '@mui/material';

export default function AiDescriptionButton({ handleAiDescription, aiLoading }) {
  return (
    <Button variant="contained" color="primary" onClick={handleAiDescription} disabled={aiLoading}>
      AI Description
    </Button>
  );
} 