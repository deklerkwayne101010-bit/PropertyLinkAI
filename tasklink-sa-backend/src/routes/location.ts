import { Router } from 'express';
import {
  geocodeAddress,
  reverseGeocode,
  getAddressSuggestions,
  validateAddress,
  findNearbyJobs,
  findNearbyWorkers,
  updateUserLocation,
  getUserLocation,
  updateLocationPrivacy,
  getJobsInMapBounds,
  getWorkersInMapBounds,
  calculateJobDistance,
  getLocationAnalytics,
  geocodeValidation,
  reverseGeocodeValidation,
  locationSearchValidation,
  addressValidation,
  userLocationUpdateValidation,
  mapBoundsValidation,
} from '../controllers/location';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Geocoding & Location Services (public routes)
router.post('/geocode', geocodeValidation, geocodeAddress);
router.post('/reverse-geocode', reverseGeocodeValidation, reverseGeocode);
router.get('/suggestions', getAddressSuggestions);
router.post('/validate', addressValidation, validateAddress);

// Location-based Job Search (requires authentication)
router.use(authenticateToken);

router.get('/jobs/nearby', locationSearchValidation, findNearbyJobs);
router.get('/jobs/distance/:jobId', calculateJobDistance);

// User Location Management
router.post('/users/location', userLocationUpdateValidation, updateUserLocation);
router.get('/users/location', getUserLocation);
router.put('/users/location-privacy', updateLocationPrivacy);

// Find nearby workers (clients only)
router.get('/users/nearby-workers', locationSearchValidation, findNearbyWorkers);

// Map Integration
router.post('/map/jobs', mapBoundsValidation, getJobsInMapBounds);
router.post('/map/workers', mapBoundsValidation, getWorkersInMapBounds);

// Location Analytics
router.get('/analytics', getLocationAnalytics);

export default router;