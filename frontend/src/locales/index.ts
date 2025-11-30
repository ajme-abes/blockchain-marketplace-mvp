import { en } from './en';
import { amh } from './amh';
import { orm } from './orm';

export type Language = 'en' | 'amh' | 'orm';

export const translations = {
    en,
    amh,
    orm,
};

export const languageNames: Record<Language, string> = {
    en: 'English',
    amh: 'አማርኛ',
    orm: 'Afaan Oromoo',
};

export const languageFlags: Record<Language, string> = {
    en: '🇬🇧',
    amh: '🇪🇹',
    orm: '🇪🇹',
};
