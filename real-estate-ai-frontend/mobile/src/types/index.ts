// Shared types for the Real Estate AI application

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'agent' | 'admin';
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  defaultPlatform: 'property24' | 'facebook' | 'whatsapp';
  defaultTone: 'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal';
  language: 'english' | 'afrikaans';
  notifications: boolean;
}

export interface PropertyData {
  location: string;
  size: number;
  bedrooms: number;
  bathrooms: number;
  price: number;
  keyFeatures: string[];
  propertyType: 'house' | 'apartment' | 'townhouse' | 'land';
  yearBuilt?: number;
  parking?: number;
  petsAllowed?: boolean;
}

export interface GenerationOptions {
  platform: 'property24' | 'facebook' | 'whatsapp';
  tone: 'professional' | 'enthusiastic' | 'luxury' | 'friendly' | 'formal';
  length: 'short' | 'medium' | 'long' | 'detailed';
  includePrice: boolean;
  includeFeatures: boolean;
  includeLocation: boolean;
  language: 'english' | 'afrikaans';
  targetAudience: 'first-time-buyers' | 'investors' | 'families' | 'professionals' | 'retirees';
}

export interface GeneratedResult {
  id: string;
  description: string;
  platform: 'property24' | 'facebook' | 'whatsapp';
  tone: string;
  length: string;
  propertyData: PropertyData;
  generatedAt: Date;
  wordCount: number;
  characterCount: number;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface GenerationState {
  isGenerating: boolean;
  progress: number;
  currentStep: string;
  result: GeneratedResult | null;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  generation: GenerationState;
  ui: UIState;
  market: MarketState;
}

export interface UIState {
  theme: 'light' | 'dark';
  language: 'english' | 'afrikaans';
  loading: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
}

export interface Platform {
  id: 'property24' | 'facebook' | 'whatsapp';
  name: string;
  icon: string;
  color: string;
  description: string;
  audience: string;
  features: string[];
  preview: {
    title: string;
    subtitle: string;
    style: 'formal' | 'social' | 'conversational';
  };
}

// Market Data Types
export interface MarketData {
  location: string;
  averagePrice: number;
  medianPrice: number;
  pricePerSqm: number;
  totalListings: number;
  soldListings: number;
  averageDaysOnMarket: number;
  priceHistory: PricePoint[];
  comparables: ComparableProperty[];
  trends: MarketTrend[];
  neighbourhoodStats: NeighbourhoodStats;
}

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export interface ComparableProperty {
  id: string;
  address: string;
  price: number;
  size: number;
  bedrooms: number;
  bathrooms: number;
  distance: number; // in km
  soldDate?: string;
  imageUrl?: string;
}

export interface MarketTrend {
  period: string;
  priceChange: number; // percentage
  volumeChange: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

export interface NeighbourhoodStats {
  population: number;
  averageIncome: number;
  schoolRating: number;
  crimeRate: number;
  walkabilityScore: number;
  amenities: string[];
}

export interface MarketState {
  data: MarketData | null;
  comparables: ComparableProperty[];
  trends: MarketTrend[];
  loading: boolean;
  error: string | null;
}

export interface AppState {
  auth: AuthState;
  generation: GenerationState;
  ui: UIState;
  market: MarketState;
}