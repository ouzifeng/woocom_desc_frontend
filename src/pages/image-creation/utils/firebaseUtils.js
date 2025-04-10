import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../../../firebase';

export const fetchPreviousImages = async (userId) => {
  try {
    const storageRef = ref(storage, `generated/${userId}`);
    const result = await listAll(storageRef);
    
    const images = await Promise.all(
      result.items.map(async (item) => {
        const url = await getDownloadURL(item);
        return {
          url,
          description: item.name.split('_')[1] || 'Generated Image'
        };
      })
    );
    
    return images.sort((a, b) => b.url.localeCompare(a.url)); // Sort by URL (which contains timestamp)
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
 
 
 