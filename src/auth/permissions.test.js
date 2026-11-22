import { describe, expect, it } from 'vitest'
import { getPrimaryRole, hasPermission, PERMISSIONS, ROLES } from './permissions.js'

describe('role permissions', () => {
  it('allows Admin upload and admin access', () => {
    expect(hasPermission([ROLES.ADMIN], PERMISSIONS.UPLOAD_FILES)).toBe(true)
    expect(hasPermission([ROLES.ADMIN], PERMISSIONS.VIEW_ADMIN)).toBe(true)
    expect(hasPermission([ROLES.ADMIN], PERMISSIONS.DELETE_FILES)).toBe(true)
    expect(hasPermission([ROLES.ADMIN], PERMISSIONS.DELETE_FOLDERS)).toBe(true)
  })
  it('prevents Employee deletion', () => expect(hasPermission([ROLES.EMPLOYEE], PERMISSIONS.DELETE_FILES)).toBe(false))
  it('prevents ReadOnly uploads', () => expect(hasPermission([ROLES.READ_ONLY], PERMISSIONS.UPLOAD_FILES)).toBe(false))
  it('defaults unrecognized users to ReadOnly', () => expect(getPrimaryRole(['External'])).toBe(ROLES.READ_ONLY))
})
