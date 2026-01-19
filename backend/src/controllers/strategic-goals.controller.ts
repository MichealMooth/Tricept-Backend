import { Request, Response } from 'express';
import { z } from 'zod';
import * as svc from '@/services/strategic-goals.service';

// Zod schema for rating validation (matches database CHECK constraint 1-5)
const ratingSchema = z.object({
  goalId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().nullable(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export async function listGoals(_req: Request, res: Response): Promise<void> {
  const items = await svc.listGoals();
  res.json(items);
  return;
}

export async function listAverages(req: Request, res: Response): Promise<void> {
  const now = new Date();
  const year = Number(req.query.year ?? now.getFullYear());
  const month = Number(req.query.month ?? now.getMonth() + 1);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400).json({ message: 'Invalid year/month' });
    return;
  }
  const rows = await svc.listAverages(year, month);
  res.json({ year, month, items: rows });
  return;
}

export async function importGoals(req: Request, res: Response): Promise<void> {
  const payload = req.body;
  if (!Array.isArray(payload)) {
    res.status(400).json({ message: 'Expected JSON array' });
    return;
  }
  const normalized = payload.map((x) => ({
    key: String(x.key),
    title: String(x.title),
    description: x.description ? String(x.description) : null,
    displayOrder: typeof x.displayOrder === 'number' ? x.displayOrder : 0,
    isActive: x.isActive !== false,
  }));
  const items = await svc.upsertGoalsFromJson(normalized);
  res.json(items);
  return;
}

export async function createGoal(req: Request, res: Response): Promise<void> {
  const item = await svc.createGoal(req.body);
  res.status(201).json(item);
  return;
}

export async function updateGoal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const item = await svc.updateGoal(id, req.body);
  res.json(item);
  return;
}

export async function deleteGoal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  await svc.deleteGoal(id);
  res.status(204).end();
  return;
}

export async function listGoalsWithMyRatings(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id || String(req.query.userId || '');
  const now = new Date();
  const year = Number(req.query.year ?? now.getFullYear());
  const month = Number(req.query.month ?? now.getMonth() + 1);
  if (!userId) {
    res.status(400).json({ message: 'userId required' });
    return;
  }
  const items = await svc.listGoalsWithMyRatings(userId, year, month);
  res.json({ year, month, items });
  return;
}

export async function upsertMyRating(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id || String(req.body.userId || '');
  const now = new Date();

  // Validate request body using Zod schema
  const parseResult = ratingSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ message: 'Validation error', errors: parseResult.error.errors });
    return;
  }

  const { goalId, rating, comment } = parseResult.data;
  const year = parseResult.data.year ?? now.getFullYear();
  const month = parseResult.data.month ?? now.getMonth() + 1;

  if (!userId) {
    res.status(400).json({ message: 'userId required' });
    return;
  }

  const saved = await svc.upsertMyRating({
    userId,
    goalId,
    year,
    month,
    rating,
    comment,
  });
  res.json(saved);
  return;
}
