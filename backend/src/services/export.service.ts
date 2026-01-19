// @ts-nocheck
import * as XLSX from 'xlsx';
import { getMatrixData, type MatrixData } from '@/services/matrix.service';
import { prisma } from '@/config/database';

export type ExportFilters = { categoryId?: string; employeeIds?: string[]; skillIds?: string[] };
export type ExportOptions = { includeComments: boolean };

export async function buildMatrixBuffer(
  filters: ExportFilters,
  options: ExportOptions
): Promise<Buffer> {
  const matrix = await getMatrixData(filters);
  const wb = XLSX.utils.book_new();

  createMatrixSheet(wb, matrix);
  await createDetailSheet(wb, filters, options);
  await createStatisticsSheet(wb, filters);

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
  return buf;
}

// Build the main matrix sheet with styled headers, frozen panes and color-coded cells
export function createMatrixSheet(wb: XLSX.WorkBook, matrix: MatrixData) {
  const header = ['Mitarbeiter', ...matrix.skills.map((s) => s.name)];
  const rows: any[][] = [];
  for (const e of matrix.employees) {
    const row: any[] = [`${e.lastName}, ${e.firstName}`];
    for (const s of matrix.skills) {
      const cell = matrix.data.find((c) => c.employeeId === e.id && c.skillId === s.id);
      row.push(cell?.selfRating ?? '');
    }
    rows.push(row);
  }
  const aoa = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  (ws as any)['!freeze'] = { xSplit: 1, ySplit: 1 };
  (ws as any)['!cols'] = [{ wch: 26 }, ...matrix.skills.map(() => ({ wch: 10 }))];

  const cellMap = new Map<string, { self: number | null }>();
  for (const c of matrix.data) cellMap.set(`${c.employeeId}|${c.skillId}`, { self: c.selfRating });

  const headerStyle: any = {
    font: { bold: true, color: { rgb: 'FFFFFFFF' } },
    fill: { fgColor: { rgb: 'FF000039' } },
    alignment: { vertical: 'center' },
    border: {
      top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
    },
  };

  const range = XLSX.utils.decode_range((ws as any)['!ref']);
  for (let C = range.s.c; C <= range.e.c; C++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: C });
    if ((ws as any)[addr]) (ws as any)[addr].s = headerStyle;
  }
  for (let R = 1; R <= range.e.r; R++) {
    const addr = XLSX.utils.encode_cell({ r: R, c: 0 });
    if ((ws as any)[addr]) (ws as any)[addr].s = headerStyle;
  }

  const borderThin = {
    top: { style: 'thin', color: { rgb: 'FFEEEEEE' } },
    left: { style: 'thin', color: { rgb: 'FFEEEEEE' } },
    right: { style: 'thin', color: { rgb: 'FFDDDDDD' } },
    bottom: { style: 'thin', color: { rgb: 'FFDDDDDD' } },
  };
  const colorFor = (rating: number | null) => {
    if (rating == null) return 'FFF3F4F6';
    if (rating <= 2) return 'FFFF6B6B';
    if (rating <= 4) return 'FFFFA500';
    if (rating <= 6) return 'FFFFD700';
    if (rating <= 8) return 'FF90EE90';
    return 'FF17F0F0';
  };

  for (let r = 1; r <= range.e.r; r++) {
    const employee = matrix.employees[r - 1];
    for (let c = 1; c <= range.e.c; c++) {
      const skill = matrix.skills[c - 1];
      const key = `${employee.id}|${skill.id}`;
      const rating = cellMap.get(key)?.self ?? null;
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = (ws as any)[addr];
      if (!cell) continue;
      cell.s = {
        fill: { fgColor: { rgb: colorFor(rating) } },
        border: borderThin,
        alignment: { horizontal: 'center', vertical: 'center' },
        font: { bold: false },
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Skill Matrix');
}

// Build detail sheet listing all assessments within filters
export async function createDetailSheet(
  wb: XLSX.WorkBook,
  filters: ExportFilters,
  options: ExportOptions
) {
  const employees = await prisma.employee.findMany({
    where: { id: filters.employeeIds?.length ? { in: filters.employeeIds } : undefined },
    select: { id: true, firstName: true, lastName: true },
  });
  const skills = await prisma.skill.findMany({
    where: {
      id: filters.skillIds?.length ? { in: filters.skillIds } : undefined,
      categoryId: filters.categoryId ?? undefined,
    },
    include: { category: true },
  });
  const employeeIds = employees.length ? employees.map((e) => e.id) : undefined;
  const skillIds = skills.length ? skills.map((s) => s.id) : undefined;

  const rows = await prisma.skillAssessment.findMany({
    where: {
      employeeId: employeeIds ? { in: employeeIds } : undefined,
      skillId: skillIds ? { in: skillIds } : undefined,
    },
    orderBy: [{ validFrom: 'desc' }],
    include: { assessor: true, skill: { include: { category: true } }, employee: true },
  });

  const aoa: any[][] = [
    [
      'Mitarbeiter',
      'Skill',
      'Kategorie',
      'Bewertungstyp',
      'Bewerter',
      'Rating',
      'Kommentar',
      'Datum',
    ],
  ];
  for (const r of rows) {
    aoa.push([
      `${r.employee.lastName}, ${r.employee.firstName}`,
      r.skill.name,
      r.skill.category?.name ?? '',
      r.assessmentType,
      r.assessor ? `${r.assessor.lastName}, ${r.assessor.firstName}` : '',
      r.rating,
      options.includeComments ? (r.comment ?? '') : '',
      r.validFrom.toISOString(),
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  (ws as any)['!freeze'] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(wb, ws, 'Bewertungen Details');
}

export async function createStatisticsSheet(wb: XLSX.WorkBook, filters: ExportFilters) {
  // Average peer per skill and top/bottom
  const skills = await prisma.skill.findMany({
    where: { isActive: true, categoryId: filters.categoryId ?? undefined },
    include: { category: true },
  });
  const rows = await prisma.skillAssessment.findMany({
    where: { assessmentType: 'PEER', skillId: { in: skills.map((s) => s.id) }, validTo: null },
    select: { skillId: true, rating: true },
  });
  const map = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const prev = map.get(r.skillId) ?? { sum: 0, count: 0 };
    map.set(r.skillId, { sum: prev.sum + r.rating, count: prev.count + 1 });
  }
  const stats = skills.map((s) => {
    const v = map.get(s.id);
    const avg = v && v.count ? Math.round((v.sum / v.count) * 100) / 100 : null;
    return { skillId: s.id, skill: s.name, category: s.category?.name ?? '', avg };
  });

  // Category averages
  const byCat = new Map<string, number[]>();
  for (const s of stats) {
    if (s.avg == null) continue;
    const arr = byCat.get(s.category) ?? [];
    arr.push(s.avg);
    byCat.set(s.category, arr);
  }
  const catRows = Array.from(byCat.entries()).map(([cat, arr]) => [
    cat || '—',
    Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100,
  ]);

  // Top 5 and Bottom 5 by avg
  const withAvg = stats.filter(
    (s): s is { skillId: string; skill: string; category: string; avg: number } => s.avg != null
  );
  const top5 = [...withAvg]
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 5)
    .map((s) => [s.skill, s.category, s.avg]);
  const bottom5 = [...withAvg]
    .sort((a, b) => a.avg - b.avg)
    .slice(0, 5)
    .map((s) => [s.skill, s.category, s.avg]);

  // Experts count per skill from SELF current ratings >=9
  const expertsRowsRaw = await prisma.skillAssessment.groupBy({
    by: ['skillId'],
    where: {
      assessmentType: 'SELF',
      validTo: null,
      rating: { gte: 9 },
      skillId: { in: skills.map((s) => s.id) },
    },
    _count: { _all: true },
  });
  const expertMap = new Map<string, number>(
    expertsRowsRaw.map((r: any) => [r.skillId, r._count._all as number])
  );
  const experts = skills.map((s) => [s.name, s.category?.name ?? '', expertMap.get(s.id) ?? 0]);

  const aoa: any[][] = [];
  aoa.push(['Kategorie', 'Ø Fremd']);
  aoa.push(...catRows);
  aoa.push([]);
  aoa.push(['Top 5 Skills', 'Kategorie', 'Ø Fremd']);
  aoa.push(...top5);
  aoa.push([]);
  aoa.push(['Bottom 5 Skills', 'Kategorie', 'Ø Fremd']);
  aoa.push(...bottom5);
  aoa.push(['Experten (9-10) pro Skill', 'Kategorie', 'Anzahl']);
  aoa.push(...experts);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, 'Statistiken');
}
