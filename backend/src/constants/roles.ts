/**
 * System Role Constants
 * Defines user roles for authentication and authorization.
 */

/**
 * Role enum for user roles in the system.
 */
export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/**
 * Array of all roles for iteration.
 */
export const ALL_ROLES = Object.values(Role);

/**
 * Type guard to check if a string is a valid Role.
 */
export function isValidRole(value: string): value is Role {
  return ALL_ROLES.includes(value as Role);
}
