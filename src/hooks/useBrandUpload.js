import { useState, useCallback } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useBrand } from '../contexts/BrandContext';

/**
 * Custom hook for brand-isolated file uploads
 * Enforces brand isolation when uploading files to Firebase Storage
 */
const useBrandUpload = () => {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState(null);
  
  const { activeBrandId, getBrandStoragePath } = useBrand();

  /**
   * Upload a file with brand isolation enforced
   * @param {File} file - The file to upload
   * @param {string} fileType - The type of file (e.g., 'images', 'documents')
   * @param {string} customFilename - Optional custom filename (default: original filename)
   * @returns {Promise<string>} Download URL of the uploaded file
   */
  const uploadFile = useCallback(async (file, fileType, customFilename = null) => {
    if (!file) {
      setError('No file provided');
      return null;
    }
    
    if (!activeBrandId) {
      setError('No active brand selected');
      return null;
    }
    
    // Reset state
    setProgress(0);
    setError(null);
    setUploading(true);
    setUrl(null);
    
    try {
      // Generate a unique filename if not provided
      const filename = customFilename || `${Date.now()}-${file.name}`;
      
      // Get brand-isolated storage path
      const path = getBrandStoragePath(fileType, filename);
      if (!path) {
        throw new Error('Failed to generate storage path');
      }
      
      // Create storage reference with brand isolation
      const storageRef = ref(storage, path);
      
      // Add brand metadata to enforce isolation
      const metadata = {
        customMetadata: {
          brandId: activeBrandId
        }
      };
      
      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      
      // Monitor upload progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Track progress
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(progress);
          },
          (error) => {
            // Handle errors
            console.error('Upload error:', error);
            setError(error.message);
            setUploading(false);
            reject(error);
          },
          async () => {
            // Upload completed successfully
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            setUrl(downloadUrl);
            setUploading(false);
            resolve(downloadUrl);
          }
        );
      });
    } catch (err) {
      setError(err.message);
      setUploading(false);
      console.error('File upload error:', err);
      return null;
    }
  }, [activeBrandId, getBrandStoragePath]);
  
  return {
    uploadFile,
    progress,
    error,
    uploading,
    url
  };
};

export default useBrandUpload; 
 