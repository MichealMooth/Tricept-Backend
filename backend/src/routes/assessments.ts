import { Router } from 'express';
import { isAuthenticated } from '@/middleware/auth.middleware';
import {
  create,
  history,
  listForEmployee,
  peerAverage,
  trend,
} from '@/controllers/assessment.controller';

const router: Router = Router();

router.get('/assessments/employee/:employeeId', isAuthenticated, listForEmployee);
router.get('/assessments/history/:employeeId/:skillId', isAuthenticated, history);
router.get('/assessments/average/:employeeId/:skillId', isAuthenticated, peerAverage);
router.get('/assessments/trend/:employeeId/:skillId', isAuthenticated, trend);
router.post('/assessments', isAuthenticated, create);

export default router;
