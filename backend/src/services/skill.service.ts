import { prisma } from '@/config/database';

export type CategoryTree = {
  id: string;
  name: string;
  parentId: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  children: CategoryTree[];
  skills: {
    id: string;
    name: string;
    description: string | null;
    displayOrder: number;
    isActive: boolean;
    createdAt: Date;
  }[];
};

export async function reactivateCategoryCascade(id: string) {
  // collect all descendant category ids including the given id
  const categories = await prisma.skillCategory.findMany({ select: { id: true, parentId: true } });
  const byParent = new Map<string | null, string[]>();
  for (const c of categories) {
    const arr = byParent.get(c.parentId ?? null) || [];
    arr.push(c.id);
    byParent.set(c.parentId ?? null, arr);
  }
  const toActivate: string[] = [];
  const stack: string[] = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    toActivate.push(cur);
    const children = byParent.get(cur) || [];
    for (const ch of children) stack.push(ch);
  }
  await prisma.$transaction([
    prisma.skillCategory.updateMany({
      where: { id: { in: toActivate } },
      data: { isActive: true },
    }),
    prisma.skill.updateMany({
      where: { categoryId: { in: toActivate } },
      data: { isActive: true },
    }),
  ]);
}

export async function hardDeleteCategoryCascade(id: string) {
  // collect all descendant category ids including the given id
  const categories = await prisma.skillCategory.findMany({ select: { id: true, parentId: true } });
  const byParent = new Map<string | null, string[]>();
  for (const c of categories) {
    const arr = byParent.get(c.parentId ?? null) || [];
    arr.push(c.id);
    byParent.set(c.parentId ?? null, arr);
  }
  const toRemove: string[] = [];
  const stack: string[] = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    toRemove.push(cur);
    const children = byParent.get(cur) || [];
    for (const ch of children) stack.push(ch);
  }
  // collect skill ids in these categories
  const skills = await prisma.skill.findMany({
    where: { categoryId: { in: toRemove } },
    select: { id: true },
  });
  const skillIds = skills.map((s) => s.id);
  await prisma.$transaction([
    // delete dependent assessments first
    prisma.skillAssessment.deleteMany({ where: { skillId: { in: skillIds } } }),
    // then delete skills
    prisma.skill.deleteMany({ where: { id: { in: skillIds } } }),
    // finally delete categories
    prisma.skillCategory.deleteMany({ where: { id: { in: toRemove } } }),
  ]);
}

export async function getCategoriesTree(includeInactive = false): Promise<CategoryTree[]> {
  const categories = await prisma.skillCategory.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  const skills = await prisma.skill.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
      createdAt: true,
      categoryId: true,
    },
  });

  const byParent: Record<string, CategoryTree[]> = {};
  const items: Record<string, CategoryTree> = {};
  for (const c of categories) {
    items[c.id] = {
      ...c,
      children: [],
      skills: [],
    };
    const key = c.parentId ?? 'root';
    byParent[key] = byParent[key] || [];
    byParent[key].push(items[c.id]);
  }
  // attach skills to category
  for (const s of skills) {
    const cat = items[s.categoryId];
    if (cat) {
      const { categoryId, ...rest } = s as any;
      cat.skills.push(rest);
    }
  }
  // build tree from roots
  const attach = (node: CategoryTree) => {
    const children = byParent[node.id] || [];
    node.children = children;
    for (const ch of children) attach(ch);
  };
  const roots = byParent['root'] || [];
  for (const r of roots) attach(r);
  return roots;
}

export async function createCategory(data: {
  name: string;
  parentId?: string | null;
  description?: string | null;
  displayOrder?: number;
}) {
  return prisma.skillCategory.create({
    data: {
      name: data.name,
      parentId: data.parentId ?? null,
      description: data.description ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: true,
    },
  });
}

export async function updateCategory(
  id: string,
  data: {
    name?: string;
    parentId?: string | null;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  return prisma.skillCategory.update({
    where: { id },
    data: {
      name: data.name,
      parentId: data.parentId === undefined ? undefined : data.parentId,
      description: data.description === undefined ? undefined : data.description,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    },
  });
}

export async function softDeleteCategory(id: string) {
  // collect all descendant category ids including the given id
  const categories = await prisma.skillCategory.findMany({ select: { id: true, parentId: true } });
  const byParent = new Map<string | null, string[]>();
  for (const c of categories) {
    const arr = byParent.get(c.parentId ?? null) || [];
    arr.push(c.id);
    byParent.set(c.parentId ?? null, arr);
  }
  const toDelete: string[] = [];
  const stack: string[] = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    toDelete.push(cur);
    const children = byParent.get(cur) || [];
    for (const ch of children) stack.push(ch);
  }
  await prisma.$transaction([
    prisma.skill.updateMany({ where: { categoryId: { in: toDelete } }, data: { isActive: false } }),
    prisma.skillCategory.updateMany({ where: { id: { in: toDelete } }, data: { isActive: false } }),
  ]);
}

export async function getSkills(filters: { categoryId?: string; isActive?: boolean }) {
  return prisma.skill.findMany({
    where: {
      categoryId: filters.categoryId,
      isActive: filters.isActive === undefined ? undefined : filters.isActive,
    },
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function createSkill(data: {
  name: string;
  categoryId: string;
  description?: string | null;
  displayOrder?: number;
}) {
  return prisma.skill.create({
    data: {
      name: data.name,
      categoryId: data.categoryId,
      description: data.description ?? null,
      displayOrder: data.displayOrder ?? 0,
      isActive: true,
    },
  });
}

export async function updateSkill(
  id: string,
  data: {
    name?: string;
    categoryId?: string;
    description?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }
) {
  return prisma.skill.update({
    where: { id },
    data: {
      name: data.name,
      categoryId: data.categoryId,
      description: data.description === undefined ? undefined : data.description,
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    },
  });
}
export async function softDeleteSkill(id: string) {
  await prisma.skill.update({ where: { id }, data: { isActive: false } });
}

// === Bulk import of categories and skills ===
export type SkillImportPayload = {
  skillGroups: Array<{
    title: string;
    skills: Array<{ name: string; description?: string | null; displayOrder?: number }>;
  }>;
};

export async function importSkillGroups(payload: SkillImportPayload) {
  const result: { createdCategories: number; createdSkills: number; updatedSkills: number } = {
    createdCategories: 0,
    createdSkills: 0,
    updatedSkills: 0,
  };

  for (const group of payload.skillGroups) {
    // find or create category by unique name
    let category = await prisma.skillCategory.findUnique({ where: { name: group.title } });
    if (!category) {
      category = await prisma.skillCategory.create({ data: { name: group.title, isActive: true } });
      result.createdCategories += 1;
    } else if (!category.isActive) {
      // revive inactive category
      category = await prisma.skillCategory.update({
        where: { id: category.id },
        data: { isActive: true },
      });
    }

    for (const s of group.skills) {
      // upsert by (name, categoryId)
      const existing = await prisma.skill.findFirst({
        where: { name: s.name, categoryId: category.id },
      });
      if (existing) {
        await prisma.skill.update({
          where: { id: existing.id },
          data: {
            name: s.name, // keep same
            categoryId: category.id,
            description: s.description ?? null,
            displayOrder: s.displayOrder ?? existing.displayOrder ?? 0,
            isActive: true,
          },
        });
        result.updatedSkills += 1;
      } else {
        await prisma.skill.create({
          data: {
            name: s.name,
            categoryId: category.id,
            description: s.description ?? null,
            displayOrder: s.displayOrder ?? 0,
            isActive: true,
          },
        });
        result.createdSkills += 1;
      }
    }
  }

  return result;
}
