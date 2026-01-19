import { Router } from 'express';
import { prisma } from '@/config/database';

const router: Router = Router();

router.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(500).json({ status: 'degraded', db: 'disconnected' });
  }
});

export default router;
