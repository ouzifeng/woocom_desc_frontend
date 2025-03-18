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

export default function VisualFormatting() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Visual & Formatting
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
              <TableCell>Description Length</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter description length" fullWidth />
              </TableCell>
              <TableCell>Fit description length to product type.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Description Format</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter description format" fullWidth />
              </TableCell>
              <TableCell>Readability optimization.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Color Palette</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter color palette" fullWidth />
              </TableCell>
              <TableCell>Visual alignment.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
