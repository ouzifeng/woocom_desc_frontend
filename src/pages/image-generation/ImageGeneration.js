import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, doc, setDoc, orderBy, where } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../firebase';
import { useBrand } from '../../contexts/BrandContext';

const ImageGeneration = () => {
  const [user] = useAuthState(auth);
  const { activeBrandId } = useBrand();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user || !activeBrandId) {
        setImages([]);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        console.log(`Fetching images for brand: ${activeBrandId}`);
        
        // CRITICAL: ALWAYS use this path pattern to guarantee brand isolation
        const imagesQuery = query(
          collection(db, 'users', user.uid, 'brands', activeBrandId, 'images'),
          orderBy('created', 'desc'),
          // Ensure we only get images with this brandId for extra safety
          where('brandId', '==', activeBrandId)
        );
        
        const imagesSnapshot = await getDocs(imagesQuery);
        const fetchedImages = [];
        
        imagesSnapshot.forEach((doc) => {
          fetchedImages.push({
            id: doc.id,
            brandId: activeBrandId, // Always ensure brandId is set
            ...doc.data()
          });
        });
        
        console.log(`Found ${fetchedImages.length} images for brand ${activeBrandId}`);
        setImages(fetchedImages);
      } catch (err) {
        console.error('Error fetching images:', err);
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImages();
    
    // CRITICAL: Listen for brand changes and reload data
    const handleBrandChanged = (event) => {
      console.log(`Brand changed to: ${event.detail.brandId}, clearing and reloading images`);
      setImages([]); // Clear data from previous brand
      fetchImages(); // Fetch fresh data for new brand
    };
    
    window.addEventListener('brandChanged', handleBrandChanged);
    
    return () => {
      window.removeEventListener('brandChanged', handleBrandChanged);
    };
  }, [user, activeBrandId]);

  const saveImage = async (imageData) => {
    if (!user || !activeBrandId) {
      setError('Cannot save image: No active brand selected');
      return null;
    }
    
    try {
      // CRITICAL: ALWAYS use this path pattern to guarantee brand isolation
      const imageRef = doc(collection(db, 'users', user.uid, 'brands', activeBrandId, 'images'));
      
      // CRITICAL: ALWAYS include brandId in the data
      const newImage = {
        ...imageData,
        brandId: activeBrandId, // Enforce brand isolation
        created: new Date()
      };
      
      await setDoc(imageRef, newImage);
      
      // Update local state
      const imageWithId = {
        id: imageRef.id,
        ...newImage
      };
      
      setImages(prev => [imageWithId, ...prev]);
      
      console.log(`Image saved successfully for brand: ${activeBrandId}`);
      return imageRef.id;
    } catch (err) {
      console.error('Error saving image:', err);
      setError('Failed to save image');
      return null;
    }
  };

  // Example API call to generate an image
  const generateImage = async (prompt) => {
    if (!user || !activeBrandId) {
      setError('Cannot generate image: No active brand selected');
      return null;
    }
    
    try {
      const token = await user.getIdToken();
      
      // CRITICAL: ALWAYS include brandId in API requests
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Brand-Id': activeBrandId // Include brand ID in all API calls
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error(`Image generation failed: ${response.status}`);
      }
      
      const imageData = await response.json();
      
      // Save the generated image to this brand's collection
      const imageId = await saveImage({
        ...imageData,
        prompt,
        brandId: activeBrandId // Ensure brandId is set
      });
      
      return imageId;
    } catch (err) {
      console.error('Error generating image:', err);
      setError('Failed to generate image');
      return null;
    }
  };

  return (
    <div>
      {loading && <div>Loading images...</div>}
      {error && <div className="error">{error}</div>}
      
      {/* Image gallery */}
      <div className="image-gallery">
        {images.map(image => (
          <div key={image.id} className="image-item">
            <img 
              src={image.url} 
              alt={image.prompt || 'Generated image'} 
            />
            <p>{image.prompt}</p>
          </div>
        ))}
        
        {images.length === 0 && !loading && (
          <p>No images found for this brand. Generate your first image!</p>
        )}
      </div>
      
      {/* Image generation controls would go here */}
    </div>
  );
};

export default ImageGeneration; 
 