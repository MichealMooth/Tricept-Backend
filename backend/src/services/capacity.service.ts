import { prisma } from '@/config/database';

export type Allocation = { project_name?: string; percent: number };

export async function getUserYearCapacities(userId: string, year: number) {
  const rows = await prisma.userCapacity.findMany({
    where: { userId, year },
    orderBy: { month: 'asc' },
  });
  return rows.map((r) => ({
    ...r,
    // parse JSON string to array for API consumers
    allocations: safeParseAlloc(r.allocations),
  }));
}

export async function upsertUserMonthCapacity(params: {
  userId: string;
  year: number;
  month: number;
  allocations: Allocation[];
  totalPercent: number;
}) {
  const { userId, year, month, allocations, totalPercent } = params;
  return prisma.userCapacity
    .upsert({
      where: { userId_year_month: { userId, year, month } },
      update: { allocations: JSON.stringify(allocations ?? []), totalPercent },
      create: { userId, year, month, allocations: JSON.stringify(allocations ?? []), totalPercent },
    })
    .then((r) => ({ ...r, allocations: safeParseAlloc(r.allocations) }));
}

export async function getOverviewByYear(year: number) {
  // Return for each user the 12 months with totalPercent. If a month is missing, return null.
  const capacities = await prisma.userCapacity.findMany({ where: { year } });
  const users = await prisma.employee.findMany({
    select: { id: true, firstName: true, lastName: true, isActive: true },
  });
  const byUser: Record<string, { [month: number]: number | null }> = {};
  for (const u of users) {
    byUser[u.id] = {};
    for (let m = 1; m <= 12; m++) byUser[u.id][m] = null;
  }
  for (const c of capacities) {
    if (!byUser[c.userId]) byUser[c.userId] = {};
    byUser[c.userId][c.month] = c.totalPercent;
  }
  return users.map((u) => ({
    userId: u.id,
    name: `${u.lastName}, ${u.firstName}`,
    isActive: u.isActive,
    months: Array.from({ length: 12 }, (_, i) => byUser[u.id]?.[i + 1] ?? null),
  }));
}

function safeParseAlloc(json: string): Allocation[] {
  try {
    const v = JSON.parse(json);
    if (Array.isArray(v)) return v as Allocation[];
    return [];
  } catch {
    return [];
  }
}
