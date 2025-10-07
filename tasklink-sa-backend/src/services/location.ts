import { Client, AddressComponent } from '@googlemaps/google-maps-services-js';
import { PrismaClient } from '@prisma/client';
import { config } from '../config';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(config.redisUrl);

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  addressComponents: AddressComponent[];
  placeId?: string;
}

export interface LocationSearchOptions {
  radius?: number; // in kilometers
  limit?: number;
  offset?: number;
}

export interface SouthAfricanAddress {
  streetNumber?: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface LocationCache {
  key: string;
  data: GeocodeResult;
  expiresAt: Date;
}

export class LocationService {
  private static googleMapsClient = new Client({});

  // South African provinces and major cities for validation
  private static readonly SA_PROVINCES = [
    'Western Cape', 'Gauteng', 'KwaZulu-Natal', 'Eastern Cape',
    'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape', 'Free State'
  ];

  private static readonly SA_MAJOR_CITIES = [
    'Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth',
    'Bloemfontein', 'East London', 'Pietermaritzburg', 'Polokwane', 'Nelspruit',
    'Kimberley', 'Rustenburg', 'George', 'Paarl', 'Stellenbosch', 'Somerset West'
  ];

  /**
   * Geocode an address to coordinates using Google Maps API
   */
  static async geocodeAddress(address: string, region: string = 'za'): Promise<GeocodeResult> {
    try {
      // Check cache first
      const cacheKey = `geocode:${address.toLowerCase()}`;
      const cached = await this.getCachedLocation(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.googleMapsClient.geocode({
        params: {
          address: `${address}, South Africa`,
          key: config.googleMapsApiKey,
          region: region,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('No results found for the given address');
      }

      const result = response.data.results[0];
      if (!result || !result.geometry || !result.geometry.location) {
        throw new Error('Invalid geocoding result');
      }

      const geocodeResult: GeocodeResult = {
        coordinates: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        formattedAddress: result.formatted_address || '',
        addressComponents: result.address_components || [],
        placeId: result.place_id,
      };

      // Cache the result for 30 days
      await this.setCachedLocation(cacheKey, geocodeResult, 30 * 24 * 60 * 60);

      return geocodeResult;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  static async reverseGeocode(coordinates: Coordinates): Promise<GeocodeResult> {
    try {
      const cacheKey = `reverse:${coordinates.lat},${coordinates.lng}`;
      const cached = await this.getCachedLocation(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await this.googleMapsClient.reverseGeocode({
        params: {
          latlng: `${coordinates.lat},${coordinates.lng}`,
          key: config.googleMapsApiKey,
        },
      });

      if (response.data.results.length === 0) {
        throw new Error('No results found for the given coordinates');
      }

      const result = response.data.results[0];
      if (!result) {
        throw new Error('Invalid reverse geocoding result');
      }

      const geocodeResult: GeocodeResult = {
        coordinates,
        formattedAddress: result.formatted_address || '',
        addressComponents: result.address_components || [],
        placeId: result.place_id,
      };

      // Cache the result for 30 days
      await this.setCachedLocation(cacheKey, geocodeResult, 30 * 24 * 60 * 60);

      return geocodeResult;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Failed to reverse geocode coordinates');
    }
  }

  /**
   * Get address autocomplete suggestions
   */
  static async getAddressSuggestions(input: string, location?: Coordinates): Promise<string[]> {
    try {
      const response = await this.googleMapsClient.placeAutocomplete({
        params: {
          input,
          key: config.googleMapsApiKey,
          components: ['country:za'], // Restrict to South Africa
          ...(location && {
            location: `${location.lat},${location.lng}`,
            radius: 50000, // 50km radius
          }),
        },
      });

      return response.data.predictions.map(prediction => prediction.description);
    } catch (error) {
      console.error('Address suggestions error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  static calculateDistance(coord1: Coordinates, coord2: Coordinates, unit: 'km' | 'miles' = 'km'): number {
    const R = unit === 'km' ? 6371 : 3959; // Earth's radius
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find jobs within a specified radius of coordinates
   */
  static async findNearbyJobs(
    coordinates: Coordinates,
    radius: number = 10,
    options: LocationSearchOptions = {}
  ) {
    try {
      const { limit = 50, offset = 0 } = options;

      // Use PostgreSQL's spatial functions for accurate distance calculation
      const jobs = await prisma.$queryRaw`
        SELECT
          id,
          title,
          location,
          coordinates,
          budget,
          "budgetType",
          status,
          "createdAt",
          -- Calculate distance using PostGIS or basic calculation
          (6371 * acos(
            cos(radians(${coordinates.lat})) * cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT)) - radians(${coordinates.lng})) +
            sin(radians(${coordinates.lat})) * sin(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT)))
          )) as distance_km
        FROM jobs
        WHERE
          coordinates IS NOT NULL
          AND status = 'OPEN'
          AND (6371 * acos(
            cos(radians(${coordinates.lat})) * cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT)) - radians(${coordinates.lng})) +
            sin(radians(${coordinates.lat})) * sin(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT)))
          )) <= ${radius}
        ORDER BY distance_km
        LIMIT ${limit} OFFSET ${offset}
      `;

      return jobs;
    } catch (error) {
      console.error('Error finding nearby jobs:', error);
      throw new Error('Failed to find nearby jobs');
    }
  }

  /**
   * Find users within a specified radius (for workers near a job)
   */
  static async findNearbyUsers(
    coordinates: Coordinates,
    radius: number = 25,
    options: LocationSearchOptions = {}
  ) {
    try {
      const { limit = 50, offset = 0 } = options;

      const users = await prisma.$queryRaw`
        SELECT
          id,
          "firstName",
          "lastName",
          location,
          coordinates,
          rating,
          "reviewCount",
          "isWorker",
          "completedJobs",
          (6371 * acos(
            cos(radians(${coordinates.lat})) * cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT)) - radians(${coordinates.lng})) +
            sin(radians(${coordinates.lat})) * sin(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT)))
          )) as distance_km
        FROM users
        WHERE
          coordinates IS NOT NULL
          AND "isWorker" = true
          AND (6371 * acos(
            cos(radians(${coordinates.lat})) * cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT)) - radians(${coordinates.lng})) +
            sin(radians(${coordinates.lat})) * sin(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT)))
          )) <= ${radius}
        ORDER BY distance_km
        LIMIT ${limit} OFFSET ${offset}
      `;

      return users;
    } catch (error) {
      console.error('Error finding nearby users:', error);
      throw new Error('Failed to find nearby users');
    }
  }

  /**
   * Validate South African address format
   */
  static validateSouthAfricanAddress(address: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!address || address.trim().length < 5) {
      errors.push('Address must be at least 5 characters long');
    }

    // Check for basic SA address components
    const hasStreetNumber = /\d+/.test(address);
    const hasSuburb = /\b[A-Za-z]+(?:\s+[A-Za-z]+)*\b/.test(address);

    if (!hasStreetNumber) {
      errors.push('Address should include a street number');
    }

    if (!hasSuburb) {
      errors.push('Address should include a suburb or area name');
    }

    // Check for South African city names
    const addressLower = address.toLowerCase();
    const hasSACity = this.SA_MAJOR_CITIES.some(city =>
      addressLower.includes(city.toLowerCase())
    );

    if (!hasSACity) {
      errors.push('Address should include a valid South African city');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Parse South African address into components
   */
  static parseSouthAfricanAddress(address: string): SouthAfricanAddress {
    const components: SouthAfricanAddress = {};

    // This is a simplified parser - in production, you might use a more sophisticated library
    const parts = address.split(',').map(part => part.trim());

    if (parts.length >= 1) {
      // Try to extract street number and name from first part
      const streetMatch = parts[0].match(/^(\d+)\s+(.+)$/);
      if (streetMatch && streetMatch.length >= 3) {
        components.streetNumber = streetMatch[1];
        components.streetName = streetMatch[2];
      }
    }

    if (parts.length >= 2) {
      components.suburb = parts[parts.length - 2];
    }

    if (parts.length >= 3) {
      components.city = parts[parts.length - 1];
    }

    // Try to identify province
    for (const province of this.SA_PROVINCES) {
      if (address.toLowerCase().includes(province.toLowerCase())) {
        components.province = province;
        break;
      }
    }

    components.country = 'South Africa';

    return components;
  }

  /**
   * Get jobs within map bounds for map display
   */
  static async getJobsInBounds(
    northEast: Coordinates,
    southWest: Coordinates,
    limit: number = 100
  ) {
    try {
      const jobs = await prisma.$queryRaw`
        SELECT
          id,
          title,
          location,
          coordinates,
          budget,
          "budgetType",
          status,
          "createdAt"
        FROM jobs
        WHERE
          coordinates IS NOT NULL
          AND status = 'OPEN'
          AND CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT) BETWEEN ${southWest.lat} AND ${northEast.lat}
          AND CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT) BETWEEN ${southWest.lng} AND ${northEast.lng}
        LIMIT ${limit}
      `;

      return jobs;
    } catch (error) {
      console.error('Error getting jobs in bounds:', error);
      throw new Error('Failed to get jobs in map bounds');
    }
  }

  /**
   * Cache geocoding results in Redis
   */
  private static async setCachedLocation(key: string, data: GeocodeResult, ttlSeconds: number): Promise<void> {
    try {
      const cacheData: LocationCache = {
        key,
        data,
        expiresAt: new Date(Date.now() + ttlSeconds * 1000),
      };

      await redis.setex(key, ttlSeconds, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Failed to cache location data:', error);
      // Don't throw - caching failures shouldn't break the service
    }
  }

  /**
   * Get cached geocoding results from Redis
   */
  private static async getCachedLocation(key: string): Promise<GeocodeResult | null> {
    try {
      const cached = await redis.get(key);

      if (!cached) {
        return null;
      }

      const cacheData: LocationCache = JSON.parse(cached);

      // Check if cache has expired
      if (new Date() > cacheData.expiresAt) {
        await redis.del(key);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.error('Failed to get cached location data:', error);
      return null;
    }
  }

  /**
   * Convert degrees to radians
   */
  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Validate coordinates
   */
  static validateCoordinates(coordinates: Coordinates): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      errors.push('Coordinates must be numbers');
    }

    if (coordinates.lat < -90 || coordinates.lat > 90) {
      errors.push('Latitude must be between -90 and 90');
    }

    if (coordinates.lng < -180 || coordinates.lng > 180) {
      errors.push('Longitude must be between -180 and 180');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get location analytics for a specific area
   */
  static async getLocationAnalytics(coordinates: Coordinates, radius: number = 50) {
    try {
      const analytics = await prisma.$queryRaw`
        SELECT
          COUNT(*) as total_jobs,
          AVG(budget) as avg_budget,
          COUNT(DISTINCT "posterId") as unique_clients,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_jobs,
          COUNT(CASE WHEN status = 'OPEN' THEN 1 END) as open_jobs
        FROM jobs
        WHERE
          coordinates IS NOT NULL
          AND (6371 * acos(
            cos(radians(${coordinates.lat})) * cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT))) *
            cos(radians(CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT)) - radians(${coordinates.lng})) +
            sin(radians(${coordinates.lat})) * sin(radians(CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT)))
          )) <= ${radius}
      `;

      return analytics[0];
    } catch (error) {
      console.error('Error getting location analytics:', error);
      throw new Error('Failed to get location analytics');
    }
  }
}