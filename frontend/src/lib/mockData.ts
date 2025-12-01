// Categories that exist in the database (case-insensitive)
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

export interface Product {
  id: string;
  name: string;
  nameAmh: string;
  description: string;
  category: typeof categories[number];
  price: number;
  unit: string;
  stock: number;
  producerId: string;
  producerName: string;
  region: typeof regions[number];
  verified: boolean;
  images: string[];
  blockchainTxHash?: string;
  rating: number;
  reviews: number;
}

export interface Producer {
  id: string;
  name: string;
  region: typeof regions[number];
  phone: string;
  bio: string;
  verified: boolean;
  totalProducts: number;
  memberSince: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: 'Producer' | 'Buyer';
  message: string;
  photo?: string;
  rating: number;
}

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Premium Yirgacheffe Coffee',
    nameAmh: 'የይርጋቸፈ ቡና',
    description: 'High-quality Arabica coffee beans from Yirgacheffe region, known for its floral and citrus notes. Organically grown and sun-dried.',
    category: 'Coffee',
    price: 450,
    unit: 'kg',
    stock: 150,
    producerId: 'p1',
    producerName: 'Alemayehu Bekele',
    region: 'Sidama',
    verified: true,
    images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800'],
    blockchainTxHash: '0x1a2b3c4d5e6f7g8h9i0j',
    rating: 4.8,
    reviews: 42,
  },
  {
    id: '2',
    name: 'Organic White Teff',
    nameAmh: 'ጤፍ',
    description: 'Premium white teff grain, perfect for making injera. Grown without pesticides in the highlands of Ethiopia.',
    category: 'Teff',
    price: 180,
    unit: 'kg',
    stock: 300,
    producerId: 'p2',
    producerName: 'Tigist Haile',
    region: 'Amhara',
    verified: true,
    images: ['https://images.unsplash.com/photo-1556910966-e0a0f6e74e8d?w=800'],
    blockchainTxHash: '0x2b3c4d5e6f7g8h9i0j1k',
    rating: 4.9,
    reviews: 58,
  },
  {
    id: '3',
    name: 'Raw Ethiopian Honey',
    nameAmh: 'ማር',
    description: 'Pure, unprocessed honey from wildflowers in the Ethiopian highlands. Rich in nutrients and natural enzymes.',
    category: 'Honey',
    price: 320,
    unit: 'kg',
    stock: 80,
    producerId: 'p3',
    producerName: 'Dawit Tesfaye',
    region: 'Oromia',
    verified: true,
    images: ['https://images.unsplash.com/photo-1587049352846-4a222e784acc?w=800'],
    blockchainTxHash: '0x3c4d5e6f7g8h9i0j1k2l',
    rating: 5.0,
    reviews: 31,
  },
  {
    id: '4',
    name: 'Hulled Sesame Seeds',
    nameAmh: 'ሰሊጥ',
    description: 'High-quality hulled sesame seeds from Humera region. Perfect for tahini and baking.',
    category: 'Sesame',
    price: 280,
    unit: 'kg',
    stock: 200,
    producerId: 'p4',
    producerName: 'Yonas Gebre',
    region: 'Tigray',
    verified: false,
    images: ['https://images.unsplash.com/photo-1613068687893-5e85b4638b56?w=800'],
    rating: 4.6,
    reviews: 23,
  },
  {
    id: '5',
    name: 'Berbere Spice Mix',
    nameAmh: 'በርበሬ',
    description: 'Authentic Ethiopian spice blend with chili peppers, fenugreek, coriander, and more. Handcrafted using traditional methods.',
    category: 'Spices',
    price: 150,
    unit: 'kg',
    stock: 120,
    producerId: 'p5',
    producerName: 'Abeba Mulugeta',
    region: 'Addis Ababa',
    verified: true,
    images: ['https://images.unsplash.com/photo-1596040033229-a0b34e2c8cbd?w=800'],
    blockchainTxHash: '0x4d5e6f7g8h9i0j1k2l3m',
    rating: 4.7,
    reviews: 67,
  },
  {
    id: '6',
    name: 'Fresh Tomatoes',
    nameAmh: 'ቲማቲም',
    description: 'Locally grown tomatoes, harvested fresh daily. Perfect for cooking and salads.',
    category: 'Vegetables',
    price: 25,
    unit: 'kg',
    stock: 500,
    producerId: 'p6',
    producerName: 'Solomon Tadesse',
    region: 'SNNPR',
    verified: true,
    images: ['https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=800'],
    blockchainTxHash: '0x5e6f7g8h9i0j1k2l3m4n',
    rating: 4.5,
    reviews: 89,
  },
];

export const mockProducers: Producer[] = [
  {
    id: 'p1',
    name: 'Alemayehu Bekele',
    region: 'Sidama',
    phone: '+251911234567',
    bio: 'Third-generation coffee farmer specializing in Yirgacheffe varieties. Passionate about sustainable farming practices.',
    verified: true,
    totalProducts: 8,
    memberSince: '2022-03',
  },
  {
    id: 'p2',
    name: 'Tigist Haile',
    region: 'Amhara',
    phone: '+251922345678',
    bio: 'Teff farmer from the highlands. Using traditional methods passed down through generations.',
    verified: true,
    totalProducts: 5,
    memberSince: '2021-11',
  },
  {
    id: 'p3',
    name: 'Dawit Tesfaye',
    region: 'Oromia',
    phone: '+251933456789',
    bio: 'Beekeeping for over 15 years. My honey comes from wildflowers in untouched natural areas.',
    verified: true,
    totalProducts: 3,
    memberSince: '2020-08',
  },
];

// Testimonials are now fetched from the backend API
// No mock data needed
