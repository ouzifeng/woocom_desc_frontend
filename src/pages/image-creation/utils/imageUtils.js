import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../../firebase';

export const uploadImageToFirebase = async (file, user, isReference = false) => {
  if (!user) return null;
  
  try {
    const timestamp = Date.now();
    const fileName = `${isReference ? 'reference' : 'product'}_${timestamp}_${file.name}`;
    const storageRef = ref(storage, `temp/${user.uid}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      url: downloadURL,
      name: file.name,
      path: `temp/${user.uid}/${fileName}`
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const deleteImageFromFirebase = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const downloadImage = async (imageUrl, timestamp) => {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Failed to download image');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_image_${timestamp}.png`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}; 