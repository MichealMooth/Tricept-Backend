import { Router } from 'express';
import { isAuthenticated, isAdmin } from '@/middleware/auth.middleware';
import * as ctrl from '@/controllers/strategic-goals.controller';

const router: Router = Router();

// Admin management
router.get('/strategic-goals', isAuthenticated, isAdmin, ctrl.listGoals);
router.post('/strategic-goals/import', isAuthenticated, isAdmin, ctrl.importGoals);
router.post('/strategic-goals', isAuthenticated, isAdmin, ctrl.createGoal);
router.put('/strategic-goals/:id', isAuthenticated, isAdmin, ctrl.updateGoal);
router.delete('/strategic-goals/:id', isAuthenticated, isAdmin, ctrl.deleteGoal);

// User ratings
router.get('/strategic-goals/with-my-ratings', isAuthenticated, ctrl.listGoalsWithMyRatings);
router.post('/strategic-goals/rate', isAuthenticated, ctrl.upsertMyRating);
router.get('/strategic-goals/averages', isAuthenticated, ctrl.listAverages);

export default router;
