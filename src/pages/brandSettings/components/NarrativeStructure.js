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

export default function NarrativeStructure() {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Narrative & Structure
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
              <TableCell>Story Flow Framework</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter story flow framework" fullWidth />
              </TableCell>
              <TableCell>Structured persuasive communication.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Narrative Tone</TableCell>
              <TableCell>
                <TextField variant="outlined" placeholder="Enter narrative tone" fullWidth />
              </TableCell>
              <TableCell>Story alignment with brand personality.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
