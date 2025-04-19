import * as React from 'react';
import { useState, useRef } from 'react';
import { Button, Box, Tooltip } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { CSVLink } from 'react-csv';
import { useBrand } from '../../../contexts/BrandContext';

export default function DownloadCSVButton({ selectedRows, setNotificationMessage }) {
  const [user] = useAuthState(auth);
  const { activeBrandId, activeBrand } = useBrand();
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const csvLinkRef = useRef();

  // Escape HTML for safe CSV export
  const cleanHTML = (html) => {
    if (!html) return '';
    return (
      html
        .replace(/"/g, '""')         // Escape internal quotes
        .replace(/\r?\n|\r/g, ' ')   // Replace newlines with space
        .replace(/\s+/g, ' ')        // Collapse multiple spaces
        .trim()
    );
  };

  const handleDownload = async () => {
    if (!user) return;
    if (!activeBrandId) {
      setNotificationMessage('Please select a brand to download products');
      return;
    }
    
    setLoading(true);

    try {
      // Update path to include the brand ID
      const productsCollection = collection(db, 'users', user.uid, 'brands', activeBrandId, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const products = productsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const filteredProducts =
        selectedRows.length > 0
          ? products.filter((product) => selectedRows.includes(product.id))
          : products;

      const formattedData = filteredProducts.map((product) => ({
        product_id: product.id,
        name: `"${(product.name || '').replace(/"/g, '""')}"`,
        description: `"${cleanHTML(product.description)}"`,
        brand_id: activeBrandId,
        brand_name: activeBrand?.name || '',
      }));

      if (formattedData.length === 0) {
        setNotificationMessage('No products to download');
        setLoading(false);
        return;
      }

      setCsvData(formattedData);
      setNotificationMessage(`Preparing CSV for ${formattedData.length} products...`);
      setTimeout(() => {
        csvLinkRef.current.link.click();
        setNotificationMessage(`Downloaded ${formattedData.length} products as CSV`);
      }, 0);
    } catch (err) {
      console.error('Error preparing CSV:', err);
      setNotificationMessage('Error preparing CSV: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Tooltip title={!activeBrandId ? "Select a brand first" : ""}>
        <span>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={handleDownload}
            disabled={loading || !activeBrandId}
          >
            {loading ? 'Preparing...' : 'Download CSV'}
          </Button>
        </span>
      </Tooltip>
      <CSVLink
        data={csvData}
        filename={`products_${activeBrand?.name || 'export'}.csv`}
        enclosingCharacter={''} // CSVLink uses this internally
        ref={csvLinkRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
}
