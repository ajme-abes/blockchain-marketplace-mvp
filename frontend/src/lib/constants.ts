// Platform constants for categories and regions
// These match the values used in the database

export const categories = [
    'Coffee',
    'Fruits',
    'Grains',
    'Vegetables',
    'Spices',
    'Honey',
    'Teff',
    'Sesame',
    'Other',
] as const;

export const regions = [
    'Addis Ababa',
    'Oromia',
    'Oromia, Ethiopia',
    'Amhara',
    'Tigray',
    'SNNPR',
    'Sidama',
    'Harar',
    'Mechara',
    'dadar',
] as const;

export type Category = typeof categories[number];
export type Region = typeof regions[number];