import { prisma } from '@/config/database';

export type AssessmentSummary = {
  skill: { id: string; name: string; description: string | null };
  selfRating: { rating: number; comment: string | null } | null;
  peerRatings: Array<{
    assessor: { id: string; firstName: string; lastName: string; email: string };
    rating: number;
    comment: string | null;
  }>;
};

export async function getCurrentAssessments(
  employeeId: string,
  includeHistory = false
): Promise<AssessmentSummary[]> {
  // get all current (validTo IS NULL) assessments for employee grouped by skill
  const current = await prisma.skillAssessment.findMany({
    where: { employeeId, validTo: null },
    include: { skill: true, assessor: true },
    orderBy: [{ createdAt: 'desc' }],
  });

  const bySkill = new Map<string, AssessmentSummary>();
  for (const a of current) {
    const key = a.skillId;
    if (!bySkill.has(key)) {
      bySkill.set(key, {
        skill: { id: a.skill.id, name: a.skill.name, description: a.skill.description },
        selfRating: null,
        peerRatings: [],
      });
    }
    const entry = bySkill.get(key)!;
    if (a.assessmentType.toUpperCase() === 'SELF') {
      entry.selfRating = { rating: a.rating, comment: a.comment ?? null };
    } else {
      entry.peerRatings.push({
        assessor: a.assessor
          ? {
              id: a.assessor.id,
              firstName: a.assessor.firstName,
              lastName: a.assessor.lastName,
              email: a.assessor.email,
            }
          : { id: 'unknown', firstName: 'Unknown', lastName: '', email: '' },
        rating: a.rating,
        comment: a.comment ?? null,
      });
    }
  }

  const result = Array.from(bySkill.values());

  if (!includeHistory) return result;
  // If includeHistory requested, also attach historical ratings to peerRatings as extra entries? For simplicity, leave as current only per API contract.
  return result;
}

export async function createOrUpdateAssessment(data: {
  employeeId: string;
  skillId: string;
  assessmentType: 'SELF' | 'PEER';
  assessorId: string;
  rating: number;
  comment?: string | null;
}) {
  // Close existing current record (if any) for same keys
  const existing = await prisma.skillAssessment.findFirst({
    where: {
      employeeId: data.employeeId,
      skillId: data.skillId,
      assessmentType: data.assessmentType,
      assessorId: data.assessorId,
      validTo: null,
    },
  });
  if (existing) {
    await prisma.skillAssessment.update({
      where: { id: existing.id },
      data: { validTo: new Date() },
    });
  }
  // Create new row as current
  const created = await prisma.skillAssessment.create({
    data: {
      employeeId: data.employeeId,
      skillId: data.skillId,
      assessmentType: data.assessmentType,
      assessorId: data.assessorId,
      rating: data.rating,
      comment: data.comment ?? null,
      validFrom: new Date(),
      validTo: null,
    },
  });
  return created;
}

export async function getAssessmentHistory(employeeId: string, skillId: string) {
  return prisma.skillAssessment.findMany({
    where: { employeeId, skillId },
    orderBy: [{ validFrom: 'desc' }],
  });
}

export async function calculateAveragePeerRating(
  employeeId: string,
  skillId: string
): Promise<number | null> {
  const peers = await prisma.skillAssessment.findMany({
    where: { employeeId, skillId, assessmentType: 'PEER', validTo: null, rating: { gt: 0 } },
    select: { rating: true },
  });
  if (!peers.length) return null;
  const sum = peers.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / peers.length) * 100) / 100;
}

export type TrendPoint = { period: string; self?: number | null; peer?: number | null };

export async function getSkillDevelopmentTrend(
  employeeId: string,
  skillId: string,
  months: number
): Promise<TrendPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const rows = await prisma.skillAssessment.findMany({
    where: { employeeId, skillId, validFrom: { gte: since } },
    orderBy: [{ validFrom: 'asc' }],
    select: { assessmentType: true, rating: true, validFrom: true },
  });
  // group by YYYY-MM
  const map = new Map<string, { self: number[]; peer: number[] }>();
  const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  for (const r of rows) {
    const k = ym(r.validFrom);
    if (!map.has(k)) map.set(k, { self: [], peer: [] });
    if (r.assessmentType.toUpperCase() === 'SELF') map.get(k)!.self.push(r.rating);
    else map.get(k)!.peer.push(r.rating);
  }
  const points: TrendPoint[] = [];
  for (const [period, vals] of map.entries()) {
    const avg = (arr: number[]) =>
      arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    points.push({ period, self: avg(vals.self), peer: avg(vals.peer) });
  }
  // sort by period asc
  points.sort((a, b) => (a.period < b.period ? -1 : 1));
  return points;
}
