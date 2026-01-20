import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  archiveEmployee,
  createEmployee,
  listEmployees,
  listEmployeesWithTeams,
  getEmployeeTeams,
  updateEmployee,
} from '@/services/employee.service';

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.string().optional(),
  department: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hireDate: z.coerce.date().optional(),
});

const updateSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(10).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.string().optional(),
  department: z.string().optional(),
  isAdmin: z.boolean().optional(),
  isActive: z.boolean().optional(),
  hireDate: z.coerce.date().nullable().optional(),
});

export async function getEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const includeTeams = req.query.includeTeams === 'true';

    if (includeTeams) {
      const list = await listEmployeesWithTeams(search);
      return res.json(list);
    }

    const list = await listEmployees(search);
    return res.json(list);
  } catch (err) {
    return next(err);
  }
}

/**
 * Get teams for a specific employee.
 * Task Group 4: Returns team memberships for an employee.
 *
 * GET /api/employees/:id/teams
 */
export async function getEmployeeTeamsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const teams = await getEmployeeTeams(id);
    return res.json(teams);
  } catch (err) {
    return next(err);
  }
}

export async function postEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const created = await createEmployee(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { passwordHash, ...safe } = created as any;
    return res.status(201).json(safe);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function putEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const data = updateSchema.parse(req.body);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updated = await updateEmployee(id, data as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { passwordHash, ...safe } = updated as any;
    return res.json(safe);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export async function deleteEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await archiveEmployee(id);
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}
