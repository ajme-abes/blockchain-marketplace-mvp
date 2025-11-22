// src/services/api.ts - FIXED VERSION
const API_BASE_URL = 'http://localhost:5000/api';

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

        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If not JSON, use the text as is
        }

        throw new Error(errorMessage);
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
}

export default new ApiService();