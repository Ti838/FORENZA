import { AppRole } from '@/types'

// ---------------------------------------------------------------------------
// RBAC Permission Matrix
// Defines which roles can perform which actions.
// These are APPLICATION-LEVEL checks — always paired with RLS.
// ---------------------------------------------------------------------------

export type Permission =
  // Case permissions
  | 'case:create'
  | 'case:read'
  | 'case:update'
  | 'case:assign_officer'
  | 'case:change_status'
  | 'case:grant_judicial_access'
  // Evidence permissions
  | 'evidence:register'
  | 'evidence:capture'
  | 'evidence:classify'
  | 'evidence:seal'
  | 'evidence:read'
  | 'evidence:read_media'
  | 'evidence:transfer_initiate'
  | 'evidence:transfer_receive'
  | 'evidence:verify_integrity'
  // Telemetry
  | 'telemetry:submit'
  | 'telemetry:read'
  // Vault
  | 'vault:receive'
  | 'vault:assign_location'
  | 'vault:read'
  // Lab
  | 'lab:receive'
  | 'lab:register_sample'
  | 'lab:consume_sample'
  | 'lab:upload_report'
  | 'lab:read'
  // Judicial
  | 'judicial:read_case'
  | 'judicial:read_evidence'
  | 'judicial:read_timeline'
  | 'judicial:read_map'
  | 'judicial:verify_integrity'
  | 'judicial:generate_dossier'
  // Override
  | 'override:request'
  | 'override:approve'
  // Audit
  | 'audit:read'
  | 'audit:read_security_events'
  // Admin
  | 'admin:create_user'
  | 'admin:manage_roles'
  | 'admin:approve_device'
  | 'admin:revoke_device'
  | 'admin:read_all'
  | 'admin:system_health'

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  ADMIN: [
    'case:create', 'case:read', 'case:update', 'case:assign_officer',
    'case:change_status', 'case:grant_judicial_access',
    'evidence:read', 'evidence:read_media', 'evidence:verify_integrity',
    'telemetry:read',
    'vault:read',
    'lab:read',
    'audit:read', 'audit:read_security_events',
    'admin:create_user', 'admin:manage_roles', 'admin:approve_device',
    'admin:revoke_device', 'admin:read_all', 'admin:system_health',
    'override:approve',
  ],
  INVESTIGATING_OFFICER: [
    'case:read',
    'evidence:register', 'evidence:capture', 'evidence:classify',
    'evidence:seal', 'evidence:read', 'evidence:read_media',
    'evidence:transfer_initiate',
    'telemetry:submit',
    'override:request',
  ],
  SUPERVISOR: [
    'case:create', 'case:read', 'case:update', 'case:assign_officer',
    'case:change_status', 'case:grant_judicial_access',
    'evidence:read', 'evidence:read_media', 'evidence:verify_integrity',
    'evidence:transfer_receive',
    'telemetry:read',
    'vault:read',
    'lab:read',
    'audit:read',
    'override:approve',
  ],
  VAULT_CUSTODIAN: [
    'case:read',
    'evidence:read', 'evidence:read_media', 'evidence:verify_integrity',
    'evidence:transfer_receive',
    'vault:receive', 'vault:assign_location', 'vault:read',
  ],
  LAB_ANALYST: [
    'case:read',
    'evidence:read', 'evidence:read_media', 'evidence:verify_integrity',
    'evidence:transfer_receive',
    'lab:receive', 'lab:register_sample', 'lab:consume_sample',
    'lab:upload_report', 'lab:read',
  ],
  JUDGE: [
    'judicial:read_case', 'judicial:read_evidence', 'judicial:read_timeline',
    'judicial:read_map', 'judicial:verify_integrity', 'judicial:generate_dossier',
    'telemetry:read',
  ],
  AUDITOR: [
    'case:read',
    'evidence:read', 'evidence:verify_integrity',
    'audit:read', 'audit:read_security_events',
    'vault:read', 'lab:read',
  ],
}

export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission))
}

export function hasAnyPermission(roles: AppRole[], permissions: Permission[]): boolean {
  return permissions.some((perm) => hasPermission(roles, perm))
}

export function hasAllPermissions(roles: AppRole[], permissions: Permission[]): boolean {
  return permissions.every((perm) => hasPermission(roles, perm))
}

export function getRolePermissions(role: AppRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export function getPrimaryRole(roles: AppRole[]): AppRole | null {
  // Priority order for UI routing
  const priority: AppRole[] = [
    'ADMIN', 'SUPERVISOR', 'INVESTIGATING_OFFICER',
    'VAULT_CUSTODIAN', 'LAB_ANALYST', 'JUDGE', 'AUDITOR',
  ]
  return priority.find((r) => roles.includes(r)) ?? null
}

// Dashboard route by primary role
export function getDashboardPath(roles: AppRole[]): string {
  const primary = getPrimaryRole(roles)
  switch (primary) {
    case 'ADMIN':               return '/admin/dashboard'
    case 'SUPERVISOR':          return '/supervisor/dashboard'
    case 'INVESTIGATING_OFFICER': return '/officer/dashboard'
    case 'VAULT_CUSTODIAN':     return '/vault/dashboard'
    case 'LAB_ANALYST':         return '/lab/dashboard'
    case 'JUDGE':               return '/judge/dashboard'
    case 'AUDITOR':             return '/auditor/dashboard'
    default:                    return '/login'
  }
}
