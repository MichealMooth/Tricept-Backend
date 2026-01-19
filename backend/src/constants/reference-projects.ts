/**
 * Reference Projects Constants and Zod Enums
 * These enums are used for validation in the reference projects feature.
 * Values must match the seed data in prisma/seed.ts and frontend/src/constants/enums.ts
 */
import { z } from 'zod';

/**
 * Topics enum for reference projects.
 * Max 6 topics per project (validated at service layer).
 */
export const TopicsEnum = z.enum([
  'Testmanagement',
  'Migration',
  'Cut Over',
  'Agile Transformation',
  'Digitale Transformation',
  'Prozessoptimierung',
  'Regulatorik/Compliance',
  'Informationssicherheit',
]);

export type TopicType = z.infer<typeof TopicsEnum>;

/**
 * Roles enum for reference projects.
 * Note: Using ASCII-safe string for 'Projektunterstuetzung' in database
 * but validation accepts both forms.
 */
export const RolesEnum = z.enum([
  'Projektleiter',
  'IT-Projektleiter',
  'PMO',
  'Testmanager',
  'Projektunterstützung',
  'Business-Analyst',
  'Scrum-Master',
  'Tester',
  'TPL',
  'PO',
]);

export type RoleType = z.infer<typeof RolesEnum>;
