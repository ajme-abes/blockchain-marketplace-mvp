// src/services/productService.ts - COMPATIBLE WITH YOUR API SERVICE
import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  quantityAvailable: number;
  status: string;
  imageUrl?: string;
  images: {
    url?: string;
    ipfsCid?: string;
    alternatives: any[];
  };
  producer?: {
    id: string;
    businessName: string;
    location: string;
    verificationStatus: string;
    user: {
      name: string;
      email: string;
      phone?: string;
    };
  };
  producerName?: string;
  averageRating?: number;
  reviewCount: number;
  listingDate: string;
  updatedAt: string;
  
  region?: string;
  unit?: string;
  verified?: boolean;
  rating?: number;
  stock?: number;
}

export interface ProductDetail extends Product {
  reviewDetails?: any;
  producerContact?: any;
  popularity?: number;
}

export interface ProductFilters {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  quantity: number;
  images: File[];
}

// Helper function to map backend data to frontend format
const mapProductFromBackend = (backendProduct: any): Product => {
  const region = backendProduct.producer?.location || 'Local';
  const rating = backendProduct.averageRating || 0;
  
  return {
    ...backendProduct,
    region,
    unit: 'unit',
    verified: backendProduct.producer?.verificationStatus === 'VERIFIED',
    rating,
    stock: backendProduct.quantityAvailable,
    quantityAvailable: backendProduct.quantityAvailable,
    images: backendProduct.images || {
      url: backendProduct.imageUrl,
      ipfsCid: backendProduct.imageUrl ? backendProduct.imageUrl.split('/').pop() : null,
      alternatives: []
    }
  };
};

export const productService = {
  // Get all products with optional filters - FIXED: uses api.request()
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
    if (filters?.page) queryParams.append('page', filters.page.toString());
    if (filters?.limit) queryParams.append('limit', filters.limit.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    console.log('🔄 Fetching products from:', endpoint);
    
    try {
      const response = await api.request(endpoint);
      console.log('✅ Raw products response:', response);

      // Handle different response structures
      if (response.data) {
        const backendData = response.data;
        
        if (backendData.products && Array.isArray(backendData.products)) {
          return backendData.products.map(mapProductFromBackend);
        } else if (Array.isArray(backendData)) {
          return backendData.map(mapProductFromBackend);
        }
      } else if (Array.isArray(response)) {
        return response.map(mapProductFromBackend);
      }
      
      console.warn('⚠️ Unexpected response structure, returning empty array');
      return [];
      
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
      throw error;
    }
  },

  // Get product by ID - FIXED: uses api.request()
  async getProductById(id: string): Promise<ProductDetail> {
    console.log('🔄 Fetching product details for:', id);
    
    try {
      const response = await api.request(`/products/${id}`);
      console.log('✅ Raw product detail response:', response);

      if (response.data) {
        const backendProduct = response.data;
        return mapProductFromBackend(backendProduct);
      }
      
      throw new Error('Invalid product data received');
      
    } catch (error) {
      console.error('❌ Failed to fetch product details:', error);
      throw error;
    }
  },

  // Get product (alias for getProductById)
  async getProduct(id: string): Promise<Product> {
    return this.getProductById(id);
  },

  // Create new product (producer only) - FIXED: uses api.request()
  async createProduct(productData: CreateProductData): Promise<Product> {
    const formData = new FormData();
    
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    formData.append('category', productData.category);
    formData.append('quantity', productData.quantity.toString());
    
    productData.images.forEach((image) => {
      formData.append('images', image);
    });

    try {
      // For FormData, we need to use fetch directly since your api.request uses JSON
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Product creation response:', data);
      
      if (data.data) {
        return mapProductFromBackend(data.data);
      }
      
      throw new Error('Invalid response after product creation');
      
    } catch (error) {
      console.error('❌ Failed to create product:', error);
      throw error;
    }
  },

  // Get producer's products - FIXED: uses api.request()
  async getMyProducts(): Promise<Product[]> {
    try {
      const response = await api.request('/products/my/products');
      
      if (response.data) {
        const backendData = response.data;
        return backendData.products?.map(mapProductFromBackend) || [];
      }
      
      throw new Error('Invalid response structure for my products');
      
    } catch (error) {
      console.error('❌ Failed to fetch my products:', error);
      throw error;
    }
  },

  // Update product status - FIXED: uses api.request()
  async updateProductStatus(id: string, status: string): Promise<Product> {
    try {
      const response = await api.request(`/products/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      if (response.data) {
        return mapProductFromBackend(response.data);
      }
      
      throw new Error('Invalid response after status update');
      
    } catch (error) {
      console.error('❌ Failed to update product status:', error);
      throw error;
    }
  },

  // Update product - FIXED: uses api.request()
  async updateProduct(id: string, productData: Partial<CreateProductData>): Promise<Product> {
    const formData = new FormData();
    
    if (productData.name) formData.append('name', productData.name);
    if (productData.description) formData.append('description', productData.description);
    if (productData.price) formData.append('price', productData.price.toString());
    if (productData.category) formData.append('category', productData.category);
    if (productData.quantity) formData.append('quantity', productData.quantity.toString());
    
    if (productData.images) {
      productData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    try {
      const response = await fetch(`http://localhost:5000/api/products/${id}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data) {
        return mapProductFromBackend(data.data);
      }
      
      throw new Error('Invalid response after product update');
      
    } catch (error) {
      console.error('❌ Failed to update product:', error);
      throw error;
    }
  },

  // Delete product - FIXED: uses api.request()
  async deleteProduct(id: string): Promise<void> {
    await api.request(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};