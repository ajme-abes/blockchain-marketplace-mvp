// src/services/api.ts - ENHANCED ERROR HANDLING
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
  token?: string;
  user?: any;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('authToken');
    console.log('🔧 API Service initialized with token:', !!this.token);
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  removeToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  /**
   * Parse Retry-After header value to seconds
   */
  private parseRetryAfter(retryAfterHeader: string | null): number | undefined {
    if (!retryAfterHeader) return undefined;

    // If it's a number, it's seconds
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds)) {
      return seconds;
    }

    // If it's a date, calculate seconds from now
    try {
      const retryDate = new Date(retryAfterHeader);
      const now = new Date();
      const diffMs = retryDate.getTime() - now.getTime();
      return Math.max(0, Math.ceil(diffMs / 1000));
    } catch {
      return undefined;
    }
  }

  // FIXED: Properly handle both 'data' and 'body' properties
  async request<T>(endpoint: string, options: any = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    console.log('🔧 API Request:', url, options);

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      method: options.method || 'GET',
    };

    // FIX: Handle 'data' property (used by userService) OR 'body' property
    let requestBody = options.data || options.body;

    if (requestBody) {
      if (typeof requestBody === 'object') {
        config.body = JSON.stringify(requestBody);
        console.log('🔧 Request body stringified:', config.body.substring(0, 200) + '...');
      } else {
        config.body = requestBody;
      }
    }

    if (this.token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${this.token}`,
      };
    }

    try {
      const response = await fetch(url, config);

      console.log('🔧 API Response Status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔧 API Error Response:', errorText);

        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          // If not JSON, create error object
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
            code: 'HTTP_ERROR'
          };
        }

        // Enhanced error handling for authentication errors
        const authError = {
          code: errorData.code || 'HTTP_ERROR',
          message: errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData.details || errorData,
          // Preserve rate limiting headers
          retryAfter: this.parseRetryAfter(response.headers.get('Retry-After')),
          // Preserve authentication error details
          attemptsLeft: errorData.attemptsLeft,
          maxAttempts: errorData.maxAttempts,
          unlockAt: errorData.unlockAt,
          minutesRemaining: errorData.minutesRemaining,
          // HTTP status for additional context
          status: response.status
        };

        throw authError;
      }

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      console.log('🔧 API Response Data:', data);
      return data;

    } catch (error) {
      console.error('🔧 API Request Failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      data: { email, password }, // Changed from body to data
    });

    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData: any): Promise<any> {
    return this.request('/users/register', {
      method: 'POST',
      data: userData, // Changed from body to data
    });
  }

  // In your api.ts - Add logging to getCurrentUser
  async getCurrentUser(): Promise<any> {
    console.log('🔧 Fetching current user from /me endpoint...');
    const response = await this.request('/auth/me');
    console.log('✅ Current user response:', response);
    return response;
  }
  async verifyEmail(token: string): Promise<any> {
    return this.request('/email-verification/verify', {
      method: 'POST',
      data: { token }, // Changed from body to data
    });
  }

  async resendVerificationEmail(): Promise<any> {
    return this.request('/email-verification/resend', {
      method: 'POST',
    });
  }

  // Product methods
  async getProducts(params?: {
    category?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/products${queryString ? `?${queryString}` : ''}`);
  }

  async getProductById(id: string): Promise<any> {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: FormData): Promise<any> {
    return this.request('/products', {
      method: 'POST',
      headers: {}, // Let browser set Content-Type for FormData
      body: productData,
    });
  }

  async updateProduct(id: string, productData: FormData): Promise<any> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      headers: {}, // Let browser set Content-Type for FormData
      body: productData,
    });
  }

  async deleteProduct(id: string): Promise<any> {
    return this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Testimonial methods
  async getPublishedTestimonials(limit?: number): Promise<any> {
    const queryParams = limit ? `?limit=${limit}` : '';
    return this.request(`/testimonials/published${queryParams}`);
  }

  async createTestimonial(testimonialData: {
    name: string;
    role: string;
    message: string;
    rating?: number;
  }): Promise<any> {
    return this.request('/testimonials', {
      method: 'POST',
      data: testimonialData,
    });
  }

  // Stats methods
  async getHeroStats(): Promise<any> {
    return this.request('/stats/hero');
  }

  async getAboutStats(): Promise<any> {
    return this.request('/stats/about');
  }

  // Contact methods
  async sendContactMessage(messageData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<any> {
    return this.request('/contact', {
      method: 'POST',
      data: messageData,
    });
  }

  async getContactMessages(filters?: any): Promise<any> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    return this.request(`/contact${queryString ? `?${queryString}` : ''}`);
  }

  async getUnreadContactCount(): Promise<any> {
    return this.request('/contact/unread-count');
  }
}

export default new ApiService();