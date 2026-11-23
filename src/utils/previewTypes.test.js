import { describe, expect, it } from 'vitest'
import { getPreviewKind, getPreviewLimitError, PREVIEW_KINDS, PREVIEW_LIMITS, previewNeedsSignedUrl } from './previewTypes.js'

describe('preview type detection', () => {
  it.each([
    ['scan.JPG', PREVIEW_KINDS.IMAGE], ['report.pdf', PREVIEW_KINDS.PDF], ['letter.docx', PREVIEW_KINDS.DOCX], ['old-letter.doc', PREVIEW_KINDS.LEGACY_DOC],
    ['budget.xlsx', PREVIEW_KINDS.SPREADSHEET], ['people.csv', PREVIEW_KINDS.SPREADSHEET], ['notes.json', PREVIEW_KINDS.TEXT], ['professional portfolio.env', PREVIEW_KINDS.TEXT],
    ['meeting.mp4', PREVIEW_KINDS.VIDEO], ['briefing.mp3', PREVIEW_KINDS.AUDIO], ['slides.pptx', PREVIEW_KINDS.POWERPOINT],
  ])('maps %s to %s', (name, kind) => expect(getPreviewKind({ name })).toBe(kind))

  it('keeps unsupported files honest', () => expect(getPreviewKind({ name: 'archive.zip' })).toBe(PREVIEW_KINDS.UNSUPPORTED))
  it('recognizes Google Workspace metadata separately', () => expect(getPreviewKind({ name: 'plan', mimeType: 'application/vnd.google-apps.document' })).toBe(PREVIEW_KINDS.GOOGLE))
  it('uses a safe text MIME fallback for extensionless files', () => expect(getPreviewKind({ name: 'LICENSE', mimeType: 'text/plain' })).toBe(PREVIEW_KINDS.TEXT))
  it('does not request S3 preview URLs for conversion-only formats', () => expect(previewNeedsSignedUrl(PREVIEW_KINDS.POWERPOINT)).toBe(false))
  it('requests a private S3 URL for locally rendered legacy Word files', () => expect(previewNeedsSignedUrl(PREVIEW_KINDS.LEGACY_DOC)).toBe(true))
  it('blocks oversized client-side parsing', () => expect(getPreviewLimitError({ name: 'large.json', size: PREVIEW_LIMITS.text + 1 })).toMatch(/5 MB/))
})
