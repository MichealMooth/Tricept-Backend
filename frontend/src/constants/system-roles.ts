/**
 * System Role Constants
 * Defines user roles for system-level authentication and authorization.
 * Note: These are distinct from project roles in enums.ts (Projektleiter, etc.)
 */

/**
 * System-level roles for authentication.
 */
export const SystemRoles = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];

/**
 * i18n label mapping for system roles.
 * German labels for display purposes.
 */
export const systemRoleLabels: Record<SystemRole, string> = {
  [SystemRoles.ADMIN]: 'Administrator',
  [SystemRoles.USER]: 'Benutzer',
};

/**
 * Options array for select dropdowns.
 */
export const systemRoleOptions: { value: SystemRole; label: string }[] = Object.entries(
  systemRoleLabels
).map(([value, label]) => ({
  value: value as SystemRole,
  label,
}));
