import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import ProductDetails from './components/ProductDetails';
import ProductEditor from './components/ProductEditor';
import ImproveGrammarButton from './components/ImproveGrammarButton';
import InstructionsDrawer from './components/InstructionsDrawer';
import AiSettings from './components/AiSettings';

const API_URL = process.env.REACT_APP_API_URL;

export default function ProductPage() {
  const { productId } = useParams();
  const [user] = useAuthState(auth);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [apiId, setApiId] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [useBrandGuidelines, setUseBrandGuidelines] = useState(false);
  const [useProductImage, setUseProductImage] = useState(false);
  const [updateProductName, setUpdateProductName] = useState(false);
  const [seoTerms, setSeoTerms] = useState([]);
  const [useWordCount, setUseWordCount] = useState(false);
  const [wordCount, setWordCount] = useState('');
  const [useEmojis, setUseEmojis] = useState(false);
  const [addSpecifications, setAddSpecifications] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNameLoading, setAiNameLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (user && productId) {
        try {
          const productDocRef = doc(db, 'users', user.uid, 'products', productId);
          const productDoc = await getDoc(productDocRef);
          if (productDoc.exists()) {
            const productData = productDoc.data();
            setProduct(productData);
            setDescription(productData.description || '');
          } else {
            setError('Product not found');
          }

          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setStoreUrl(userData.wc_url || '');
            setApiId(userData.wc_key || '');
            setSecretKey(userData.wc_secret || '');
          }
        } catch (err) {
          console.error('Error fetching product:', err);
          setError('Error fetching product');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProduct();
  }, [user, productId]);

  const handleSave = async () => {
    if (user && productId) {
      try {
        const productDocRef = doc(db, 'users', user.uid, 'products', productId);
        await setDoc(productDocRef, { description, name: product.name }, { merge: true });

        const response = await fetch(`${storeUrl}/wp-json/wc/v3/products/${productId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${btoa(`${apiId}:${secretKey}`)}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description, name: product.name }),
        });

        if (response.status === 200) {
          setModalOpen(true);
        } else {
          alert('Failed to update product description on WooCommerce');
        }
      } catch (err) {
        console.error('Error saving product description:', err);
        alert('Failed to update product description');
      }
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleAiDescription = async () => {
    if (user && productId) {
      setAiLoading(true);
      try {
        const brandDocRef = doc(db, 'users', user.uid, 'BrandIdentity', 'settings');
        const brandDoc = await getDoc(brandDocRef);
        const brandData = brandDoc.exists() ? brandDoc.data() : {};

        const marketDocRef = doc(db, 'users', user.uid, 'MarketAudience', 'settings');
        const marketDoc = await getDoc(marketDocRef);
        const marketData = marketDoc.exists() ? marketDoc.data() : {};

        const positioningDocRef = doc(db, 'users', user.uid, 'ProductPositioning', 'settings');
        const positioningDoc = await getDoc(positioningDocRef);
        const positioningData = positioningDoc.exists() ? positioningDoc.data() : {};

        const referencesDocRef = doc(db, 'users', user.uid, 'ReferencesExamples', 'settings');
        const referencesDoc = await getDoc(referencesDocRef);
        const referencesData = referencesDoc.exists() ? referencesDoc.data() : {};

        let messageContent = `You are an expert in product branding and product descriptions. Use the existing information in the description to build a compelling, brand-led product description. Make sure the response is in properly formatted HTML and without any additional html formatting around the response.`;

        if (useBrandGuidelines) {
          messageContent += ` Use the content from ${JSON.stringify({
            ...brandData,
            ...marketData,
            ...positioningData,
            ...referencesData,
          })}.`;
        }
        if (useProductImage && product?.image) {
          messageContent += ` Analyze the product's image URL (${product.image}) to understand the product better.`;
        }
        if (updateProductName) {
          messageContent += ` Update the product name.`;
        }
        if (seoTerms.length > 0) {
          messageContent += ` Focus the description to include these SEO keywords: ${seoTerms.join(', ')}.`;
        }
        if (useWordCount && wordCount) {
          messageContent += ` Ensure the description is no less than the word count range of ${wordCount}.`;
        }
        if (useEmojis) {
          messageContent += ` Use emojis where appropriate.`;
        }
        if (addSpecifications) {
          messageContent += ` Add a specifications section to the product description.`;
        }

        messageContent += ` Product name: ${product?.name || ''}. Product description: ${description}.`;

        console.log('AI Request Message Content:', messageContent);

        const response = await fetch(`${API_URL}/generate-ai-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageContent, description }),
        });

        const data = await response.json();
        if (data.result === 'Success') {
          setDescription(data.aiDescription);
          setModalOpen(true);
        } else {
          alert('Failed to generate AI description');
        }
      } catch (err) {
        console.error('Error generating AI description:', err);
        alert('Failed to generate AI description');
      } finally {
        setAiLoading(false);
      }
    }
  };

  const handleAiName = async () => {
    if (user && productId) {
      setAiNameLoading(true);
      try {
        let messageContent = `You are an expert in product branding and product names. Use the existing product name and description to generate a compelling, brand-led product name. You must only reply with the product name, do not add any "" or other marking around the name.`;

        messageContent += ` Product name: ${product?.name || ''}. Product description: ${description}.`;

        console.log('AI Request Message Content:', messageContent);

        const response = await fetch(`${API_URL}/generate-ai-name`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageContent }),
        });

        const data = await response.json();
        if (data.result === 'Success') {
          const updatedProduct = { ...product, name: data.aiName };
          setProduct(updatedProduct);
          setModalOpen(true);
        } else {
          alert('Failed to generate AI name');
        }
      } catch (err) {
        console.error('Error generating AI name:', err);
        alert('Failed to generate AI name');
      } finally {
        setAiNameLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={10}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={handleAiDescription} disabled={aiLoading}>
                {aiLoading ? (
                  <>
                    Generating <CircularProgress size={24} sx={{ ml: 1 }} />
                  </>
                ) : (
                  'AI Description'
                )}
              </Button>
              <Button variant="contained" color="secondary" onClick={handleAiName} disabled={aiNameLoading}>
                {aiNameLoading ? (
                  <>
                    Generating <CircularProgress size={24} sx={{ ml: 1 }} />
                  </>
                ) : (
                  'AI Name'
                )}
              </Button>
              <ImproveGrammarButton description={description} setDescription={setDescription} setModalOpen={setModalOpen} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSave}>
                Save
              </Button>
              <Button variant="outlined" onClick={toggleDrawer(true)}>
                Instructions
              </Button>
            </Box>
          </Box>
          <ProductDetails product={product} setProduct={setProduct} />
          <ProductEditor description={description} setDescription={setDescription} />
        </Grid>
        <Grid item xs={12} md={2}>
          <AiSettings
            useBrandGuidelines={useBrandGuidelines}
            setUseBrandGuidelines={setUseBrandGuidelines}
            useProductImage={useProductImage}
            setUseProductImage={setUseProductImage}
            updateProductName={updateProductName}
            setUpdateProductName={setUpdateProductName}
            seoTerms={seoTerms}
            setSeoTerms={setSeoTerms}
            useWordCount={useWordCount}
            setUseWordCount={setUseWordCount}
            wordCount={wordCount}
            setWordCount={setWordCount}
            useEmojis={useEmojis}
            setUseEmojis={setUseEmojis}
            addSpecifications={addSpecifications}
            setAddSpecifications={setAddSpecifications}
          />
        </Grid>
      </Grid>
      <Modal
        open={modalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <Alert onClose={handleCloseModal} severity="success">
            Product updated successfully!
          </Alert>
        </Box>
      </Modal>
      <InstructionsDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
    </Box>
  );
}
