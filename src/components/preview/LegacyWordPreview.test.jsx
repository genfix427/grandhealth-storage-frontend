import { describe, expect, it } from 'vitest'
import { isOleDocument, isZipDocument } from './LegacyWordPreview.jsx'

function buffer(bytes) {
  return Uint8Array.from(bytes).buffer
}

describe('legacy Word format detection', () => {
  it('recognizes genuine OLE compound documents', () => {
    expect(isOleDocument(buffer([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe(true)
    expect(isOleDocument(buffer([0xd0, 0xcf, 0x11, 0xe0]))).toBe(false)
  })

  it('recognizes ZIP-based Office documents mislabeled with a doc extension', () => {
    expect(isZipDocument(buffer([0x50, 0x4b, 0x03, 0x04]))).toBe(true)
    expect(isZipDocument(buffer([0xd0, 0xcf, 0x11, 0xe0]))).toBe(false)
  })
})
