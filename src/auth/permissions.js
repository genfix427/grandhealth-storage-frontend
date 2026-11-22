export const ROLES = Object.freeze({ ADMIN: 'Admin', EMPLOYEE: 'Employee', READ_ONLY: 'ReadOnly' })

export const PERMISSIONS = Object.freeze({
  VIEW_FILES: 'view:files',
  UPLOAD_FILES: 'upload:files',
  DOWNLOAD_FILES: 'download:files',
  DELETE_FILES: 'delete:files',
  DELETE_FOLDERS: 'delete:folders',
  VIEW_ADMIN: 'view:admin',
})

const grants = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
  [ROLES.EMPLOYEE]: [PERMISSIONS.VIEW_FILES, PERMISSIONS.UPLOAD_FILES, PERMISSIONS.DOWNLOAD_FILES],
  [ROLES.READ_ONLY]: [PERMISSIONS.VIEW_FILES, PERMISSIONS.DOWNLOAD_FILES],
}

export function getPrimaryRole(groups = []) {
  return [ROLES.ADMIN, ROLES.EMPLOYEE, ROLES.READ_ONLY].find((role) => groups.includes(role)) || ROLES.READ_ONLY
}

export function hasPermission(groups = [], permission) {
  return groups.some((role) => grants[role]?.includes(permission))
}
