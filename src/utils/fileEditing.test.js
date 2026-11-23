import { describe, expect, it } from 'vitest'
import { canEditInBrowser, editedCopyName, folderFromObjectKey, hasMatchingExtension } from './fileEditing.js'

describe('file editing helpers', () => {
  it('derives backend-relative folders from object keys', () => {
    expect(folderFromObjectKey('company/reports/2026/id-file.txt')).toBe('reports/2026/')
    expect(folderFromObjectKey('company/id-file.txt')).toBe('')
  })

  it('builds an explicit edited-copy name without changing the extension', () => {
    expect(editedCopyName('care-plan.docx')).toBe('care-plan-edited.docx')
    expect(editedCopyName('LICENSE')).toBe('LICENSE-edited')
    expect(editedCopyName(`${'a'.repeat(160)}.txt`).length).toBeLessThanOrEqual(150)
  })

  it('only claims direct browser editing for safe round-trip formats', () => {
    expect(canEditInBrowser('text')).toBe(true)
    expect(canEditInBrowser('spreadsheet')).toBe(true)
    expect(canEditInBrowser('docx')).toBe(true)
    expect(canEditInBrowser('pdf')).toBe(false)
    expect(hasMatchingExtension('scan.PDF', 'scan-updated.pdf')).toBe(true)
  })
})
