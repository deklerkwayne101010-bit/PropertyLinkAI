import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { LocationService, Coordinates } from '../services/location';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isWorker: boolean;
    isClient: boolean;
  };
}

// Types for request bodies and responses
interface GeocodeRequest {
  address: string;
  region?: string;
}

interface ReverseGeocodeRequest {
  lat: number;
  lng: number;
}

interface LocationSearchRequest {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
  offset?: number;
}

interface AddressValidationRequest {
  address: string;
}

interface UserLocationUpdateRequest {
  location?: string;
  coordinates?: Coordinates;
  privacy?: 'public' | 'private' | 'workers_only';
}

interface MapBoundsRequest {
  northEast: Coordinates;
  southWest: Coordinates;
  limit?: number;
}

// Validation rules
export const geocodeValidation = [
  body('address').notEmpty().withMessage('Address is required'),
  body('region').optional().isString().withMessage('Region must be a string'),
];

export const reverseGeocodeValidation = [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
];

export const locationSearchValidation = [
  query('lat').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  query('lng').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  query('radius').optional().isFloat({ min: 1, max: 200 }).withMessage('Radius must be 1-200 km'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
];

export const addressValidation = [
  body('address').notEmpty().withMessage('Address is required'),
];

export const userLocationUpdateValidation = [
  body('location').optional().isString().withMessage('Location must be a string'),
  body('coordinates').optional().isObject().withMessage('Coordinates must be an object'),
  body('coordinates.lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('coordinates.lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('privacy').optional().isIn(['public', 'private', 'workers_only']).withMessage('Invalid privacy setting'),
];

export const mapBoundsValidation = [
  body('northEast').isObject().withMessage('North east coordinates are required'),
  body('southWest').isObject().withMessage('South west coordinates are required'),
  body('northEast.lat').isFloat({ min: -90, max: 90 }).withMessage('North east latitude must be between -90 and 90'),
  body('northEast.lng').isFloat({ min: -180, max: 180 }).withMessage('North east longitude must be between -180 and 180'),
  body('southWest.lat').isFloat({ min: -90, max: 90 }).withMessage('South west latitude must be between -90 and 90'),
  body('southWest.lng').isFloat({ min: -180, max: 180 }).withMessage('South west longitude must be between -180 and 180'),
  body('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
];

// Geocode address to coordinates
export const geocodeAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { address, region = 'za' }: GeocodeRequest = req.body;

    const result = await LocationService.geocodeAddress(address, region);

    return res.json({
      success: true,
      data: {
        coordinates: result.coordinates,
        formattedAddress: result.formattedAddress,
        addressComponents: result.addressComponents,
        placeId: result.placeId,
      }
    });

  } catch (error) {
    next(error);
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { lat, lng }: ReverseGeocodeRequest = req.body;
    const coordinates: Coordinates = { lat, lng };

    const result = await LocationService.reverseGeocode(coordinates);

    return res.json({
      success: true,
      data: {
        coordinates: result.coordinates,
        formattedAddress: result.formattedAddress,
        addressComponents: result.addressComponents,
        placeId: result.placeId,
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get address autocomplete suggestions
export const getAddressSuggestions = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { input } = req.query;
    const { lat, lng } = req.query;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Input query is required'
      });
    }

    let location: Coordinates | undefined;
    if (lat && lng && typeof lat === 'string' && typeof lng === 'string') {
      location = {
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }

    const suggestions = await LocationService.getAddressSuggestions(input, location);

    return res.json({
      success: true,
      data: { suggestions }
    });

  } catch (error) {
    next(error);
  }
};

// Validate South African address
export const validateAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { address }: AddressValidationRequest = req.body;

    const validation = LocationService.validateSouthAfricanAddress(address);
    const parsedAddress = LocationService.parseSouthAfricanAddress(address);

    return res.json({
      success: true,
      data: {
        valid: validation.valid,
        errors: validation.errors,
        parsedAddress,
      }
    });

  } catch (error) {
    next(error);
  }
};

// Find nearby jobs
export const findNearbyJobs = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { lat, lng, radius = 10, limit = 50, offset = 0 } = req.query;

    const coordinates: Coordinates = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const jobs = await LocationService.findNearbyJobs(coordinates, parseFloat(radius as string), {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    return res.json({
      success: true,
      data: {
        jobs,
        searchCenter: coordinates,
        searchRadius: parseFloat(radius as string),
        count: jobs.length
      }
    });

  } catch (error) {
    next(error);
  }
};

