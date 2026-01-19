import { Router } from 'express';
import { isAuthenticated } from '@/middleware/auth.middleware';
import { getMatrix } from '@/controllers/matrix.controller';

const router: Router = Router();

router.get('/matrix', isAuthenticated, getMatrix);

export default router;
