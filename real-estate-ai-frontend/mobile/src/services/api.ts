import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:3000/api'; // Adjust based on your backend URL

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, clear storage and redirect to login
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          // You might want to dispatch a logout action here
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication endpoints
  async login(credentials: { email: string; password: string }): Promise<AxiosResponse> {
    return this.client.post('/auth/login', credentials);
  }

  async signup(userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    agreeToTerms: boolean;
    agreeToPrivacy: boolean;
  }): Promise<AxiosResponse> {
    return this.client.post('/auth/signup', userData);
  }

  async logout(): Promise<AxiosResponse> {
    return this.client.post('/auth/logout');
  }

  async refreshToken(): Promise<AxiosResponse> {
    return this.client.post('/auth/refresh');
  }

  // Property endpoints
  async saveProperty(propertyData: any): Promise<AxiosResponse> {
    return this.client.post('/properties', propertyData);
  }

  async getProperties(): Promise<AxiosResponse> {
    return this.client.get('/properties');
  }

  // AI Content Generation endpoints
  async generateDescription(
    propertyData: any,
    options: any
  ): Promise<AxiosResponse> {
    return this.client.post('/ai/generate', {
      propertyData,
      options,
    });
  }

  async getGenerationHistory(): Promise<AxiosResponse> {
    return this.client.get('/ai/history');
  }

  async saveGeneration(result: any): Promise<AxiosResponse> {
    return this.client.post('/ai/save', result);
  }

  // User endpoints
  async getUserProfile(): Promise<AxiosResponse> {
    return this.client.get('/user/profile');
  }

  async updateUserProfile(userData: any): Promise<AxiosResponse> {
    return this.client.put('/user/profile', userData);
  }

  async updatePreferences(preferences: any): Promise<AxiosResponse> {
    return this.client.put('/user/preferences', preferences);
  }

  // GDPR endpoints
  async exportUserData(): Promise<AxiosResponse> {
    return this.client.get('/gdpr/export');
  }

  async deleteUserAccount(): Promise<AxiosResponse> {
    return this.client.delete('/gdpr/delete-account');
  }

  async updateConsent(consentData: any): Promise<AxiosResponse> {
    return this.client.post('/gdpr/consent', consentData);
  }

  // Market Data endpoints
  async getMarketData(location: string): Promise<AxiosResponse> {
    return this.client.get(`/market/${encodeURIComponent(location)}`);
  }

  async getComparableProperties(params: {
    location: string;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<AxiosResponse> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });
    return this.client.get(`/market/comparables?${queryParams.toString()}`);
  }

  async getMarketTrends(location: string, period: string = '12months'): Promise<AxiosResponse> {
    return this.client.get(`/market/trends/${encodeURIComponent(location)}?period=${period}`);
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;

// Export types for use in components
export type { AxiosResponse };