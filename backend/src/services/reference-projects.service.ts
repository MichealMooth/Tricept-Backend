/**
 * Reference Projects Prisma Service
 * Provides CRUD operations for reference projects using Prisma ORM.
 * This service is activated via the USE_PRISMA_REFERENCE_PROJECTS feature flag.
 */
import { prisma } from '@/config/database';
import type { ReferenceProject, Role, Topic, Employee, Prisma } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

/**
 * Query parameters for listing reference projects.
 * Maintains backward compatibility with file store Query type.
 */
export type Query = {
  search?: string;
  role?: string; // Role name (string filter for backward compatibility)
  topic?: string; // Topic name (string filter for backward compatibility)
  roleId?: string; // New: Role UUID filter
  topicId?: string; // New: Topic UUID filter
  page?: number;
  pageSize?: number;
};

/**
 * Input data for creating a reference project.
 * Matches the shape expected by the existing file store API.
 */
export type CreateInput = {
  person: string;
  project_name: string;
  customer: string;
  project_description: string;
  role: string; // Role name (will be resolved to Role.id)
  activity_description: string;
  duration_from: string;
  duration_to: string;
  contact_person: string;
  approved: boolean;
  topics: string[]; // Topic names (will be resolved to Topic.ids)
  short_teaser?: string;
  short_project_description?: string;
};

/**
 * Input data for updating a reference project.
 * All fields are optional for partial updates.
 */
export type UpdateInput = Partial<CreateInput>;

/**
 * API response format for reference projects.
 * Maintains backward compatibility with file store response format.
 */
export type ReferenceProjectResponse = {
  id: string;
  person: string;
  project_name: string;
  customer: string;
  project_description: string;
  role: string;
  activity_description: string;
  duration_from: string;
  duration_to: string;
  contact_person: string;
  approved: boolean;
  topics: string[];
  short_teaser?: string | null;
  short_project_description?: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * Prisma ReferenceProject with all relations loaded.
 */
type ReferenceProjectWithRelations = ReferenceProject & {
  role: Role;
  topics: Array<{ topic: Topic }>;
  employees: Array<{ employee: Employee }>;
};

// =============================================================================
// Response Transformer (Task 3.9)
// =============================================================================

/**
 * Transform Prisma model to API response format.
 * Derives `person` from Employee relation or person_legacy fallback.
 * Derives `role` string from Role.name relation.
 * Derives `topics` array from Topic.name via junction.
 */
function transformToResponse(project: ReferenceProjectWithRelations): ReferenceProjectResponse {
  // Derive person from Employee relation or fallback to person_legacy
  let person = project.person_legacy ?? '';
  if (project.employees.length > 0) {
    const emp = project.employees[0].employee;
    person = `${emp.firstName} ${emp.lastName}`;
  }

  return {
    id: project.id,
    person,
    project_name: project.project_name,
    customer: project.customer,
    project_description: project.project_description,
    role: project.role.name,
    activity_description: project.activity_description,
    duration_from: project.duration_from,
    duration_to: project.duration_to,
    contact_person: project.contact_person,
    approved: project.approved,
    topics: project.topics.map((t) => t.topic.name),
    short_teaser: project.short_teaser,
    short_project_description: project.short_project_description,
    created_at: project.createdAt.toISOString(),
    updated_at: project.updatedAt.toISOString(),
  };
}

// =============================================================================
// Employee Matching Utility
// =============================================================================

/**
 * Match person string to Employee record using exact match (case-insensitive, trimmed).
 * Returns the matched Employee or null if not found.
 */
async function matchEmployee(personName: string): Promise<Employee | null> {
  // Preprocessing: trim, lowercase, collapse redundant whitespace
  const normalized = personName.trim().toLowerCase().replace(/\s+/g, ' ');

  if (!normalized) {
    return null;
  }

  // Fetch all employees (for small datasets this is acceptable)
  // For large datasets, consider using raw SQL with CONCAT and LOWER
  const employees = await prisma.employee.findMany({
    where: { isActive: true },
  });

  // Find exact match
  const matches = employees.filter((emp) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.trim().toLowerCase().replace(/\s+/g, ' ');
    return fullName === normalized;
  });

  if (matches.length === 1) {
    return matches[0];
  }

  // No match or multiple matches - return null (person_legacy will be used)
  return null;
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate topics array: min 1, max 6 entries.
 */
function validateTopics(topics: string[]): void {
  if (!topics || topics.length === 0) {
    throw new Error('At least one topic is required');
  }
  if (topics.length > 6) {
    throw new Error('Maximum 6 topics allowed per project');
  }
}

/**
 * Validate short_teaser length: 100-150 characters when provided.
 */
function validateShortTeaser(teaser: string | undefined): void {
  if (teaser !== undefined && teaser !== null && teaser.length > 0) {
    if (teaser.length < 100 || teaser.length > 150) {
      throw new Error('short_teaser must be between 100 and 150 characters');
    }
  }
}

// =============================================================================
// Service Functions
// =============================================================================

/**
 * List reference projects with pagination and filtering.
 * Task 3.4: Implements list() function in Prisma service.
 */
export async function list(query: Query): Promise<{
  items: ReferenceProjectResponse[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const page = Math.max(1, Number(query.page ?? 1));
  const pageSize = Math.max(1, Math.min(100, Number(query.pageSize ?? 20)));
  const skip = (page - 1) * pageSize;

  // Build where clause with explicit type
  const where: Prisma.ReferenceProjectWhereInput = {};

  // Filter by roleId (new UUID filter)
  if (query.roleId) {
    where.roleId = query.roleId;
  }

  // Filter by role name (backward compatibility)
  if (query.role && !query.roleId) {
    where.role = { name: query.role };
  }

  // Filter by topicId (new UUID filter)
  if (query.topicId) {
    where.topics = { some: { topicId: query.topicId } };
  }

  // Filter by topic name (backward compatibility)
  if (query.topic && !query.topicId) {
    where.topics = { some: { topic: { name: query.topic } } };
  }

  // Search filter - search across person, project_name, customer
  if (query.search) {
    const searchLower = query.search.toLowerCase();
    where.OR = [
      { project_name: { contains: searchLower } },
      { customer: { contains: searchLower } },
      { person_legacy: { contains: searchLower } },
      // Also search in employee names via relation
      {
        employees: {
          some: {
            employee: {
              OR: [
                { firstName: { contains: searchLower } },
                { lastName: { contains: searchLower } },
              ],
            },
          },
        },
      },
    ];
  }

  // Execute count and fetch in parallel
  const [total, projects] = await Promise.all([
    prisma.referenceProject.count({ where }),
    prisma.referenceProject.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        role: true,
        topics: { include: { topic: true } },
        employees: { include: { employee: true } },
      },
    }),
  ]);

  return {
    items: projects.map(transformToResponse),
    total,
    page,
    pageSize,
  };
}

