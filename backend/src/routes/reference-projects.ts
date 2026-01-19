import { Router } from 'express'
import * as ctrl from '@/controllers/reference-projects.controller'
import { isAuthenticated } from '@/middleware/auth.middleware'

const router: Router = Router()

// Permissions: all authenticated users can read/create/update
router.get('/reference-projects', isAuthenticated, ctrl.list)
router.get('/reference-projects/:id', isAuthenticated, ctrl.getOne)
router.post('/reference-projects', isAuthenticated, ctrl.create)
router.put('/reference-projects/:id', isAuthenticated, ctrl.update)
router.delete('/reference-projects/:id', isAuthenticated, ctrl.remove)
router.post('/reference-projects/import', isAuthenticated, ctrl.importExcel)

export default router
