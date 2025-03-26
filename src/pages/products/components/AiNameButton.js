import * as React from 'react';
import { Button } from '@mui/material';

export default function AiNameButton({ handleAiName, aiNameLoading }) {
  return (
    <Button variant="outlined" onClick={handleAiName} disabled={aiNameLoading}>
      AI Name
    </Button>
  );
} 