import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import { useNavigate } from 'react-router-dom';

const creditCosts = [
  { service: 'Product Description Generation', credits: 1 },
  { service: 'Product Description Translation', credits: 1 },
  { service: 'Content Strategy Generation', credits: 2 },
  { service: 'Keyword Research', credits: 1 },
  { service: 'Image Generation', credits: 2 },
  { service: 'Brand Strategy Generation', credits: 3 },
];

export default function CreditCostsDrawer({ open, onClose }) {
  const navigate = useNavigate();

  const handlePurchaseCredits = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400, md: 600 } },
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Credit Costs
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 3 }} />
        
        <Typography variant="body1" paragraph>
          Credits are used to access various features in the application. Each service requires a specific number of credits.
        </Typography>
        
        <TableContainer component={Paper} sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service</TableCell>
                <TableCell align="right">Credits</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {creditCosts.map((row) => (
                <TableRow key={row.service}>
                  <TableCell component="th" scope="row">
                    {row.service}
                  </TableCell>
                  <TableCell align="right">{row.credits}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          You can purchase credits in packages starting from $1 for 10 credits.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          fullWidth 
          onClick={handlePurchaseCredits}
          sx={{ mt: 2 }}
        >
          Purchase Credits
        </Button>
      </Box>
    </Drawer>
  );
} 