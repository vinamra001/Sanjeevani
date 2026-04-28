import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('en');

  // Load the user's saved language when the app opens
  useEffect(() => {
    const loadLanguage = async () => {
      const savedLang = await AsyncStorage.getItem('userLang');
      if (savedLang) setLang(savedLang);
    };
    loadLanguage();
  }, []);

  // Call this from any screen to change language globally
  const changeLanguage = async (newLang) => {
    setLang(newLang);
    await AsyncStorage.setItem('userLang', newLang);
  };

  const t = translations[lang] || translations['en'];

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Use this hook in every screen instead of local lang state
export const useLanguage = () => useContext(LanguageContext);