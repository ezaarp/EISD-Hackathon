import { UserRole } from '@prisma/client';

// Define permissions for each role
type Permission =
  | 'create:course'
  | 'edit:course'
  | 'delete:course'
  | 'create:shift'
  | 'edit:shift'
  | 'create:user'
  | 'edit:user'
  | 'create:plotting'
  | 'edit:plotting'
  | 'view:all_students'
  | 'view:own_students'
  | 'create:module'
  | 'edit:module'
  | 'upload:material'
  | 'create:question'
  | 'edit:question'
  | 'control:live_session'
  | 'mark:attendance'
  | 'view:attendance'
  | 'grade:submission'
  | 'approve:grade'
  | 'create:violation'
  | 'verify:violation'
  | 'approve:permission'
  | 'create:announcement'
  | 'view:analytics'
  | 'approve:final_grade'
  | 'upload:media'
  | 'export:data'
  | 'view:audit_log';

const rolePermissions: Record<UserRole, Permission[]> = {
  LABORAN: [
    'create:course',
    'edit:course',
    'delete:course',
    'create:shift',
    'edit:shift',
    'view:analytics',
    'export:data',
  ],
  SEKRETARIS: [
    'create:user',
    'edit:user',
    'create:plotting',
    'edit:plotting',
    'edit:shift',
    'view:all_students',
    'export:data',
    'view:attendance',
  ],
  PUBLIKASI: [
    'create:module',
    'edit:module',
    'upload:material',
    'create:question',
    'edit:question',
    'control:live_session',
    'create:announcement',
  ],
  PRAKTIKAN: [],
  ASISTEN: [
    'view:own_students',
    'grade:submission',
    'view:attendance',
    'create:violation',
  ],
  KOORDINATOR: [
    'view:all_students',
    'view:analytics',
    'view:audit_log',
    'export:data',
  ],
  KOMDIS: [
    'mark:attendance',
    'view:attendance',
    'create:violation',
    'verify:violation',
    'approve:permission',
  ],
  DOSEN: [
    'view:analytics',
    'approve:grade',
    'approve:final_grade',
    'view:all_students',
  ],
  MEDIA: ['upload:media'],
  AI_SYSTEM: ['grade:submission'],
};

/**
 * Check if a user has a specific permission
 */
export function can(userRole: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function canAny(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => can(userRole, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function canAll(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => can(userRole, permission));
}

/**
 * Check if user has one of the allowed roles
 */
export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get all permissions for a role
 */
export function getPermissions(userRole: UserRole): Permission[] {
  return rolePermissions[userRole] || [];
}

export type { Permission };
