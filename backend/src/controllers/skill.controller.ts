import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getCategoriesTree,
  createCategory as svcCreateCategory,
  updateCategory as svcUpdateCategory,
  softDeleteCategory,
  getSkills as svcGetSkills,
  createSkill as svcCreateSkill,
  updateSkill as svcUpdateSkill,
  softDeleteSkill,
  importSkillGroups,
  reactivateCategoryCascade,
  hardDeleteCategoryCascade,
} from '@/services/skill.service';

// Zod schemas
const categoryCreateSchema = z.object({
  name: z.string().min(1).max(200),
  parentId: z.string().uuid().optional(),
  description: z.string().max(1000).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const categoryUpdateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  parentId: z.string().uuid().nullable().optional(),
  description: z.string().max(1000).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const skillCreateSchema = z.object({
  name: z.string().min(1).max(300),
  categoryId: z.string().uuid(),
  description: z.string().max(2000).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

const skillUpdateSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  categoryId: z.string().uuid().optional(),
  description: z.string().max(2000).nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const importSchema = z.object({
  skillGroups: z.array(
    z.object({
      title: z.string().min(1),
      skills: z.array(
        z.object({
          name: z.string().min(1),
          description: z.string().max(2000).optional(),
          displayOrder: z.number().int().min(0).optional(),
        })
      ),
    })
  ),
});

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const includeInactive = String(req.query.includeInactive || 'false') === 'true';
    const tree = await getCategoriesTree(includeInactive);
    return res.json(tree);
  } catch (err) {
    return next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = categoryCreateSchema.parse(req.body);
    const created = await svcCreateCategory(data);
    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = categoryUpdateSchema.parse(req.body);
    const updated = await svcUpdateCategory(id, data);
    return res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await softDeleteCategory(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function reactivateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await reactivateCategoryCascade(id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return next(err);
  }
}

export async function hardDeleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await hardDeleteCategoryCascade(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function getSkills(req: Request, res: Response, next: NextFunction) {
  try {
    const categoryId = req.query.categoryId ? String(req.query.categoryId) : undefined;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const list = await svcGetSkills({ categoryId, isActive });
    return res.json(list);
  } catch (err) {
    return next(err);
  }
}

export async function createSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const data = skillCreateSchema.parse(req.body);
    const created = await svcCreateSkill(data);
    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function updateSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = skillUpdateSchema.parse(req.body);
    const updated = await svcUpdateSkill(id, data);
    return res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function deleteSkill(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await softDeleteSkill(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function importSkillGroupsController(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = importSchema.parse(req.body);
    const result = await importSkillGroups(payload);
    return res.status(201).json(result);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}
