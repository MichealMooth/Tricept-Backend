import { Router } from 'express';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';
import {
  deleteEmployee,
  getEmployees,
  postEmployee,
  putEmployee,
} from '@/controllers/employee.controller';

const router: Router = Router();

router.get('/employees', isAuthenticated, isAdmin, getEmployees);
router.post('/employees', isAuthenticated, isAdmin, postEmployee);
router.put('/employees/:id', isAuthenticated, isAdmin, putEmployee);
router.delete('/employees/:id', isAuthenticated, isAdmin, deleteEmployee);

export default router;
