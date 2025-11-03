// src/services/api.js
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('authToken');
    console.log('🔧 API Service initialized. Backend URL:', API_BASE_URL);
  }
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

async request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🔧 API: Making request to:', url, 'with options:', options);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  if (this.token) {
    config.headers.Authorization = `Bearer ${this.token}`;
  }

  try {
    const response = await fetch(url, config);
    
    console.log('🔧 API: Response status:', response.status);
    console.log('🔧 API: Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('🔧 API: Raw response text:', responseText);

    if (!response.ok) {
      console.error('🔧 API: Error response:', responseText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Parse JSON only if there's content
    let data;
    if (responseText && responseText.trim() !== '') {
      try {
        data = JSON.parse(responseText);
        console.log('🔧 API: Parsed response data:', data);
      } catch (parseError) {
        console.error('🔧 API: JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
    } else {
      console.warn('🔧 API: Empty response body');
      data = {};
    }

    return data;
    
  } catch (error) {
    console.error('🔧 API: Request failed:', error);
    throw error;
  }
}

  // Auth methods
  async login(email, password) {
    console.log('🔧 API: Sending login request for:', email);
    
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  
    console.log('🔧 API: Login response received:', response);
    
    // Handle different response structures
    if (response.token) {
      return response; // { token: '...', user: {...} }
    } else if (response.data && response.data.token) {
      return response.data; // { data: { token: '...', user: {...} } }
    } else {
      throw new Error('Invalid response format from server');
    }
  }

  async register(userData) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async logout() {
    // Call logout endpoint if you have one, or just remove token
    this.removeToken();
  }

  async verifyEmail(token) {
    return this.request('/email-verification/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerificationEmail() {
    return this.request('/email-verification/resend', {
      method: 'POST',
    });
  }
}

export default new ApiService();