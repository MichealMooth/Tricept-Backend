import { Router } from 'express';
import { listTables, getTableInfo, getTableRows } from '@/controllers/db-admin.controller';

const router: Router = Router();

router.get('/admin/db/tables', listTables);
router.get('/admin/db/table/:table/info', getTableInfo);
router.get('/admin/db/table/:table/rows', getTableRows);

export default router;
