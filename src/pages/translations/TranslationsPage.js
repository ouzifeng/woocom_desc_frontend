import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../contexts/UserContext';
import { useBrand } from '../../contexts/BrandContext';
import LanguageProductTable from './components/LanguageProductTable';

const TranslationsPage = () => {
  const [deleteTranslationsFunc, setDeleteTranslationsFunc] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const user = useUser();
  const { activeBrandId } = useBrand();

  // Fetch available languages when the component mounts
  useEffect(() => {
    const fetchLanguages = async () => {
      if (!user || !activeBrandId) return;
      
      try {
        const languageSettingsRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'settings', 'languages');
        const currentSettings = await getDoc(languageSettingsRef);
        const currentLanguages = currentSettings.data()?.languages || [];
        setLanguages(currentLanguages);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };
    
    fetchLanguages();
  }, [user, activeBrandId]);

  const handleDeleteLanguage = async (languageToDelete) => {
    if (!user || !activeBrandId) return;
    
    try {
      // First delete the language from settings
      const languageSettingsRef = doc(db, 'users', user.uid, 'brands', activeBrandId, 'settings', 'languages');
      const currentSettings = await getDoc(languageSettingsRef);
      const currentLanguages = currentSettings.data()?.languages || [];
      
      // Delete translations if we have the function
      if (deleteTranslationsFunc) {
        await deleteTranslationsFunc(languageToDelete);
      }

      // Then remove the language from settings
      await updateDoc(languageSettingsRef, {
        languages: currentLanguages.filter(lang => lang.code !== languageToDelete)
      });

      // Update your tabs state here
      setLanguages(prev => prev.filter(lang => lang.code !== languageToDelete));
      setRefresh(prev => !prev); // Trigger refresh
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  return (
    <LanguageProductTable
      onDeleteLanguage={setDeleteTranslationsFunc}
      brandId={activeBrandId}
      refresh={refresh}
      setRefresh={setRefresh}
      isMainTab={true} // Add default values for these props
      languageCode="en" // Default to English or main language
    />
  );
};

export default TranslationsPage; 