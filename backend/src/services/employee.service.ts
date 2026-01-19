import { prisma } from '@/config/database';
import { hash } from 'bcryptjs';

export async function listEmployees(search?: string) {
  const where = {
    OR: search
      ? [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
        ]
      : undefined,
  };
  return prisma.employee.findMany({ where, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] });
}

export async function createEmployee(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string | null;
  department?: string | null;
  isAdmin?: boolean;
  isActive?: boolean;
  hireDate?: Date | null;
}) {
  const passwordHash = await hash(data.password, 12);
  return prisma.employee.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role ?? null,
      department: data.department ?? 'Consulting',
      isAdmin: !!data.isAdmin,
      isActive: data.isActive ?? true,
      hireDate: data.hireDate ?? null,
    },
  });
}

export async function updateEmployee(
  id: string,
  data: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string | null;
    department: string | null;
    isAdmin: boolean;
    isActive: boolean;
    hireDate: Date | null;
  }>
) {
  const update: any = { ...data };
  if (data.password) {
    update.passwordHash = await hash(data.password, 12);
    delete update.password;
  }
  return prisma.employee.update({ where: { id }, data: update });
}

export async function archiveEmployee(id: string) {
  await prisma.employee.update({ where: { id }, data: { isActive: false } });
}
