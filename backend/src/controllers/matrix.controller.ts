import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getMatrixData, type MatrixFilters } from '@/services/matrix.service';

const querySchema = z.object({
  categoryId: z.string().uuid().optional(),
  employeeIds: z.string().optional(), // comma-separated
  skillIds: z.string().optional(), // comma-separated
});

export async function getMatrix(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = querySchema.parse(req.query);
    const filters: MatrixFilters = {
      categoryId: parsed.categoryId,
      employeeIds: parsed.employeeIds ? parsed.employeeIds.split(',').filter(Boolean) : undefined,
      skillIds: parsed.skillIds ? parsed.skillIds.split(',').filter(Boolean) : undefined,
    };
    const data = await getMatrixData(filters);
    return res.json(data);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}
