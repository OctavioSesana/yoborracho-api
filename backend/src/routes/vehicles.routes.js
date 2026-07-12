import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { listMyVehicles, createVehicle } from '../controllers/vehicles.controller.js'

const router = Router()

router.use(requireAuth, requireRole('usuario'))

router.get('/', listMyVehicles)
router.post('/', createVehicle)

export default router
