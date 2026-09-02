import { describe, it, expect } from 'vitest'
import { hasPermission, getDashboardPath } from '../lib/rbac'
import { AppRole } from '../types'

describe('FORENZA RBAC Permission Matrix', () => {
  it('enforces ADMIN role permissions', () => {
    const adminRoles: AppRole[] = ['ADMIN']
    expect(hasPermission(adminRoles, 'admin:manage_users')).toBe(true)
    expect(hasPermission(adminRoles, 'admin:manage_devices')).toBe(true)
    expect(hasPermission(adminRoles, 'override:approve')).toBe(true)
    expect(hasPermission(adminRoles, 'audit:read')).toBe(true)
    expect(hasPermission(adminRoles, 'evidence:register')).toBe(false) // Admin cannot register evidence directly
  })

  it('enforces INVESTIGATING_OFFICER role permissions', () => {
    const officerRoles: AppRole[] = ['INVESTIGATING_OFFICER']
    expect(hasPermission(officerRoles, 'evidence:register')).toBe(true)
    expect(hasPermission(officerRoles, 'evidence:capture')).toBe(true)
    expect(hasPermission(officerRoles, 'evidence:seal')).toBe(true)
    expect(hasPermission(officerRoles, 'evidence:transfer_initiate')).toBe(true)
    expect(hasPermission(officerRoles, 'override:request')).toBe(true)
    expect(hasPermission(officerRoles, 'override:approve')).toBe(false)
    expect(hasPermission(officerRoles, 'admin:manage_users')).toBe(false)
  })

  it('enforces JUDGE role permissions (Strictly Read-Only)', () => {
    const judgeRoles: AppRole[] = ['JUDGE']
    expect(hasPermission(judgeRoles, 'judicial:read')).toBe(true)
    expect(hasPermission(judgeRoles, 'judicial:generate_dossier')).toBe(true)
    expect(hasPermission(judgeRoles, 'evidence:verify_integrity')).toBe(true)
    expect(hasPermission(judgeRoles, 'evidence:register')).toBe(false)
    expect(hasPermission(judgeRoles, 'evidence:seal')).toBe(false)
    expect(hasPermission(judgeRoles, 'evidence:transfer_receive')).toBe(false)
    expect(hasPermission(judgeRoles, 'admin:create_user')).toBe(false)
  })

  it('enforces LAB_ANALYST role permissions', () => {
    const labRoles: AppRole[] = ['LAB_ANALYST']
    expect(hasPermission(labRoles, 'lab:receive')).toBe(true)
    expect(hasPermission(labRoles, 'lab:register_sample')).toBe(true)
    expect(hasPermission(labRoles, 'lab:upload_report')).toBe(true)
    expect(hasPermission(labRoles, 'case:create')).toBe(false)
  })

  it('routes primary roles to correct dashboards', () => {
    expect(getDashboardPath(['ADMIN'])).toBe('/admin/dashboard')
    expect(getDashboardPath(['SUPERVISOR'])).toBe('/supervisor/dashboard')
    expect(getDashboardPath(['INVESTIGATING_OFFICER'])).toBe('/officer/dashboard')
    expect(getDashboardPath(['VAULT_CUSTODIAN'])).toBe('/vault/dashboard')
    expect(getDashboardPath(['LAB_ANALYST'])).toBe('/lab/dashboard')
    expect(getDashboardPath(['JUDGE'])).toBe('/judge/dashboard')
    expect(getDashboardPath(['AUDITOR'])).toBe('/auditor/dashboard')
  })
})
