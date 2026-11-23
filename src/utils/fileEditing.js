import { getFileExtension } from './fileTypes.js'

export const DIRECT_EDIT_KINDS = new Set(['text', 'spreadsheet', 'docx'])

export function canEditInBrowser(kind) {
  return DIRECT_EDIT_KINDS.has(kind)
}

export function folderFromObjectKey(key = '') {
  const clean = String(key).replace(/^company\//, '').replace(/^\/+/, '')
  const parts = clean.split('/').filter(Boolean)
  parts.pop()
  return parts.length ? `${parts.join('/')}/` : ''
}

export function editedCopyName(name = 'file') {
  const extension = getFileExtension(name)
  const suffix = extension ? `.${extension}` : ''
  const base = suffix ? name.slice(0, -suffix.length) : name
  const marker = '-edited'
  const maximumBaseLength = Math.max(1, 150 - marker.length - suffix.length)
  return `${base.slice(0, maximumBaseLength)}${marker}${suffix}`
}

export function hasMatchingExtension(originalName, revisedName) {
  return getFileExtension(originalName) === getFileExtension(revisedName)
}

export function textMimeType(name = '') {
  const extension = getFileExtension(name)
  if (extension === 'json') return 'application/json;charset=utf-8'
  if (extension === 'xml') return 'application/xml;charset=utf-8'
  if (extension === 'csv') return 'text/csv;charset=utf-8'
  if (extension === 'md') return 'text/markdown;charset=utf-8'
  return 'text/plain;charset=utf-8'
}
