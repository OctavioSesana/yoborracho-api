import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  createTrip,
  listTrips,
  listAvailableTrips,
  getTrip,
  acceptTrip,
  updateTripStatus,
  getTripLocations,
  postTripLocation,
  getPublicTrip,
} from '../controllers/trips.controller.js'
import { submitRating, getRating } from '../controllers/ratings.controller.js'

const router = Router()

// Sin autenticación — a propósito, antes del requireAuth de abajo. Es el link
// que se comparte por WhatsApp con contactos de confianza (ver "compartir viaje").
router.get('/:id/public', getPublicTrip)

router.use(requireAuth)

router.get('/available', listAvailableTrips)
router.get('/', listTrips)
router.post('/', createTrip)
router.get('/:id', getTrip)
router.patch('/:id/status', updateTripStatus)
router.post('/:id/accept', acceptTrip)
router.get('/:id/locations', getTripLocations)
router.post('/:id/locations', postTripLocation)
router.post('/:id/rating', submitRating)
router.get('/:id/rating', getRating)

export default router
