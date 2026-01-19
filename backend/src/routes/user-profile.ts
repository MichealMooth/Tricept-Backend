import { Router } from 'express';
import { isAuthenticated } from '@/middleware/auth.middleware';
import * as ctrl from '@/controllers/user-profile.controller';

const router: Router = Router();

router.get('/user/profile/:userId', isAuthenticated, ctrl.getProfile);
router.post('/user/profile', isAuthenticated, ctrl.createProfile);
router.put('/user/profile/:userId', isAuthenticated, ctrl.updateProfile);

export default router;
