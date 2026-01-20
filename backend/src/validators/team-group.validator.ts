/**
 * Team Group and Team Membership Validation Schemas
 *
 * Zod schemas for validating API input for TeamGroup and TeamMembership endpoints.
 * These schemas ensure type safety and input validation at the API boundary.
 *
 * Task Group 4.2: Create Zod validation schemas
 * Task Group 1: Add search parameter for team listing
 */

import { z } from 'zod';

/**
 * Valid TeamRole values.
 * Matches the TeamRole type in authorization.ts and Prisma schema validation.
 */
export const TeamRoleEnum = z.enum(['OWNER', 'ADMIN', 'EDITOR', 'VIEWER', 'USER']);
export type TeamRoleValue = z.infer<typeof TeamRoleEnum>;

/**
 * Schema for creating a new TeamGroup.
 * - name: required, non-empty string
 * - description: optional string
 */
export const CreateTeamGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
});

export type CreateTeamGroupInput = z.infer<typeof CreateTeamGroupSchema>;

/**
 * Schema for updating an existing TeamGroup.
 * All fields are optional for partial updates.
 * - name: optional string
 * - description: optional string
 * - isActive: optional boolean
 */
export const UpdateTeamGroupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must not exceed 255 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateTeamGroupInput = z.infer<typeof UpdateTeamGroupSchema>;

/**
 * Schema for creating a new TeamMembership.
 * - employeeId: required UUID string
 * - role: required enum value (OWNER, ADMIN, EDITOR, VIEWER, USER)
 */
export const CreateTeamMembershipSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID format'),
  role: TeamRoleEnum,
});

export type CreateTeamMembershipInput = z.infer<typeof CreateTeamMembershipSchema>;

/**
 * Schema for updating an existing TeamMembership.
 * - role: required enum value (OWNER, ADMIN, EDITOR, VIEWER, USER)
 */
export const UpdateTeamMembershipSchema = z.object({
  role: TeamRoleEnum,
});

export type UpdateTeamMembershipInput = z.infer<typeof UpdateTeamMembershipSchema>;

/**
 * Schema for validating UUID path parameters.
 */
export const IdParamSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

/**
 * Schema for query parameters when listing team groups.
 * - search: optional string for case-insensitive name search
 * - includeInactive: optional boolean to include inactive teams
 * - page: optional page number for pagination
 * - pageSize: optional page size for pagination
 */
export const ListTeamGroupsQuerySchema = z.object({
  search: z.string().max(255).optional(),
  includeInactive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListTeamGroupsQuery = z.infer<typeof ListTeamGroupsQuerySchema>;

/**
 * Schema for query parameters when listing team members.
 * - search: optional string for case-insensitive name/email search
 * - page: optional page number for pagination
 * - pageSize: optional page size for pagination
 */
export const ListTeamMembersQuerySchema = z.object({
  search: z.string().max(255).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export type ListTeamMembersQuery = z.infer<typeof ListTeamMembersQuerySchema>;
