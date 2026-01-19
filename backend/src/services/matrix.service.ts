import { prisma } from '@/config/database';

export type MatrixEmployee = {
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
};
export type MatrixSkill = { id: string; name: string; categoryName: string | null };
export type MatrixCell = {
  employeeId: string;
  skillId: string;
  selfRating: number | null;
  avgPeerRating: number | null;
  peerCount: number;
  lastUpdated: Date | null;
};
export type MatrixData = { employees: MatrixEmployee[]; skills: MatrixSkill[]; data: MatrixCell[] };

export type MatrixFilters = {
  categoryId?: string;
  employeeIds?: string[];
  skillIds?: string[];
};

export async function getMatrixData(filters: MatrixFilters): Promise<MatrixData> {
  const employees = await prisma.employee.findMany({
    where: {
      isActive: true,
      id:
        filters.employeeIds && filters.employeeIds.length ? { in: filters.employeeIds } : undefined,
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    select: { id: true, firstName: true, lastName: true, role: true },
  });

  const skills = await prisma.skill.findMany({
    where: {
      isActive: true,
      id: filters.skillIds && filters.skillIds.length ? { in: filters.skillIds } : undefined,
      categoryId: filters.categoryId ?? undefined,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    include: { category: true },
  });

  const employeeIds = employees.map((e) => e.id);
  const skillIds = skills.map((s) => s.id);

  if (employeeIds.length === 0 || skillIds.length === 0) {
    return {
      employees,
      skills: skills.map((s) => ({
        id: s.id,
        name: s.name,
        categoryName: s.category?.name ?? null,
      })),
      data: [],
    };
  }

  const current = await prisma.skillAssessment.findMany({
    where: {
      employeeId: { in: employeeIds },
      skillId: { in: skillIds },
      validTo: null,
    },
    select: {
      employeeId: true,
      skillId: true,
      assessmentType: true,
      rating: true,
      comment: true,
      validFrom: true,
    },
  });

  // Build maps for quick lookup
  const selfMap = new Map<string, { rating: number; validFrom: Date }>(); // key: emp|skill
  const peerMap = new Map<string, { sum: number; count: number; last: Date | null }>();

  for (const a of current) {
    const key = `${a.employeeId}|${a.skillId}`;
    if (a.assessmentType.toUpperCase() === 'SELF') {
      // one current self per cell expected
      selfMap.set(key, { rating: a.rating, validFrom: a.validFrom });
    } else {
      const prev = peerMap.get(key) ?? { sum: 0, count: 0, last: null };
      const last = !prev.last || a.validFrom > prev.last ? a.validFrom : prev.last;
      peerMap.set(key, { sum: prev.sum + a.rating, count: prev.count + 1, last });
    }
  }

  const data: MatrixCell[] = [];
  for (const e of employees) {
    for (const s of skills) {
      const key = `${e.id}|${s.id}`;
      const self = selfMap.get(key) || null;
      const peer = peerMap.get(key) || { sum: 0, count: 0, last: null };
      const avg = peer.count ? Math.round((peer.sum / peer.count) * 100) / 100 : null;
      const lastUpdated = self?.validFrom || peer.last || null;
      data.push({
        employeeId: e.id,
        skillId: s.id,
        selfRating: self?.rating ?? null,
        avgPeerRating: avg,
        peerCount: peer.count,
        lastUpdated,
      });
    }
  }

  return {
    employees: employees.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      lastName: e.lastName,
      role: e.role,
    })),
    skills: skills.map((s) => ({ id: s.id, name: s.name, categoryName: s.category?.name ?? null })),
    data,
  };
}

export function calculateCellColor(rating: number | null): string {
  if (rating == null) return '#f3f4f6'; // gray-100
  if (rating <= 2) return '#ff6b6b';
  if (rating <= 4) return '#ffa500';
  if (rating <= 6) return '#ffd700';
  if (rating <= 8) return '#90ee90';
  return '#17f0f0';
}

export async function getSkillAverages(categoryId?: string) {
  // average peer ratings per skill
  const skills = await prisma.skill.findMany({
    where: { isActive: true, categoryId: categoryId ?? undefined },
    select: { id: true },
  });
  if (!skills.length) return [] as { skillId: string; avg: number | null }[];
  const rows = await prisma.skillAssessment.findMany({
    where: { skillId: { in: skills.map((s) => s.id) }, assessmentType: 'PEER', validTo: null },
    select: { skillId: true, rating: true },
  });
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const prev = map.get(r.skillId) ?? { sum: 0, count: 0 };
    map.set(r.skillId, { sum: prev.sum + r.rating, count: prev.count + 1 });
  }
  return Array.from(map.entries()).map(([skillId, v]) => ({
    skillId,
    avg: v.count ? Math.round((v.sum / v.count) * 100) / 100 : null,
  }));
}
