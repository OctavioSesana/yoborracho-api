import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { getMyProfile, submitVerificationStep, setDisponibilidad } from '../controllers/drivers.controller.js'

const router = Router()

router.use(requireAuth, requireRole('conductor'))

router.get('/me', getMyProfile)
router.post('/verify', submitVerificationStep)
router.patch('/disponibilidad', setDisponibilidad)

export default router
