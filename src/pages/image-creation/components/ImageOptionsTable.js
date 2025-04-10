import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Radio } from '@mui/material';

const imageOptions = [
  { id: 1, platform: 'Instagram', format: 'Square', size: '1024 × 1024', bestFor: 'Feed, Carousel, Grid' },
  { id: 2, platform: 'Instagram', format: 'Portrait', size: '1024 × 1792', bestFor: 'Stories, Reels, Ads' },
  { id: 3, platform: 'Facebook', format: 'Square', size: '1024 × 1024', bestFor: 'Feed Ads, Posts' },
  { id: 4, platform: 'Facebook', format: 'Landscape', size: '1792 × 1024', bestFor: 'Feed Banners, Ads, Articles' },
];

export const ImageOptionsTable = ({ selectedRow, onSelectRow }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: '#f5f6fa' }}>
            <TableCell padding="checkbox" />
            <TableCell>Platform</TableCell>
            <TableCell>Format</TableCell>
            <TableCell>Size (px)</TableCell>
            <TableCell>Best For</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {imageOptions.map((row) => (
            <TableRow 
              key={row.id}
              sx={{ 
                '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                '&:nth-of-type(even)': { backgroundColor: '#fafafa' },
                '&:last-child td': { border: 0 }
              }}
            >
              <TableCell padding="checkbox">
                <Radio
                  checked={selectedRow === row.id}
                  onChange={() => onSelectRow(row.id)}
                />
              </TableCell>
              <TableCell>{row.platform}</TableCell>
              <TableCell>{row.format}</TableCell>
              <TableCell>{row.size}</TableCell>
              <TableCell>{row.bestFor}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}; 
 