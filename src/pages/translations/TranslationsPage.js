import React, { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useUser } from '../../contexts/UserContext';
import LanguageProductTable from './components/LanguageProductTable';

const TranslationsPage = () => {
  const [deleteTranslationsFunc, setDeleteTranslationsFunc] = useState(null);
  const [languages, setLanguages] = useState([]);
  const user = useUser();

  const handleDeleteLanguage = async (languageToDelete) => {
    try {
      // First delete the language from settings
      const languageSettingsRef = doc(db, 'users', user.uid, 'settings', 'languages');
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
    } catch (error) {
      console.error('Error deleting language:', error);
    }
  };

  return (
    <LanguageProductTable
      onDeleteLanguage={setDeleteTranslationsFunc}
    />
  );
};

export default TranslationsPage; 