/**
 * Get a reference project by ID.
 * Task 3.5: Implements getById() function in Prisma service.
 */
export async function getById(id: string): Promise<ReferenceProjectResponse | null> {
  const project = await prisma.referenceProject.findUnique({
    where: { id },
    include: {
      role: true,
      topics: { include: { topic: true } },
      employees: { include: { employee: true } },
    },
  });

  if (!project) {
    return null;
  }

  return transformToResponse(project);
}

/**
 * Create a new reference project.
 * Task 3.6: Implements create() function in Prisma service.
 */
export async function create(input: CreateInput): Promise<ReferenceProjectResponse> {
  // Validate topics (min 1, max 6)
  validateTopics(input.topics);

  // Validate short_teaser if provided
  validateShortTeaser(input.short_teaser);

  // Resolve role name to Role.id
  const role = await prisma.role.findUnique({ where: { name: input.role } });
  if (!role) {
    throw new Error(`Role not found: ${input.role}`);
  }

  // Resolve topic names to Topic.ids
  const topics = await prisma.topic.findMany({
    where: { name: { in: input.topics } },
  });
  if (topics.length !== input.topics.length) {
    const foundNames = topics.map((t) => t.name);
    const missing = input.topics.filter((t) => !foundNames.includes(t));
    throw new Error(`Topics not found: ${missing.join(', ')}`);
  }

  // Match employee for person field
  const matchedEmployee = await matchEmployee(input.person);

  // Use transaction for atomicity
  const project = await prisma.$transaction(async (tx) => {
    const newProject = await tx.referenceProject.create({
      data: {
        project_name: input.project_name,
        customer: input.customer,
        project_description: input.project_description,
        activity_description: input.activity_description,
        duration_from: input.duration_from,
        duration_to: input.duration_to,
        contact_person: input.contact_person,
        approved: input.approved,
        roleId: role.id,
        person_legacy: matchedEmployee ? null : input.person,
        short_teaser: input.short_teaser ?? null,
        short_project_description: input.short_project_description ?? null,
        topics: {
          create: topics.map((t) => ({ topicId: t.id })),
        },
        employees: matchedEmployee
          ? { create: [{ employeeId: matchedEmployee.id }] }
          : undefined,
      },
      include: {
        role: true,
        topics: { include: { topic: true } },
        employees: { include: { employee: true } },
      },
    });

    return newProject;
  });

  return transformToResponse(project);
}

