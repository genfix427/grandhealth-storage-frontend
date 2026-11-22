export const MAX_FILE_SIZE = 100 * 1024 * 1024
export const FOLDER_MARKER_NAME = '.folder'
const FORBIDDEN_NAME_CHARACTERS = /[\\/:*?"<>|]/u
const hasControlCharacters = (name) => [...name].some((character) => character.codePointAt(0) < 32 || character.codePointAt(0) === 127)

export function validateFileName(name) {
  if (!name) return 'A filename is required.'
  if (name.length > 150) return 'Filename must be 150 characters or fewer.'
  if (name !== name.trim()) return 'Filename cannot start or end with a space.'
  if (name === '.' || name === '..' || name.endsWith('.')) return 'Choose a complete filename that does not end with a period.'
  if (FORBIDDEN_NAME_CHARACTERS.test(name) || hasControlCharacters(name)) return 'Filename cannot contain \\ / : * ? " < > | or control characters.'
  return null
}

export function validateFolderName(name) {
  if (!name) return 'A folder name is required.'
  if (name.length > 100) return 'Folder name must be 100 characters or fewer.'
  if (name !== name.trim()) return 'Folder name cannot start or end with a space.'
  if (name === '.' || name === '..' || name.endsWith('.')) return 'Choose a folder name that does not end with a period.'
  if (FORBIDDEN_NAME_CHARACTERS.test(name) || hasControlCharacters(name)) return 'Folder name cannot contain \\ / : * ? " < > | or control characters.'
  return null
}

export function validateFileSize(size) {
  if (size > MAX_FILE_SIZE) return 'This file is larger than the current 100 MB per-file limit.'
  if (size <= 0) return 'This file is empty and cannot be uploaded.'
  return null
}

export function validateUploadFile(file) { return validateFileName(file.name) || validateFileSize(file.size) }

export function isFolderMarker(file) {
  return file?.name === FOLDER_MARKER_NAME || file?.key?.split('/').pop() === FOLDER_MARKER_NAME
}

export function normalizeFolder(folder = '') {
  const cleaned = folder.replace(/^company\//, '').replace(/^\/+/, '').replace(/\.{2}/g, '').replace(/\/+$/, '')
  return cleaned ? `${cleaned}/` : ''
}

export function buildBreadcrumbs(folder = '') {
  const segments = folder.split('/').filter(Boolean)
  return [{ label: 'My Files', value: '' }, ...segments.map((segment, index) => ({
    label: segment,
    value: `${segments.slice(0, index + 1).join('/')}/`,
  }))]
}
