import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export default function Localization() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Localization
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Input</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Measurement Units</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter measurement units" fullWidth />
              </TableCell>
              <TableCell>Market-specific clarity.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Localized Terms/Expressions</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter localized terms/expressions" fullWidth />
              </TableCell>
              <TableCell>Cultural resonance.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
