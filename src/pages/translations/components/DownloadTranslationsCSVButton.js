import * as React from 'react';
import { useState, useRef } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { CSVLink } from 'react-csv';

export default function DownloadTranslationsCSVButton({ selectedRows, languageCode, isMainTab }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const csvLinkRef = useRef();

  // Escape HTML for safe CSV export - same as original
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
    if (!user || isMainTab) return;
    setLoading(true);

    try {
      const productsCollection = collection(db, 'users', user.uid, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const products = productsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      const filteredProducts = selectedRows.length > 0
        ? products.filter((product) => selectedRows.includes(product.id))
        : products;

      // Format data with translated fields
      const formattedData = filteredProducts.map((product) => ({
        product_id: product.id,
        name: `"${((product[`${languageCode}_name`] || '').replace(/"/g, '""'))}"`,
        description: `"${cleanHTML(product[`${languageCode}_description`] || '')}"`,
      }));

      setCsvData(formattedData);
      setTimeout(() => {
        csvLinkRef.current.link.click();
      }, 0);
    } catch (err) {
      console.error('Error preparing CSV:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't show button on main tab
  if (isMainTab) return null;

  return (
    <Box>
      <Button
        size="small"
        variant="outlined"
        color="primary"
        onClick={handleDownload}
        disabled={loading}
      >
        {loading ? 'Preparing...' : `Download ${languageCode.toUpperCase()} CSV`}
      </Button>
      <CSVLink
        data={csvData}
        filename={`products_${languageCode}.csv`}
        enclosingCharacter={''}
        ref={csvLinkRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
} 