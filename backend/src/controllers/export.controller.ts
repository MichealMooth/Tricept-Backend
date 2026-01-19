import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { buildMatrixBuffer } from '@/services/export.service';

const bodySchema = z.object({
  filters: z
    .object({
      categoryId: z.string().uuid().optional(),
      employeeIds: z.array(z.string().uuid()).optional(),
      skillIds: z.array(z.string().uuid()).optional(),
    })
    .default({}),
  includeComments: z.boolean().default(false),
});

export async function exportExcel(req: Request, res: Response, next: NextFunction) {
  try {
    const { filters, includeComments } = bodySchema.parse(req.body);
    const buf = await buildMatrixBuffer(filters, { includeComments });

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const filename = `Tricept_Skill_Matrix_${yyyy}-${mm}-${dd}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(buf);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}
