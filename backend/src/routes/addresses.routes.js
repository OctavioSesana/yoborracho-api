import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { listMyAddresses, createAddress, deleteAddress } from '../controllers/addresses.controller.js'

const router = Router()

// Las direcciones frecuentes son del usuario (rider) — es su auto el que se maneja
// hasta esos destinos, no tiene sentido para conductores.
router.use(requireAuth, requireRole('usuario'))

router.get('/', listMyAddresses)
router.post('/', createAddress)
router.delete('/:id', deleteAddress)

export default router
