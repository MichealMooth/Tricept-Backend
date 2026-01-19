import { Request, Response } from 'express';
import {
  getUserYearCapacities,
  upsertUserMonthCapacity,
  getOverviewByYear,
  type Allocation,
} from '@/services/capacity.service';

const isAdminUser = (req: Request) => Boolean((req as any).user?.isAdmin);
const currentUserId = (req: Request) => String((req as any).user?.id || '');

// GET /capacities/:userId/:year
export async function getCapacitiesForUserYear(req: Request, res: Response) {
  const { userId, year } = req.params as { userId: string; year: string };

  // Only admins may query other users. Non-admins can only query their own id.
  if (!isAdminUser(req) && userId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2300)
    return res.status(400).json({ message: 'Invalid year' });

  const rows = await getUserYearCapacities(userId, y);
  return res.json(rows);
}

// POST /capacities/:userId/:year/:month
export async function upsertCapacityForUserMonth(req: Request, res: Response) {
  const { userId, year, month } = req.params as { userId: string; year: string; month: string };
  if (!isAdminUser(req) && userId !== currentUserId(req)) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const y = Number(year);
  const m = Number(month);
  if (!Number.isInteger(y) || y < 2000 || y > 2300)
    return res.status(400).json({ message: 'Invalid year' });
  if (!Number.isInteger(m) || m < 1 || m > 12)
    return res.status(400).json({ message: 'Invalid month' });

  const body = req.body || {};
  const allocations = Array.isArray(body.allocations) ? (body.allocations as Allocation[]) : [];
  const totalPercent = Number(body.total_percent ?? body.totalPercent);
  if (!Number.isFinite(totalPercent) || totalPercent < 0 || totalPercent > 100) {
    return res.status(400).json({ message: 'Invalid total_percent' });
  }

  // Basic sanity for allocations
  const normalized: Allocation[] = allocations
    .filter((a) => a && typeof a === 'object')
    .map((a) => ({ project_name: a.project_name, percent: Number(a.percent) || 0 }));

  const saved = await upsertUserMonthCapacity({
    userId,
    year: y,
    month: m,
    allocations: normalized,
    totalPercent,
  });
  return res.json(saved);
}

// GET /capacities/overview/:year (read-only, all authenticated users allowed)
export async function getCapacitiesOverview(req: Request, res: Response) {
  const { year } = req.params as { year: string };
  const y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2300)
    return res.status(400).json({ message: 'Invalid year' });
  const start = Date.now();
  // Simple timing log to diagnose timeouts in FE
  console.log(`[capacities] overview start year=${y}`);
  try {
    const data = await getOverviewByYear(y);
    const ms = Date.now() - start;
    console.log(`[capacities] overview done year=${y} in ${ms}ms rows=${data.length}`);
    return res.json(data);
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`[capacities] overview error after ${ms}ms`, err);
    return res.status(500).json({ message: 'Overview failed' });
  }
}
