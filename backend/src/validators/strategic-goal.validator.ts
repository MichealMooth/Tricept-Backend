/**
 * Strategic Goal Validation Schemas
 *
 * Zod schemas for validating API input for StrategicGoal endpoints.
 * These schemas ensure type safety and input validation at the API boundary.
 *
 * Task Group 5.2: Update StrategicGoal Zod schemas with scope support
 */

import { z } from 'zod';

/**
 * Valid DataScope values for strategic goals.
 * - GLOBAL: visible to all authenticated users
 * - TEAM: visible only to TeamGroup members
 */
export const DataScopeEnum = z.enum(['GLOBAL', 'TEAM']);
export type DataScopeValue = z.infer<typeof DataScopeEnum>;

/**
 * Schema for creating a new StrategicGoal.
 * - key: required, unique identifier
 * - title: required, display name
 * - description: optional description
 * - displayOrder: optional, defaults to 0
 * - isActive: optional, defaults to true
 * - scope: optional, defaults to GLOBAL
 * - teamGroupId: required when scope=TEAM, null otherwise
 */
export const CreateStrategicGoalSchema = z
  .object({
    key: z
      .string()
      .min(1, 'Key is required')
      .max(50, 'Key must not exceed 50 characters'),
    title: z
      .string()
      .min(1, 'Title is required')
      .max(255, 'Title must not exceed 255 characters'),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .nullable(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    scope: DataScopeEnum.optional().default('GLOBAL'),
    teamGroupId: z.string().uuid('Invalid teamGroupId format').optional().nullable(),
  })
  .refine(
    (data) => {
      // If scope is TEAM, teamGroupId is required
      if (data.scope === 'TEAM') {
        return data.teamGroupId != null && data.teamGroupId.length > 0;
      }
      return true;
    },
    {
      message: 'teamGroupId is required when scope is TEAM',
      path: ['teamGroupId'],
    }
  );

export type CreateStrategicGoalInput = z.infer<typeof CreateStrategicGoalSchema>;

/**
 * Schema for updating an existing StrategicGoal.
 * All fields are optional for partial updates.
 * Conditional validation: if scope is being set to TEAM, teamGroupId is required.
 */
export const UpdateStrategicGoalSchema = z
  .object({
    key: z
      .string()
      .min(1, 'Key cannot be empty')
      .max(50, 'Key must not exceed 50 characters')
      .optional(),
    title: z
      .string()
      .min(1, 'Title cannot be empty')
      .max(255, 'Title must not exceed 255 characters')
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .nullable(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    scope: DataScopeEnum.optional(),
    teamGroupId: z.string().uuid('Invalid teamGroupId format').optional().nullable(),
  })
  .refine(
    (data) => {
      // If scope is being updated to TEAM, teamGroupId must be provided
      if (data.scope === 'TEAM') {
        return data.teamGroupId != null && data.teamGroupId.length > 0;
      }
      return true;
    },
    {
      message: 'teamGroupId is required when scope is TEAM',
      path: ['teamGroupId'],
    }
  );

export type UpdateStrategicGoalInput = z.infer<typeof UpdateStrategicGoalSchema>;

/**
 * Schema for rating validation (matches database CHECK constraint 1-5).
 */
export const StrategicGoalRatingSchema = z.object({
  goalId: z.string().uuid('Invalid goalId format'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().max(2000, 'Comment must not exceed 2000 characters').optional().nullable(),
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional(),
});

export type StrategicGoalRatingInput = z.infer<typeof StrategicGoalRatingSchema>;

/**
 * Schema for importing multiple goals from JSON.
 * Similar to CreateStrategicGoalSchema but in array form.
 */
export const ImportStrategicGoalsSchema = z.array(
  z.object({
    key: z.string().min(1),
    title: z.string().min(1),
    description: z.string().optional().nullable(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    scope: DataScopeEnum.optional(),
    teamGroupId: z.string().uuid().optional().nullable(),
  })
);

export type ImportStrategicGoalsInput = z.infer<typeof ImportStrategicGoalsSchema>;

/**
 * Schema for query parameters when listing strategic goals.
 */
export const ListStrategicGoalsQuerySchema = z.object({
  scope: DataScopeEnum.optional(),
  teamGroupId: z.string().uuid().optional(),
  activeOnly: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export type ListStrategicGoalsQuery = z.infer<typeof ListStrategicGoalsQuerySchema>;
