import React, { createContext, useContext, useState } from 'react';
import { translations, Language, languageNames, languageFlags } from '@/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
  availableLanguages: Language[];
  getLanguageName: (lang: Language) => string;
  getLanguageFlag: (lang: Language) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('ethiotrust-language');
    return (stored as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('ethiotrust-language', lang);
  };

  const toggleLanguage = () => {
    const languages: Language[] = ['en', 'amh', 'orm'];
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const t = (key: string): string => {
    const translation = translations[language];
    return (translation as any)[key] || key;
  };

  const getLanguageName = (lang: Language): string => {
    return languageNames[lang];
  };

  const getLanguageFlag = (lang: Language): string => {
    return languageFlags[lang];
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        availableLanguages: ['en', 'amh', 'orm'],
        getLanguageName,
        getLanguageFlag,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
