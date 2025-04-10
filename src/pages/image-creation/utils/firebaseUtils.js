import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';

export const fetchPreviousImages = async (user) => {
  if (!user) return [];
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData?.generatedImages) {
        return [...userData.generatedImages].sort((a, b) => b.timestamp - a.timestamp);
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching previous images:', error);
    throw error;
  }
};

export const saveGeneratedImage = async (user, imageUrl, prompt, imageType, description) => {
  if (!user) return null;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const newImage = {
        url: imageUrl,
        prompt,
        imageType,
        description,
        timestamp: Date.now()
      };
      
      await updateDoc(userDocRef, {
        generatedImages: [...(userData.generatedImages || []), newImage]
      });
      
      return newImage;
    }
    return null;
  } catch (error) {
    console.error('Error saving generated image:', error);
    throw error;
  }
};

export const deleteGeneratedImage = async (user, imageUrl) => {
  if (!user) return;
  
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const updatedImages = userData.generatedImages.filter(img => img.url !== imageUrl);
      await updateDoc(userDocRef, {
        generatedImages: updatedImages
      });
    }
  } catch (error) {
    console.error('Error deleting generated image:', error);
    throw error;
  }
}; 