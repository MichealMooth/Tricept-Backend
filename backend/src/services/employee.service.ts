import { prisma } from '@/config/database';
import { hash } from 'bcryptjs';
import type { Prisma } from '@prisma/client';

/**
 * Employee with team memberships.
 */
export interface EmployeeWithTeams {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string | null;
  department: string;
  isActive: boolean;
  isAdmin: boolean;
  hireDate: Date | null;
  createdAt: Date;
  teams: Array<{ id: string; name: string }>;
}

/**
 * Employee team membership info.
 */
export interface EmployeeTeam {
  teamId: string;
  teamName: string;
  role: string;
  membershipId: string;
}

export async function listEmployees(search?: string) {
  const where: Prisma.EmployeeWhereInput = {};

  if (search) {
    // Use dual conditions for SQLite compatibility (no mode: 'insensitive')
    const searchLower = search.toLowerCase();
    const searchUpper = search.toUpperCase();
    const searchCapitalized = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();

    where.OR = [
      { firstName: { contains: search } },
      { firstName: { contains: searchLower } },
      { firstName: { contains: searchCapitalized } },
      { lastName: { contains: search } },
      { lastName: { contains: searchLower } },
      { lastName: { contains: searchCapitalized } },
      { email: { contains: search } },
      { email: { contains: searchLower } },
      { email: { contains: searchUpper } },
      { department: { contains: search } },
      { department: { contains: searchLower } },
      { department: { contains: searchCapitalized } },
    ];
  }

  return prisma.employee.findMany({ where, orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }] });
}

/**
 * List employees with their team memberships.
 * Task Group 4: Extends employee listing to include team data.
 *
 * @param search - Optional search string
 * @returns List of employees with team info
 */
export async function listEmployeesWithTeams(search?: string): Promise<EmployeeWithTeams[]> {
  const where: Prisma.EmployeeWhereInput = {};

  if (search) {
    const searchLower = search.toLowerCase();
    const searchUpper = search.toUpperCase();
    const searchCapitalized = search.charAt(0).toUpperCase() + search.slice(1).toLowerCase();

    where.OR = [
      { firstName: { contains: search } },
      { firstName: { contains: searchLower } },
      { firstName: { contains: searchCapitalized } },
      { lastName: { contains: search } },
      { lastName: { contains: searchLower } },
      { lastName: { contains: searchCapitalized } },
      { email: { contains: search } },
      { email: { contains: searchLower } },
      { email: { contains: searchUpper } },
      { department: { contains: search } },
      { department: { contains: searchLower } },
      { department: { contains: searchCapitalized } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      teamMemberships: {
        where: {
          teamGroup: {
            isActive: true,
          },
        },
        include: {
          teamGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          teamGroup: {
            name: 'asc',
          },
        },
      },
    },
  });

  return employees.map((emp) => ({
    id: emp.id,
    email: emp.email,
    firstName: emp.firstName,
    lastName: emp.lastName,
    role: emp.role,
    department: emp.department,
    isActive: emp.isActive,
    isAdmin: emp.isAdmin,
    hireDate: emp.hireDate,
    createdAt: emp.createdAt,
    teams: emp.teamMemberships.map((m) => ({
      id: m.teamGroup.id,
      name: m.teamGroup.name,
    })),
  }));
}

/**
 * Get teams for a specific employee.
 * Task Group 4: Returns team memberships for an employee.
 *
 * @param employeeId - Employee ID
 * @returns List of team memberships with role info
 */
export async function getEmployeeTeams(employeeId: string): Promise<EmployeeTeam[]> {
  const memberships = await prisma.teamMembership.findMany({
    where: {
      employeeId,
      teamGroup: {
        isActive: true,
      },
    },
    include: {
      teamGroup: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      teamGroup: {
        name: 'asc',
      },
    },
  });

  return memberships.map((m) => ({
    teamId: m.teamGroup.id,
    teamName: m.teamGroup.name,
    role: m.role,
    membershipId: m.id,
  }));
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
  const update: Record<string, unknown> = { ...data };
  if (data.password) {
    update.passwordHash = await hash(data.password, 12);
    delete update.password;
  }
  return prisma.employee.update({ where: { id }, data: update });
}

export async function archiveEmployee(id: string) {
  await prisma.employee.update({ where: { id }, data: { isActive: false } });
}
