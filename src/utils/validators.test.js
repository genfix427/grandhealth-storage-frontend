import { describe, expect, it } from 'vitest'
import { buildBreadcrumbs, isFolderMarker, MAX_FILE_SIZE, normalizeFolder, validateFileName, validateFileSize, validateFolderName } from './validators.js'

describe('upload validation', () => {
  it('accepts backend-compatible filenames', () => expect(validateFileName('Annual_Report-2026.pdf')).toBeNull())
  it('accepts safe spaces and punctuation in filenames', () => expect(validateFileName('professional portfolio (final).env')).toBeNull())
  it('rejects path separators and unsafe filename characters', () => expect(validateFileName('../annual/report.pdf')).toMatch(/cannot contain/))
  it('enforces the current 100 MB limit', () => {
    expect(validateFileSize(MAX_FILE_SIZE)).toBeNull()
    expect(validateFileSize(MAX_FILE_SIZE + 1)).toMatch(/100 MB/)
  })
})

describe('folder navigation', () => {
  it('accepts safe folder names with spaces', () => expect(validateFolderName('Professional Portfolio 2026')).toBeNull())
  it('rejects folder names that could alter the object path', () => expect(validateFolderName('../private')).toMatch(/cannot contain/))
  it('recognizes internal folder marker objects', () => expect(isFolderMarker({ key: 'company/reports/.folder', name: '.folder' })).toBe(true))
  it('strips the private company prefix and normalizes slashes', () => expect(normalizeFolder('company/reports/2026/')).toBe('reports/2026/'))
  it('builds navigable breadcrumb values', () => expect(buildBreadcrumbs('reports/2026/')).toEqual([
    { label: 'My Files', value: '' }, { label: 'reports', value: 'reports/' }, { label: '2026', value: 'reports/2026/' },
  ]))
})
