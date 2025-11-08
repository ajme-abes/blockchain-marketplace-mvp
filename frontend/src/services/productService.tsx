// src/services/productService.ts
import api from './api';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  region: string;
  images: string[];
  producerName: string;
  producerId: string;
  verified: boolean;
  rating: number;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'out_of_quantity';
}

export interface ProductFilters {
  category?: string;
  region?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  status?: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  category: string;
  region: string;
  quantity: number;
  unit: string;
  images: File[];
}

export const productService = {
  // Get all products with optional filters
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    
    if (filters?.category) queryParams.append('category', filters.category);
    if (filters?.region) queryParams.append('region', filters.region);
    if (filters?.minPrice !== undefined) queryParams.append('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice !== undefined) queryParams.append('maxPrice', filters.maxPrice.toString());
    if (filters?.search) queryParams.append('search', filters.search);
    if (filters?.status) queryParams.append('status', filters.status);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    
    return api.request(endpoint);
  },

  // Get single product by ID
  async getProduct(id: string): Promise<Product> {
    return api.request(`/products/${id}`);
  },

  // Create new product (producer only)
  async createProduct(productData: CreateProductData): Promise<Product> {
    const formData = new FormData();
    
    // Append basic fields
    formData.append('name', productData.name);
    formData.append('description', productData.description);
    formData.append('price', productData.price.toString());
    formData.append('category', productData.category);
    formData.append('region', productData.region);
    formData.append('quantity', productData.quantity.toString());
    formData.append('unit', productData.unit);
    
    // Append images
    productData.images.forEach((image, index) => {
      formData.append('images', image);
    });

    return api.request('/products', {
      method: 'POST',
      body: formData,
      headers: {
        // Let browser set Content-Type for FormData with boundary
      },
    });
  },

  // Update product (producer only)
  async updateProduct(id: string, productData: Partial<CreateProductData>): Promise<Product> {
    const formData = new FormData();
    
    // Append only provided fields
    if (productData.name) formData.append('name', productData.name);
    if (productData.description) formData.append('description', productData.description);
    if (productData.price) formData.append('price', productData.price.toString());
    if (productData.category) formData.append('category', productData.category);
    if (productData.region) formData.append('region', productData.region);
    if (productData.quantity) formData.append('quantity', productData.quantity.toString());
    if (productData.unit) formData.append('unit', productData.unit);
    
    // Append new images if provided
    if (productData.images) {
      productData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return api.request(`/products/${id}`, {
      method: 'PUT',
      body: formData,
    });
  },

  // Delete product (producer only)
  async deleteProduct(id: string): Promise<void> {
    return api.request(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  // Get producer's products
  async getMyProducts(): Promise<Product[]> {
    return api.request('/products/my-products');
  },

  // Update product status
  async updateProductStatus(id: string, status: Product['status']): Promise<Product> {
    return api.request(`/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Get products by category
  async getProductsByCategory(category: string): Promise<Product[]> {
    return api.request(`/products/category/${category}`);
  },
};