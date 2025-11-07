// src/services/api.ts
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

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log('🔧 API Request:', url, options);

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

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
        console.error('🔧 API Error:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
      body: JSON.stringify({ email, password }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    return response;
  }

  async register(userData: any): Promise<any> {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(): Promise<any> {
    return this.request('/auth/me');
  }

  async verifyEmail(token: string): Promise<any> {
    return this.request('/email-verification/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail(): Promise<any> {
    return this.request('/email-verification/resend', {
      method: 'POST',
    });
  }
}

export default new ApiService();