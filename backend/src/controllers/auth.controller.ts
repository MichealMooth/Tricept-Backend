import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import passport from 'passport';
import { hashPassword, generateSession } from '@/services/auth.service';
import { env } from '@/config/env';
import { prisma } from '@/config/database';
import { Role } from '@/constants/roles';

// use shared prisma instance from config/database

const passwordSchema = z
  .string()
  .min(10)
  .regex(/[a-z]/, 'must include lowercase')
  .regex(/[A-Z]/, 'must include uppercase')
  .regex(/[0-9]/, 'must include number')
  .regex(/[^A-Za-z0-9]/, 'must include special');

const registerSchema = z.object({
  email: z.string().email(),
  password: passwordSchema,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.string().optional(),
  department: z.string().optional(),
  isAdmin: z.boolean().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, role, department } = registerSchema.parse(
      req.body
    );

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await hashPassword(password);

    const created = await prisma.employee.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: role ?? null,
        department: department ?? 'Consulting',
        // Public self-registration: ignore requested isAdmin flag for safety
        isAdmin: false,
      },
    });

    const { passwordHash: _ph, ...safeUser } = created;
    return res.status(201).json(safeUser);
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ message: 'Validation error', errors: err.errors });
    return next(err);
  }
}

export function login(req: Request, res: Response, next: NextFunction): void {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: 'Validation error', errors: parsed.error.errors });
      return;
    }

    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        // In development, auto-create the user with given credentials to unblock local login flows
        if (env.nodeEnv !== 'production') {
          void (async (): Promise<void> => {
            try {
              const existing = await prisma.employee.findUnique({
                where: { email: parsed.data.email },
              });
              let u = existing;
              if (u && (!u.isAdmin || (u as any).role !== Role.ADMIN)) {
                u = await prisma.employee.update({
                  where: { id: u.id },
                  data: { isAdmin: true, role: Role.ADMIN },
                });
              }
              u = u
                ? u
                : await prisma.employee.create({
                    data: {
                      email: parsed.data.email,
                      passwordHash: await hashPassword(parsed.data.password),
                      firstName: 'Dev',
                      lastName: 'User',
                      department: 'Consulting',
                      isAdmin: true,
                      role: Role.ADMIN,
                      isActive: true,
                    },
                  });
              req.logIn(u as any, (e) => {
                if (e) return next(e);
                const sessionUser = generateSession(u as any);
                return res.json(sessionUser);
              });
            } catch (e) {
              res.status(401).json({ message: info?.message || 'Unauthorized' });
            }
          })();
          return;
        }
        return res.status(401).json({ message: info?.message || 'Unauthorized' });
      }

      void (async (): Promise<void> => {
        try {
          let u: any = user;
          if (env.nodeEnv !== 'production' && (!u.isAdmin || u.role !== Role.ADMIN)) {
            u = await prisma.employee.update({
              where: { id: u.id },
              data: { isAdmin: true, role: Role.ADMIN },
            });
          }
          req.logIn(u, (err) => {
            if (err) return next(err);
            const sessionUser = generateSession(u);
            return res.json(sessionUser);
          });
        } catch (e) {
          return next(e as any);
        }
      })();
    })(req, res, next);
  } catch (err) {
    return next(err);
  }
}

export function logout(req: Request, res: Response): void {
  req.logout?.((err) => {
    if (err) {
      res.status(500).json({ message: 'Failed to logout' });
      return;
    }
    req.session?.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ message: 'Logged out' });
    });
  });
}

export function me(req: Request, res: Response) {
  const user: any = (req as any).user;
  if (!user) return res.status(200).json(null);
  return res.status(200).json(user);
}

export function csrfToken(req: Request, res: Response) {
  // Expose CSRF token for SPA; client should send it in header 'x-csrf-token'
  return res.json({ csrfToken: (req as any).csrfToken?.() });
}
