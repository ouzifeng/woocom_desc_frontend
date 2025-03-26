import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import AiDescriptionButton from './components/AiDescriptionButton';
import AiNameButton from './components/AiNameButton';
import ImproveGrammarButton from './components/ImproveGrammarButton';
import InstructionsDrawer from './components/InstructionsDrawer';
import AiSettings from './components/AiSettings';
import SaveProductButton from './components/SaveProductButton';

// Lazy load components
const ProductDetails = React.lazy(() => import('./components/ProductDetails'));
const ProductEditor = React.lazy(() => import('./components/ProductEditor'));

// Loading component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

const API_URL = process.env.REACT_APP_API_URL;

/** A helper that decodes HTML entities */
function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [useBrandGuidelines, setUseBrandGuidelines] = useState(false);
  const [useProductImage, setUseProductImage] = useState(false);
  const [updateProductName, setUpdateProductName] = useState(false);
  const [seoTerms, setSeoTerms] = useState([]);
  const [useWordCount, setUseWordCount] = useState(false);
  const [wordCount, setWordCount] = useState('');
  const [useEmojis, setUseEmojis] = useState(false);
  const [addSpecifications, setAddSpecifications] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [loadingDots, setLoadingDots] = useState('');
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

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleAiDescription = async () => {
    if (user && productId) {
      setAiLoading(true);
      setNotificationMessage('Improving product description');
      setLoadingDots('');

      const interval = setInterval(() => {
        setLoadingDots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);

      try {
        // First check if user has enough credits
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists() || userDoc.data().credits < 1) {
          alert('You need at least 1 credit to generate an AI description');
          setAiLoading(false);
          return;
        }

        // Deduct one credit
        await updateDoc(userDocRef, {
          credits: userDoc.data().credits - 1
        });

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

        messageContent += ` Product name: ${decodeHtmlEntities(product?.name || '')}. Product description: ${description}.`;

        console.log('AI Request Message Content:', messageContent);

        const response = await fetch(`${API_URL}/openai/generate-ai-description`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messageContent, description }),
        });

        const data = await response.json();
        if (data.result === 'Success') {
          setDescription(data.aiDescription);
          setNotificationMessage('Product description improved successfully!');
        } else {
          // If the AI generation fails, refund the credit
          await updateDoc(userDocRef, {
            credits: userDoc.data().credits + 1
          });
          setNotificationMessage('Failed to generate AI description');
        }
      } catch (err) {
        console.error('Error generating AI description:', err);
        setNotificationMessage('Failed to generate AI description');
      } finally {
        setAiLoading(false);
        clearInterval(interval);
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

        const response = await fetch(`${API_URL}/openai/generate-ai-name`, {
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
          setNotificationMessage('AI name generated successfully!');
        } else {
          setNotificationMessage('Failed to generate AI name');
        }
      } catch (err) {
        console.error('Error generating AI name:', err);
        setNotificationMessage('Failed to generate AI name');
      } finally {
        setAiNameLoading(false);
      }
    }
  };

  if (loading) {
    return <LoadingFallback />;
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
              <React.Suspense fallback={<CircularProgress size={24} />}>
                <AiDescriptionButton handleAiDescription={handleAiDescription} aiLoading={aiLoading} />
              </React.Suspense>
              <React.Suspense fallback={<CircularProgress size={24} />}>
                <AiNameButton handleAiName={handleAiName} aiNameLoading={aiNameLoading} />
              </React.Suspense>
              <React.Suspense fallback={<CircularProgress size={24} />}>
                <ImproveGrammarButton 
                  description={description} 
                  setDescription={setDescription} 
                  setNotificationMessage={setNotificationMessage}
                />
              </React.Suspense>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <React.Suspense fallback={<CircularProgress size={24} />}>
                <SaveProductButton 
                  user={user}
                  productId={productId}
                  storeUrl={storeUrl}
                  apiId={apiId}
                  secretKey={secretKey}
                  description={description}
                  product={product}
                  setNotificationMessage={setNotificationMessage}
                />
              </React.Suspense>
              <Button variant="outlined" onClick={toggleDrawer(true)}>
                Instructions
              </Button>
            </Box>
          </Box>
          {notificationMessage && (
            <Typography variant="body2" color="textSecondary" textAlign={'left'}>
              {notificationMessage} {loadingDots}
            </Typography>
          )}
          <React.Suspense fallback={<LoadingFallback />}>
            <ProductDetails product={product} setProduct={setProduct} />
          </React.Suspense>
          <React.Suspense fallback={<LoadingFallback />}>
            <ProductEditor description={description} setDescription={setDescription} />
          </React.Suspense>
        </Grid>
        <Grid item xs={12} md={2}>
          <React.Suspense fallback={<LoadingFallback />}>
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
          </React.Suspense>
        </Grid>
      </Grid>
      <React.Suspense fallback={<LoadingFallback />}>
        <InstructionsDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
      </React.Suspense>
    </Box>
  );
}
