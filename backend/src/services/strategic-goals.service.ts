import { prisma } from '@/config/database';

export type StrategicGoalInput = {
  key: string;
  title: string;
  description?: string | null;
  displayOrder?: number;
  isActive?: boolean;
};

export async function listGoals() {
  return prisma.strategicGoal.findMany({
    orderBy: [{ isActive: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
  });
}

export async function upsertGoalsFromJson(items: StrategicGoalInput[]) {
  const ops = items.map((it) =>
    prisma.strategicGoal.upsert({
      where: { key: it.key },
      create: {
        key: it.key,
        title: it.title,
        description: it.description ?? null,
        displayOrder: it.displayOrder ?? 0,
        isActive: it.isActive ?? true,
      },
      update: {
        title: it.title,
        description: it.description ?? null,
        displayOrder: it.displayOrder ?? 0,
        isActive: it.isActive ?? true,
      },
    })
  );
  await prisma.$transaction(ops);
  return listGoals();
}

export async function createGoal(input: StrategicGoalInput) {
  return prisma.strategicGoal.create({
    data: {
      key: input.key,
      title: input.title,
      description: input.description ?? null,
      displayOrder: input.displayOrder ?? 0,
      isActive: input.isActive ?? true,
    },
  });
}

export async function updateGoal(id: string, input: Partial<StrategicGoalInput>) {
  return prisma.strategicGoal.update({ where: { id }, data: { ...input } });
}

export async function deleteGoal(id: string) {
  await prisma.$transaction([
    prisma.strategicGoalRating.deleteMany({ where: { goalId: id } }),
    prisma.strategicGoal.delete({ where: { id } }),
  ]);
}

export async function listGoalsWithMyRatings(userId: string, year: number, month: number) {
  const [goals, ratings] = await Promise.all([
    prisma.strategicGoal.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    prisma.strategicGoalRating.findMany({ where: { userId, year, month } }),
  ]);
  const map = new Map(ratings.map((r) => [r.goalId, r]));
  return goals.map((g) => ({ goal: g, rating: map.get(g.id) || null }));
}

export async function upsertMyRating(params: {
  userId: string;
  goalId: string;
  year: number;
  month: number;
  rating: number;
  comment?: string | null;
}) {
  const { userId, goalId, year, month, rating, comment } = params;
  return prisma.strategicGoalRating.upsert({
    where: { goalId_userId_year_month: { goalId, userId, year, month } },
    create: { goalId, userId, year, month, rating, comment: comment ?? null },
    update: { rating, comment: comment ?? null },
  });
}

export async function listAverages(year: number, month: number) {
  const grouped = await prisma.strategicGoalRating.groupBy({
    by: ['goalId'],
    where: { year, month },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const map = new Map(
    grouped.map((g) => [g.goalId, { avg: g._avg.rating ?? null, count: g._count._all }])
  );
  // Ensure we return entries for all active goals (with null avg if no votes) to simplify FE rendering
  const goals = await prisma.strategicGoal.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  return goals.map((g) => ({
    goalId: g.id,
    ...(map.get(g.id) ?? { avg: null as number | null, count: 0 }),
  }));
}
