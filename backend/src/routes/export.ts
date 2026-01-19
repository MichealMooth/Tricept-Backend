import { Router } from 'express';
import { isAuthenticated } from '@/middleware/auth.middleware';
import { exportExcel } from '@/controllers/export.controller';

const router: Router = Router();

router.post('/export/excel', isAuthenticated, exportExcel);

export default router;