/**
 * Update an existing reference project.
 * Task 3.7: Implements update() function in Prisma service.
 */
export async function update(
  id: string,
  input: UpdateInput
): Promise<ReferenceProjectResponse | null> {
  // Check if project exists
  const existing = await prisma.referenceProject.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  // Validate topics if provided
  if (input.topics !== undefined) {
    validateTopics(input.topics);
  }

  // Validate short_teaser if provided
  if (input.short_teaser !== undefined) {
    validateShortTeaser(input.short_teaser);
  }

  // Resolve role name to Role.id if provided
  let roleId: string | undefined;
  if (input.role !== undefined) {
    const role = await prisma.role.findUnique({ where: { name: input.role } });
    if (!role) {
      throw new Error(`Role not found: ${input.role}`);
    }
    roleId = role.id;
  }

  // Resolve topic names to Topic.ids if provided
  let topicIds: string[] | undefined;
  if (input.topics !== undefined) {
    const topics = await prisma.topic.findMany({
      where: { name: { in: input.topics } },
    });
    if (topics.length !== input.topics.length) {
      const foundNames = topics.map((t) => t.name);
      const missing = input.topics.filter((t) => !foundNames.includes(t));
      throw new Error(`Topics not found: ${missing.join(', ')}`);
    }
    topicIds = topics.map((t) => t.id);
  }

  // Re-run employee matching if person field changes
  let matchedEmployee: Employee | null = null;
  let updateEmployeeRelation = false;
  if (input.person !== undefined) {
    matchedEmployee = await matchEmployee(input.person);
    updateEmployeeRelation = true;
  }

  // Use transaction for atomicity
  const project = await prisma.$transaction(async (tx) => {
    // Update topics junction table if topics changed
    if (topicIds !== undefined) {
      // Delete existing topic relations
      await tx.referenceProjectTopic.deleteMany({
        where: { referenceProjectId: id },
      });
      // Create new topic relations
      await tx.referenceProjectTopic.createMany({
        data: topicIds.map((topicId) => ({
          referenceProjectId: id,
          topicId,
        })),
      });
    }

    // Update employee relation if person changed
    if (updateEmployeeRelation) {
      // Delete existing employee relations
      await tx.referenceProjectEmployee.deleteMany({
        where: { referenceProjectId: id },
      });
      // Create new employee relation if matched
      if (matchedEmployee) {
        await tx.referenceProjectEmployee.create({
          data: {
            referenceProjectId: id,
            employeeId: matchedEmployee.id,
          },
        });
      }
    }

    // Build update data
    const updateData: Prisma.ReferenceProjectUpdateInput = {};

    if (input.project_name !== undefined) updateData.project_name = input.project_name;
    if (input.customer !== undefined) updateData.customer = input.customer;
    if (input.project_description !== undefined)
      updateData.project_description = input.project_description;
    if (input.activity_description !== undefined)
      updateData.activity_description = input.activity_description;
    if (input.duration_from !== undefined) updateData.duration_from = input.duration_from;
    if (input.duration_to !== undefined) updateData.duration_to = input.duration_to;
    if (input.contact_person !== undefined) updateData.contact_person = input.contact_person;
    if (input.approved !== undefined) updateData.approved = input.approved;
    if (roleId !== undefined) updateData.role = { connect: { id: roleId } };
    if (input.short_teaser !== undefined) updateData.short_teaser = input.short_teaser;
    if (input.short_project_description !== undefined)
      updateData.short_project_description = input.short_project_description;

    // Update person_legacy based on employee matching
    if (input.person !== undefined) {
      updateData.person_legacy = matchedEmployee ? null : input.person;
    }

    // Update the project
    const updatedProject = await tx.referenceProject.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
        topics: { include: { topic: true } },
        employees: { include: { employee: true } },
      },
    });

    return updatedProject;
  });

  return transformToResponse(project);
}

/**
 * Remove a reference project by ID.
 * Task 3.8: Implements remove() function in Prisma service.
 */
export async function remove(id: string): Promise<boolean> {
  try {
    // Junction table records will be deleted by cascade (onDelete: Cascade in schema)
    await prisma.referenceProject.delete({ where: { id } });
    return true;
  } catch (error) {
    // Record not found or other error
    return false;
  }
}
