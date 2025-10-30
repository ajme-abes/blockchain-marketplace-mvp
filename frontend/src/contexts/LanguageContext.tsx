import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'amh';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  'nav.home': { en: 'Home', amh: 'ዋና ገጽ' },
  'nav.marketplace': { en: 'Marketplace', amh: 'ገበያ' },
  'nav.contact': { en: 'Contact', amh: 'ያግኙን' },
  'nav.login': { en: 'Login', amh: 'ግባ' },
  'nav.register': { en: 'Register', amh: 'ይመዝገቡ' },
  'hero.title': { en: 'Empowering Ethiopian Producers & Buyers', amh: 'የኢትዮጵያ አምራቾችን እና ገዢዎችን ማብቃት' },
  'hero.subtitle': { en: 'Transparent, fair, and blockchain-powered marketplace connecting you directly with local producers', amh: 'ግልፅ፣ ፍትሃዊ እና በብሎክቼይን የተጎለበተ ገበያ በቀጥታ ከአካባቢያዊ አምራቾች ጋር ያገናኛል' },
  'hero.cta': { en: 'Explore Marketplace', amh: 'ገበያውን ያስሱ' },
  'featured.title': { en: 'Featured Products', amh: 'ተመራጭ ምርቶች' },
  'currency': { en: 'ETB', amh: 'ብር' },
  'common.buyNow': { en: 'Buy Now', amh: 'አሁን ግዛ' },
  'common.learnMore': { en: 'Learn More', amh: 'ተጨማሪ ይወቁ' },
  'testimonials.title': { en: 'What People Say', amh: 'ሰዎች ምን ይላሉ' },
  'about.title': { en: 'About EthioTrust', amh: 'ስለ EthioTrust' },
  'footer.quickLinks': { en: 'Quick Links', amh: 'ፈጣን አገናኞች' },
  'footer.paymentPartners': { en: 'Payment Partners', amh: 'የክፍያ አጋሮች' },
  'footer.newsletter': { en: 'Newsletter', amh: 'ጋዜጣ' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const stored = localStorage.getItem('ethiotrust-language');
    return (stored as Language) || 'en';
  });

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'amh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('ethiotrust-language', newLang);
  };

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
