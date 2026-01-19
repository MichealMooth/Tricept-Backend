import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getCurrentAssessments,
  createOrUpdateAssessment,
  getAssessmentHistory,
  calculateAveragePeerRating,
  getSkillDevelopmentTrend,
} from '@/services/assessment.service';

const createSchema = z.object({
  employeeId: z.string().uuid(),
  skillId: z.string().uuid(),
  assessmentType: z.enum(['SELF', 'PEER']),
  // Rating must be between 1-10 (matches database CHECK constraint)
  rating: z.number().int().min(1).max(10),
  comment: z.string().max(2000).optional(),
});

export async function listForEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId } = req.params;
    const includeHistory = req.query.includeHistory === 'true';
    const result = await getCurrentAssessments(employeeId, includeHistory);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = createSchema.parse(req.body);

    // Determine assessorId rules
    const user: any = (req as any).user;
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    let assessorId = user.id;
    if (parsed.assessmentType === 'SELF') {
      // SELF must be self
      assessorId = parsed.employeeId;
      if (assessorId !== user.id) {
        return res
          .status(403)
          .json({ message: 'SELF assessment must be created by the employee themself' });
      }
    }

    const created = await createOrUpdateAssessment({
      employeeId: parsed.employeeId,
      skillId: parsed.skillId,
      assessmentType: parsed.assessmentType,
      assessorId,
      rating: parsed.rating,
      comment: parsed.comment,
    });

    return res.status(201).json(created);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, skillId } = req.params;
    const rows = await getAssessmentHistory(employeeId, skillId);
    return res.json(rows);
  } catch (err) {
    return next(err);
  }
}

export async function peerAverage(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, skillId } = req.params;
    const avg = await calculateAveragePeerRating(employeeId, skillId);
    return res.json({ average: avg });
  } catch (err) {
    return next(err);
  }
}

export async function trend(req: Request, res: Response, next: NextFunction) {
  try {
    const { employeeId, skillId } = req.params;
    const months = req.query.months ? Number(req.query.months) : 6;
    const data = await getSkillDevelopmentTrend(employeeId, skillId, months);
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}
