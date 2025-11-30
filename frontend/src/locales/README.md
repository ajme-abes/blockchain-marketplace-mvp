# Internationalization (i18n) Guide

This project supports multiple languages using a custom i18n implementation.

## Supported Languages

- **English** (en) 🇬🇧
- **Amharic** (amh) 🇪🇹 - አማርኛ
- **Oromo** (orm) 🇪🇹 - Afaan Oromoo

## Usage

### In Components

```tsx
import { useLanguage } from '@/contexts/LanguageContext';

function MyComponent() {
  const { t, language, setLanguage } = useLanguage();
  
  return (
    <div>
      <h1>{t('nav.home')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}
```

### Available Hook Methods

- `t(key: string)` - Translate a key
- `language` - Current language code
- `setLanguage(lang: Language)` - Change language
- `toggleLanguage()` - Cycle through languages
- `availableLanguages` - Array of available language codes
- `getLanguageName(lang)` - Get display name for a language
- `getLanguageFlag(lang)` - Get flag emoji for a language

### Language Selector Component

A pre-built language selector dropdown is available:

```tsx
import { LanguageSelector } from '@/components/layout/LanguageSelector';

function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

## Adding New Translations

### 1. Add to Translation Files

Edit the language files in `frontend/src/locales/`:

**en.ts** (English)
```typescript
export const en = {
  'my.new.key': 'My New Translation',
  // ...
};
```

**amh.ts** (Amharic)
```typescript
export const amh = {
  'my.new.key': 'የእኔ አዲስ ትርጉም',
  // ...
};
```

**orm.ts** (Oromo)
```typescript
export const orm = {
  'my.new.key': 'Hiikkaa Koo Haaraa',
  // ...
};
```

### 2. Use in Components

```tsx
const { t } = useLanguage();
return <div>{t('my.new.key')}</div>;
```

## Translation Key Naming Convention

Use dot notation to organize translations:

- `nav.*` - Navigation items
- `common.*` - Common UI elements
- `settings.*` - Settings page
- `auth.*` - Authentication
- `toast.*` - Toast notifications
- `hero.*` - Hero section
- `footer.*` - Footer content

## Settings Integration

Users can change their language preference in the Settings page (`/settings`). The language preference is automatically saved to localStorage and persists across sessions.

## Adding a New Language

1. Create a new translation file: `frontend/src/locales/[code].ts`
2. Add all translation keys with values in the new language
3. Update `frontend/src/locales/index.ts`:
   ```typescript
   import { newLang } from './newLang';
   
   export type Language = 'en' | 'amh' | 'orm' | 'newLang';
   
   export const translations = {
     en,
     amh,
     orm,
     newLang,
   };
   
   export const languageNames: Record<Language, string> = {
     // ...
     newLang: 'New Language Name',
   };
   
   export const languageFlags: Record<Language, string> = {
     // ...
     newLang: '🏳️',
   };
   ```
4. Update `LanguageContext.tsx` to include the new language in the `availableLanguages` array

## Best Practices

1. Always add translations for all supported languages when adding new keys
2. Use descriptive key names that indicate where the translation is used
3. Keep translations concise and culturally appropriate
4. Test translations in all languages before deploying
5. Use the `t()` function for all user-facing text
