import * as React from 'react';
import { useState } from 'react';
import { Button, Box } from '@mui/material';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function DownloadTranslationsCSVButton({ selectedRows, languageCode, isMainTab, brandId }) {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);

  // Properly escape HTML content for CSV
  const escapeForCSV = (content) => {
    if (!content) return '';
    
    // Double quotes need to be escaped with double quotes for CSV
    return content.replace(/"/g, '""');
  };

  const handleDownload = async () => {
    if (!user || isMainTab) return;
    setLoading(true);

    try {
      // Fetch products
      const productsCollection = collection(db, 'users', user.uid, 'brands', brandId, 'products');
      const productsSnapshot = await getDocs(productsCollection);
      const products = productsSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      // Filter selected products
      const filteredProducts = selectedRows.length > 0
        ? products.filter((product) => selectedRows.includes(product.id))
        : products;

      // Create CSV content manually - this is critical for preserving HTML
      let csvContent = '\uFEFF'; // UTF-8 BOM for proper encoding
      
      // Add headers - REMOVED original columns
      csvContent += '"Product ID","' + 
                  `${languageCode.toUpperCase()} Name","${languageCode.toUpperCase()} Description"\r\n`;
      
      // Add each row with proper escaping - REMOVED original columns
      filteredProducts.forEach(product => {
        const productId = product.id;
        const translatedName = escapeForCSV(product[`${languageCode}_name`] || '');
        const translatedDesc = escapeForCSV(product[`${languageCode}_description`] || '');
        
        csvContent += `"${productId}","${translatedName}","${translatedDesc}"\r\n`;
      });
      
      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // Create and trigger download link
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `products_${languageCode}_html.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error preparing CSV file:', err);
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
        {loading ? 'Preparing...' : `Download ${languageCode.toUpperCase()} HTML`}
      </Button>
    </Box>
  );
} 