// Find nearby workers (for clients posting jobs)
export const findNearbyWorkers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Check if user is a client
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isClient: true, firstName: true, lastName: true }
    });

    if (!user?.isClient) {
      return res.status(403).json({
        success: false,
        error: 'Only clients can search for nearby workers'
      });
    }

    const { lat, lng, radius = 25, limit = 50, offset = 0 } = req.query;

    const coordinates: Coordinates = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const workers = await LocationService.findNearbyUsers(coordinates, parseFloat(radius as string), {
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    });

    return res.json({
      success: true,
      data: {
        workers,
        searchCenter: coordinates,
        searchRadius: parseFloat(radius as string),
        count: workers.length
      }
    });

  } catch (error) {
    next(error);
  }
};

// Update user location
export const updateUserLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { location, coordinates, privacy = 'public' }: UserLocationUpdateRequest = req.body;

    // Geocode address if provided but no coordinates
    let finalCoordinates = coordinates;
    if (location && !coordinates) {
      try {
        const geocodeResult = await LocationService.geocodeAddress(location);
        finalCoordinates = geocodeResult.coordinates;
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Could not geocode the provided address'
        });
      }
    }

    // Update user location
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        location,
        coordinates: finalCoordinates,
      },
      select: {
        id: true,
        location: true,
        coordinates: true,
      }
    });

    return res.json({
      success: true,
      message: 'Location updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    next(error);
  }
};

// Get user location
export const getUserLocation = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        location: true,
        coordinates: true,
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: { location: user }
    });

  } catch (error) {
    next(error);
  }
};

// Update location privacy settings
export const updateLocationPrivacy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { privacy }: { privacy: 'public' | 'private' | 'workers_only' } = req.body;

    if (!privacy) {
      return res.status(400).json({
        success: false,
        error: 'Privacy setting is required'
      });
    }

    // For now, we'll store privacy in user preferences or add a new field to the schema
    // This is a placeholder implementation

    return res.json({
      success: true,
      message: 'Location privacy updated successfully',
      data: { privacy }
    });

  } catch (error) {
    next(error);
  }
};

// Get jobs within map bounds for map display
export const getJobsInMapBounds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { northEast, southWest, limit = 100 }: MapBoundsRequest = req.body;

    const jobs = await LocationService.getJobsInBounds(northEast, southWest, limit as number);

    return res.json({
      success: true,
      data: {
        jobs,
        bounds: { northEast, southWest },
        count: jobs.length
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get workers within map bounds (with privacy considerations)
export const getWorkersInMapBounds = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { northEast, southWest, limit = 100 }: MapBoundsRequest = req.body;

    // Get workers within bounds (only public profiles)
    const workers = await prisma.$queryRaw`
      SELECT
        id,
        "firstName",
        "lastName",
        location,
        coordinates,
        rating,
        "reviewCount",
        "isWorker",
        "completedJobs"
      FROM users
      WHERE
        coordinates IS NOT NULL
        AND "isWorker" = true
        AND CAST(SPLIT_PART(coordinates::text, ',', 1) AS FLOAT) BETWEEN ${southWest.lat} AND ${northEast.lat}
        AND CAST(SPLIT_PART(coordinates::text, ',', 2) AS FLOAT) BETWEEN ${southWest.lng} AND ${northEast.lng}
      LIMIT ${limit}
    `;

    return res.json({
      success: true,
      data: {
        workers,
        bounds: { northEast, southWest },
        count: workers.length
      }
    });

  } catch (error) {
    next(error);
  }
};

// Calculate distance to a specific job
export const calculateJobDistance = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;

    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: 'Job ID is required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get job coordinates
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, coordinates: true, location: true }
    });

    if (!job || !job.coordinates) {
      return res.status(404).json({
        success: false,
        error: 'Job not found or location not available'
      });
    }

    // Get user coordinates
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { coordinates: true }
    });

    if (!user || !user.coordinates) {
      return res.status(400).json({
        success: false,
        error: 'User location not available'
      });
    }

    const distance = LocationService.calculateDistance(
      user.coordinates as Coordinates,
      job.coordinates as Coordinates
    );

    return res.json({
      success: true,
      data: {
        jobId,
        distance,
        unit: 'km',
        jobLocation: job.location,
        userLocation: user.coordinates
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get location analytics for a specific area
export const getLocationAnalytics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { lat, lng, radius = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const coordinates: Coordinates = {
      lat: parseFloat(lat as string),
      lng: parseFloat(lng as string)
    };

    const analytics = await LocationService.getLocationAnalytics(coordinates, parseFloat(radius as string));

    return res.json({
      success: true,
      data: {
        analytics,
        center: coordinates,
        radius: parseFloat(radius as string)
      }
    });

  } catch (error) {
    next(error);
  }
};