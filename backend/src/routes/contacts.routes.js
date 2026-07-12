import { Router } from 'express'
import { requireAuth, requireRole } from '../middleware/auth.js'
import { listMyContacts, createContact, deleteContact } from '../controllers/contacts.controller.js'

const router = Router()

// Los contactos de confianza son del usuario (rider) — a quienes les comparte
// su viaje en tiempo real mientras el conductor maneja su auto.
router.use(requireAuth, requireRole('usuario'))

router.get('/', listMyContacts)
router.post('/', createContact)
router.delete('/:id', deleteContact)

export default router
