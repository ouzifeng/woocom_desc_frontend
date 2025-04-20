import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../../../firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db } from '../../../firebase';

export const fetchPreviousImages = async (userId, brandId) => {
  if (!userId || !brandId) {
    console.error('fetchPreviousImages: Missing userId or brandId');
    return [];
  }
  
  try {
    // CRITICAL: Always use the brand-specific path for security isolation
    const imagesCollection = collection(
      db, 
      'users', 
      userId, 
      'brands', 
      brandId, 
      'images'
    );
    
    // Simplified query - remove redundant brandId filter
    const q = query(
      imagesCollection,
      orderBy('created', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const images = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      images.push({
        id: doc.id,
        url: data.url,
        title: data.prompt || data.description || 'Generated Image',
        description: data.description || data.prompt || '',
        created: data.created ? data.created.toDate() : new Date()
      });
    });
    
    console.log(`Fetched ${images.length} images for brand ${brandId}`);
    return images;
  } catch (error) {
    console.error('Error fetching previous images:', error);
    return [];
  }
};

export const uploadImageToFirebase = async (file, userId, imageType) => {
  const timestamp = Date.now();
  const storageRef = ref(storage, `generated/${userId}/${imageType}_${timestamp}.png`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deleteImageFromFirebase = async (imageUrl) => {
  const imageRef = ref(storage, imageUrl);
  await deleteObject(imageRef);
};

export const downloadImage = async (imageUrl) => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return blob;
}; 
 
 
 