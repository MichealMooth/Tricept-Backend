import { Router } from 'express';
import { isAuthenticated } from '@/middleware/auth.middleware';
import {
  getCapacitiesForUserYear,
  upsertCapacityForUserMonth,
  getCapacitiesOverview,
} from '@/controllers/capacity.controller';

const router: Router = Router();

router.get('/capacities/overview/:year', getCapacitiesOverview);
router.get('/capacities/:userId/:year', isAuthenticated, getCapacitiesForUserYear);
router.post('/capacities/:userId/:year/:month', isAuthenticated, upsertCapacityForUserMonth);

export default router;
