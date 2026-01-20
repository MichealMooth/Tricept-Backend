/**
 * Strategic Goals Controller
 *
 * Handles HTTP requests for StrategicGoal and StrategicGoalRating endpoints.
 * Supports GLOBAL and TEAM scope with proper validation and authorization.
 *
 * Task Group 5.4: Update StrategicGoalController
 */

import { Request, Response } from 'express';
import * as svc from '@/services/strategic-goals.service';
import {
  CreateStrategicGoalSchema,
  UpdateStrategicGoalSchema,
  StrategicGoalRatingSchema,
} from '@/validators/strategic-goal.validator';
import { AuthenticatedUser } from '@/types/authorization';

/**
 * List all goals (admin view).
 * GET /api/strategic-goals
 */
export async function listGoals(req: Request, res: Response): Promise<void> {
  const items = await svc.listGoals();
  res.json(items);
  return;
}

/**
 * List average ratings for goals.
 * GET /api/strategic-goals/averages
 */
export async function listAverages(req: Request, res: Response): Promise<void> {
  const now = new Date();
  const year = Number(req.query.year ?? now.getFullYear());
  const month = Number(req.query.month ?? now.getMonth() + 1);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400).json({ message: 'Invalid year/month' });
    return;
  }

  // Get user context for scope filtering
  const user = (req as any).user as AuthenticatedUser | undefined;
  const userId = user?.id;

  const rows = await svc.listAverages(year, month, userId);
  res.json({ year, month, items: rows });
  return;
}

/**
 * Import goals from JSON.
 * POST /api/strategic-goals/import
 */
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
    scope: x.scope === 'TEAM' ? 'TEAM' : 'GLOBAL',
    teamGroupId: x.teamGroupId ? String(x.teamGroupId) : null,
  }));

  // Validate TEAM scope items have teamGroupId
  const invalidTeamItems = normalized.filter((n) => n.scope === 'TEAM' && !n.teamGroupId);
  if (invalidTeamItems.length > 0) {
    res.status(400).json({
      message: 'teamGroupId is required for TEAM-scoped goals',
      invalidKeys: invalidTeamItems.map((i) => i.key),
    });
    return;
  }

  const items = await svc.upsertGoalsFromJson(
    normalized as Array<svc.StrategicGoalInput>
  );
  res.json(items);
  return;
}

/**
 * Create a new strategic goal.
 * POST /api/strategic-goals
 */
export async function createGoal(req: Request, res: Response): Promise<void> {
  // Validate request body
  const parseResult = CreateStrategicGoalSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parseResult.error.errors,
    });
    return;
  }

  const input = parseResult.data;

  // Create the goal
  const item = await svc.createGoal({
    key: input.key,
    title: input.title,
    description: input.description,
    displayOrder: input.displayOrder,
    isActive: input.isActive,
    scope: input.scope as 'GLOBAL' | 'TEAM',
    teamGroupId: input.teamGroupId,
  });

  res.status(201).json(item);
  return;
}

/**
 * Update an existing strategic goal.
 * PUT /api/strategic-goals/:id
 */
export async function updateGoal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Validate request body
  const parseResult = UpdateStrategicGoalSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parseResult.error.errors,
    });
    return;
  }

  const input = parseResult.data;

  // Get existing goal to check scope change rules
  const existingGoal = await svc.getGoalById(id);
  if (!existingGoal) {
    res.status(404).json({ message: 'Strategic goal not found' });
    return;
  }

  // If changing from GLOBAL to TEAM, ensure teamGroupId is provided
  if (
    input.scope === 'TEAM' &&
    existingGoal.scope === 'GLOBAL' &&
    !input.teamGroupId
  ) {
    res.status(400).json({
      message: 'teamGroupId is required when changing scope to TEAM',
    });
    return;
  }

  // Build update data, ensuring GLOBAL scope clears teamGroupId
  const updateData: Partial<svc.StrategicGoalInput> = { ...input };
  if (input.scope === 'GLOBAL') {
    updateData.teamGroupId = null;
  }

  const item = await svc.updateGoal(id, updateData as Partial<svc.StrategicGoalInput>);
  res.json(item);
  return;
}

/**
 * Delete a strategic goal.
 * DELETE /api/strategic-goals/:id
 */
export async function deleteGoal(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Check if goal exists
  const existingGoal = await svc.getGoalById(id);
  if (!existingGoal) {
    res.status(404).json({ message: 'Strategic goal not found' });
    return;
  }

  await svc.deleteGoal(id);
  res.status(204).end();
  return;
}

/**
 * List goals with the current user's ratings.
 * GET /api/strategic-goals/with-my-ratings
 * Filters goals by scope based on user's team memberships.
 */
export async function listGoalsWithMyRatings(req: Request, res: Response): Promise<void> {
  // Get user from session or query parameter
  const user = (req as any).user as AuthenticatedUser | undefined;
  const userId = user?.id || String(req.query.userId || '');

  if (!userId) {
    res.status(400).json({ message: 'userId required' });
    return;
  }

  const now = new Date();
  const year = Number(req.query.year ?? now.getFullYear());
  const month = Number(req.query.month ?? now.getMonth() + 1);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    res.status(400).json({ message: 'Invalid year/month' });
    return;
  }

  const items = await svc.listGoalsWithMyRatings(userId, year, month);
  res.json({ year, month, items });
  return;
}

/**
 * Upsert a user's rating for a strategic goal.
 * POST /api/strategic-goals/rate
 */
export async function upsertMyRating(req: Request, res: Response): Promise<void> {
  // Get user from session or request body
  const user = (req as any).user as AuthenticatedUser | undefined;
  const userId = user?.id || String(req.body.userId || '');

  if (!userId) {
    res.status(400).json({ message: 'userId required' });
    return;
  }

  // Validate request body using Zod schema
  const parseResult = StrategicGoalRatingSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      message: 'Validation error',
      errors: parseResult.error.errors,
    });
    return;
  }

  const { goalId, rating, comment } = parseResult.data;
  const now = new Date();
  const year = parseResult.data.year ?? now.getFullYear();
  const month = parseResult.data.month ?? now.getMonth() + 1;

  // Check if user can access this goal based on scope
  const canAccess = await svc.canUserAccessGoal(goalId, userId);
  if (!canAccess) {
    res.status(403).json({
      message: 'Forbidden: You do not have access to rate this goal',
    });
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

/**
 * Get a single strategic goal by ID.
 * GET /api/strategic-goals/:id
 */
export async function getGoalById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const goal = await svc.getGoalById(id);
  if (!goal) {
    res.status(404).json({ message: 'Strategic goal not found' });
    return;
  }

  // For TEAM-scoped goals, check if user has access
  if (goal.scope === 'TEAM') {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (user && !user.isAdmin) {
      const canAccess = await svc.canUserAccessGoal(id, user.id);
      if (!canAccess) {
        res.status(403).json({
          message: 'Forbidden: You do not have access to this team goal',
        });
        return;
      }
    }
  }

  res.json(goal);
  return;
}
