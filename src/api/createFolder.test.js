import { describe, expect, it, vi } from 'vitest'
import { createFolder } from './createFolder.js'

describe('createFolder', () => {
  it('creates a private marker object through the existing signed upload flow', async () => {
    const filesApi = { createUploadUrl: vi.fn().mockResolvedValue({ url: 'https://s3.example/folder' }) }
    const put = vi.fn().mockResolvedValue({ ok: true })

    await expect(createFolder(filesApi, 'reports/', 'Annual Reports', put)).resolves.toBe('reports/Annual Reports/')
    expect(filesApi.createUploadUrl).toHaveBeenCalledWith(expect.objectContaining({ filename: '.folder', folder: 'reports/Annual Reports/' }))
    expect(put).toHaveBeenCalledWith('https://s3.example/folder', expect.objectContaining({ method: 'PUT', credentials: 'omit' }))
  })

  it('does not request a signed URL for an unsafe folder path', async () => {
    const filesApi = { createUploadUrl: vi.fn() }
    await expect(createFolder(filesApi, '', '../private', vi.fn())).rejects.toThrow(/cannot contain/)
    expect(filesApi.createUploadUrl).not.toHaveBeenCalled()
  })
})
