/**
 * Team Module Configuration Validation Schemas
 *
 * Zod schemas for validating API input for module configuration endpoints.
 * These schemas ensure type safety and validate scope against module registry.
 *
 * Task Group 2.5: Create Zod validators for TeamModuleConfig
 */

import { z } from 'zod';
import { isValidModuleId, isValidScope, getModuleById } from '@/config/modules.registry';

/**
 * Valid DataScope values.
 * Matches the DataScope type in authorization.ts.
 */
export const DataScopeEnum = z.enum(['GLOBAL', 'TEAM', 'USER']);
export type DataScopeValue = z.infer<typeof DataScopeEnum>;

/**
 * Schema for creating/updating a TeamModuleConfig.
 * - teamGroupId: required UUID string
 * - moduleId: required string, must be valid module ID from registry
 * - isEnabled: optional boolean (defaults to true)
 * - scope: optional scope, must be valid for the module's allowedScopes
 */
export const UpsertTeamModuleConfigSchema = z
  .object({
    teamGroupId: z.string().uuid('Invalid team group ID format'),
    moduleId: z.string().min(1, 'Module ID is required'),
    isEnabled: z.boolean().optional().default(true),
    scope: DataScopeEnum.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Validate moduleId against registry
    if (!isValidModuleId(data.moduleId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid module ID: ${data.moduleId}`,
        path: ['moduleId'],
      });
      return;
    }

    // Validate scope against module's allowedScopes
    if (data.scope && !isValidScope(data.moduleId, data.scope)) {
      const module = getModuleById(data.moduleId);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Scope '${data.scope}' is not allowed for module '${data.moduleId}'. Allowed: ${module?.allowedScopes.join(', ')}`,
        path: ['scope'],
      });
    }
  });

export type UpsertTeamModuleConfigInput = z.infer<typeof UpsertTeamModuleConfigSchema>;

/**
 * Schema for batch update of module configs for a team.
 * - teamGroupId: required UUID string
 * - configs: array of module configs
 */
export const BatchUpdateModuleConfigsSchema = z.object({
  teamGroupId: z.string().uuid('Invalid team group ID format'),
  configs: z.array(
    z
      .object({
        moduleId: z.string().min(1, 'Module ID is required'),
        isEnabled: z.boolean().optional().default(true),
        scope: DataScopeEnum.optional().nullable(),
      })
      .superRefine((data, ctx) => {
        if (!isValidModuleId(data.moduleId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Invalid module ID: ${data.moduleId}`,
            path: ['moduleId'],
          });
          return;
        }
        if (data.scope && !isValidScope(data.moduleId, data.scope)) {
          const module = getModuleById(data.moduleId);
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Scope '${data.scope}' is not allowed for module '${data.moduleId}'. Allowed: ${module?.allowedScopes.join(', ')}`,
            path: ['scope'],
          });
        }
      })
  ),
});

export type BatchUpdateModuleConfigsInput = z.infer<typeof BatchUpdateModuleConfigsSchema>;

/**
 * Schema for query parameters when listing module configs.
 * - teamGroupId: optional filter by team
 * - moduleId: optional filter by module
 */
export const ListModuleConfigsQuerySchema = z.object({
  teamGroupId: z.string().uuid().optional(),
  moduleId: z.string().optional(),
});

export type ListModuleConfigsQuery = z.infer<typeof ListModuleConfigsQuerySchema>;

/**
 * Schema for audit trail query parameters.
 * - teamGroupId: optional filter by team
 * - moduleId: optional filter by module
 * - fromDate: optional start date
 * - toDate: optional end date
 * - page: optional page number
 * - pageSize: optional page size
 */
export const AuditTrailQuerySchema = z.object({
  teamGroupId: z.string().uuid().optional(),
  moduleId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type AuditTrailQuery = z.infer<typeof AuditTrailQuerySchema>;
