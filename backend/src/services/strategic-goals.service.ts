/**
 * Strategic Goals Service
 *
 * Provides business logic for StrategicGoal and StrategicGoalRating operations.
 * Supports GLOBAL and TEAM scope filtering for data access control.
 *
 * Task Group 5.3: Update StrategicGoalService for scope handling
 */

import { prisma } from '@/config/database';
import { getUserTeamGroupIds } from '@/services/team-membership.service';

/**
 * Input type for creating/updating strategic goals.
 * Extended with scope fields for Task Group 5.
 */
export type StrategicGoalInput = {
  key: string;
  title: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
  scope?: 'GLOBAL' | 'TEAM';
  teamGroupId?: string | null;
};

/**
 * Options for listing goals with scope filtering.
 */
export interface ListGoalsOptions {
  /** User ID for filtering TEAM-scoped goals by membership */
  userId?: string;
  /** Filter to specific scope */
  scope?: 'GLOBAL' | 'TEAM';
  /** Filter to specific team group */
  teamGroupId?: string;
  /** Only return active goals */
  activeOnly?: boolean;
}

/**
 * List all goals (admin view).
 * Returns all goals regardless of scope - for admin management.
 */
export async function listGoals(): Promise<
  Array<{
    id: string;
    key: string;
    title: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    scope: string;
    teamGroupId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  return prisma.strategicGoal.findMany({
    orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

/**
 * List goals with scope-based filtering.
 * Pattern: WHERE (scope=GLOBAL) OR (scope=TEAM AND teamGroupId IN userTeamIds)
 *
 * @param options - Filtering options including userId for team membership
 */
export async function listGoalsWithScopeFilter(options: ListGoalsOptions = {}): Promise<
  Array<{
    id: string;
    key: string;
    title: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    scope: string;
    teamGroupId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const { userId, scope, teamGroupId, activeOnly } = options;

  // Build the where clause
  const whereConditions: Array<Record<string, unknown>> = [];

  // If user is provided, filter by scope and team membership
  if (userId) {
    // Get user's team group IDs
    const userTeamIds = await getUserTeamGroupIds(userId);

    // Build scope filter: GLOBAL OR (TEAM AND member of that team)
    if (scope === 'GLOBAL') {
      whereConditions.push({ scope: 'GLOBAL' });
    } else if (scope === 'TEAM') {
      // Only TEAM-scoped goals where user is a member
      if (teamGroupId) {
        // Specific team
        if (userTeamIds.includes(teamGroupId)) {
          whereConditions.push({ scope: 'TEAM', teamGroupId });
        }
        // If user is not a member of the specified team, no goals match
      } else {
        // All teams user is a member of
        if (userTeamIds.length > 0) {
          whereConditions.push({ scope: 'TEAM', teamGroupId: { in: userTeamIds } });
        }
      }
    } else {
      // No specific scope filter - return GLOBAL + user's TEAM goals
      whereConditions.push({ scope: 'GLOBAL' });
      if (userTeamIds.length > 0) {
        whereConditions.push({ scope: 'TEAM', teamGroupId: { in: userTeamIds } });
      }
    }
  } else {
    // No user context - apply direct filters
    if (scope) {
      if (teamGroupId) {
        whereConditions.push({ scope, teamGroupId });
      } else {
        whereConditions.push({ scope });
      }
    } else if (teamGroupId) {
      whereConditions.push({ teamGroupId });
    }
    // If no filters at all, return all (will be handled below)
  }

  // Build final where clause
  const where: Record<string, unknown> = {};

  if (whereConditions.length > 0) {
    where.OR = whereConditions;
  }

  if (activeOnly) {
    where.isActive = true;
  }

  return prisma.strategicGoal.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

/**
 * Upsert goals from JSON import.
 * Supports scope fields in imported data.
 */
export async function upsertGoalsFromJson(
  items: Array<StrategicGoalInput>
): Promise<
  Array<{
    id: string;
    key: string;
    title: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    scope: string;
    teamGroupId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>
> {
  const ops = items.map((it) =>
    prisma.strategicGoal.upsert({
      where: { key: it.key },
      create: {
        key: it.key,
        title: it.title,
        description: it.description ?? null,
        displayOrder: it.displayOrder ?? 0,
        isActive: it.isActive ?? true,
        scope: it.scope ?? 'GLOBAL',
        teamGroupId: it.teamGroupId ?? null,
      },
      update: {
        title: it.title,
        description: it.description ?? null,
        displayOrder: it.displayOrder ?? 0,
        isActive: it.isActive ?? true,
        scope: it.scope ?? 'GLOBAL',
        teamGroupId: it.teamGroupId ?? null,
      },
    })
  );
  await prisma.$transaction(ops);
  return listGoals();
}

/**
 * Create a new strategic goal with scope support.
 */
export async function createGoal(input: StrategicGoalInput): Promise<{
  id: string;
  key: string;
  title: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  scope: string;
  teamGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  return prisma.strategicGoal.create({
    data: {
      key: input.key,
      title: input.title,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
      scope: input.scope ?? 'GLOBAL',
      teamGroupId: input.teamGroupId ?? null,
    },
  });
}

/**
 * Update an existing strategic goal.
 * Supports partial updates including scope changes.
 */
export async function updateGoal(
  id: string,
  input: Partial<StrategicGoalInput>
): Promise<{
  id: string;
  key: string;
  title: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  scope: string;
  teamGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  return prisma.strategicGoal.update({ where: { id }, data: { ...input } });
}

/**
 * Get a strategic goal by ID.
 */
export async function getGoalById(id: string): Promise<{
  id: string;
  key: string;
  title: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  scope: string;
  teamGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
} | null> {
  return prisma.strategicGoal.findUnique({ where: { id } });
}

/**
 * Delete a strategic goal and its associated ratings.
 */
export async function deleteGoal(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.strategicGoalRating.deleteMany({ where: { goalId: id } }),
    prisma.strategicGoal.delete({ where: { id } }),
  ]);
}

/**
 * List goals with the current user's ratings.
 * Filters goals by scope based on user's team memberships.
 *
 * @param userId - The user requesting the goals
 * @param year - Year for rating lookup
 * @param month - Month for rating lookup (1-12)
 */
export async function listGoalsWithMyRatings(
  userId: string,
  year: number,
  month: number
): Promise<
  Array<{
    goal: {
      id: string;
      key: string;
      title: string;
      description: string | null;
      displayOrder: number;
      isActive: boolean;
      scope: string;
      teamGroupId: string | null;
      createdAt: Date;
      updatedAt: Date;
    };
    rating: {
      id: string;
      goalId: string;
      userId: string;
      year: number;
      month: number;
      rating: number;
      comment: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
  }>
> {
  // Get goals filtered by scope and user's team memberships
  const goals = await listGoalsWithScopeFilter({
    userId,
    activeOnly: true,
  });

  // Get user's ratings for this period
  const ratings = await prisma.strategicGoalRating.findMany({
    where: { userId, year, month },
  });

  // Map ratings to goals
  const ratingMap = new Map(ratings.map((r) => [r.goalId, r]));

  return goals.map((g) => ({
    goal: g,
    rating: ratingMap.get(g.id) || null,
  }));
}

/**
 * Upsert a user's rating for a strategic goal.
 * Ratings are user-scoped (owner-only access pattern).
 */
export async function upsertMyRating(params: {
  userId: string;
  goalId: string;
  year: number;
  month: number;
  rating: number;
  comment?: string | null;
}): Promise<{
  id: string;
  goalId: string;
  userId: string;
  year: number;
  month: number;
  rating: number;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  const { userId, goalId, year, month, rating, comment } = params;
  return prisma.strategicGoalRating.upsert({
    where: { goalId_userId_year_month: { goalId, userId, year, month } },
    create: { goalId, userId, year, month, rating, comment: comment ?? null },
    update: { rating, comment: comment ?? null },
  });
}

/**
 * List average ratings for all active goals in a given period.
 * Includes scope filtering based on user's team memberships.
 *
 * @param year - Year for rating lookup
 * @param month - Month for rating lookup (1-12)
 * @param userId - Optional user ID for scope filtering
 */
export async function listAverages(
  year: number,
  month: number,
  userId?: string
): Promise<
  Array<{
    goalId: string;
    avg: number | null;
    count: number;
  }>
> {
  // Get goals based on scope filtering
  const goals = userId
    ? await listGoalsWithScopeFilter({ userId, activeOnly: true })
    : await prisma.strategicGoal.findMany({
        where: { isActive: true },
        select: { id: true },
      });

  const goalIds = goals.map((g) => g.id);

  // Get aggregated ratings for these goals
  const grouped = await prisma.strategicGoalRating.groupBy({
    by: ['goalId'],
    where: {
      year,
      month,
      goalId: { in: goalIds },
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  const map = new Map(
    grouped.map((g) => [g.goalId, { avg: g._avg.rating ?? null, count: g._count._all }])
  );

  // Ensure we return entries for all filtered goals (with null avg if no votes)
  return goalIds.map((id) => ({
    goalId: id,
    ...(map.get(id) ?? { avg: null as number | null, count: 0 }),
  }));
}

/**
 * Check if a user can access a specific goal based on scope.
 *
 * @param goalId - The goal ID to check
 * @param userId - The user ID requesting access
 * @returns true if user can access the goal, false otherwise
 */
export async function canUserAccessGoal(goalId: string, userId: string): Promise<boolean> {
  const goal = await prisma.strategicGoal.findUnique({
    where: { id: goalId },
    select: { scope: true, teamGroupId: true },
  });

  if (!goal) {
    return false;
  }

  // GLOBAL goals are accessible to all authenticated users
  if (goal.scope === 'GLOBAL') {
    return true;
  }

  // TEAM goals require membership
  if (goal.scope === 'TEAM' && goal.teamGroupId) {
    const userTeamIds = await getUserTeamGroupIds(userId);
    return userTeamIds.includes(goal.teamGroupId);
  }

  return false;
}
