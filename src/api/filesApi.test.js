import { describe, expect, it, vi } from 'vitest'
import { createFilesApi } from './filesApi.js'

describe('files API workflows', () => {
  it('passes folder and cursor for paginated listings', async () => {
    const request = vi.fn().mockResolvedValue({ files: [], nextCursor: null })
    await createFilesApi(request).list({ folder: 'reports/', cursor: 'next-page' })
    expect(request).toHaveBeenCalledWith('/files?folder=reports%2F&cursor=next-page', expect.any(Object))
  })
  it('requests an upload URL with file metadata only', async () => {
    const request = vi.fn().mockResolvedValue({ url: 'https://s3.example/upload' })
    const payload = { filename: 'report.pdf', folder: 'reports/', size: 1024 }
    await createFilesApi(request).createUploadUrl(payload)
    expect(request).toHaveBeenCalledWith('/files/upload-url', expect.objectContaining({ method: 'POST', body: payload }))
  })
  it('uses the backend object key for secure downloads', async () => {
    const request = vi.fn().mockResolvedValue({ url: 'https://s3.example/download' })
    await createFilesApi(request).createDownloadUrl('company/reports/id-report.pdf')
    expect(request).toHaveBeenCalledWith('/files/download-url', expect.objectContaining({ body: { key: 'company/reports/id-report.pdf' } }))
  })
  it('reuses the authenticated short-lived download route for previews', async () => {
    const request = vi.fn().mockResolvedValue({ url: 'https://s3.example/preview', expiresIn: 300 })
    await createFilesApi(request).createPreviewUrl('company/reports/scan.pdf')
    expect(request).toHaveBeenCalledWith('/files/download-url', expect.objectContaining({ method: 'POST', body: { key: 'company/reports/scan.pdf' } }))
  })
  it('saves an edited copy through a new presigned upload without deleting the original', async () => {
    const request = vi.fn().mockResolvedValue({ url: 'https://s3.example/upload-edit', key: 'company/reports/id-report-edited.txt' })
    const put = vi.fn().mockResolvedValue(undefined)
    const data = new Blob(['updated'])
    const result = await createFilesApi(request, put).saveEditedCopy({ filename: 'report-edited.txt', folder: 'reports/', data })
    expect(request).toHaveBeenCalledWith('/files/upload-url', expect.objectContaining({ method: 'POST', body: { filename: 'report-edited.txt', folder: 'reports/', size: data.size } }))
    expect(put).toHaveBeenCalledWith('https://s3.example/upload-edit', data, expect.objectContaining({ signal: undefined }))
    expect(result.key).toBe('company/reports/id-report-edited.txt')
  })
  it('deletes a file by its backend object key', async () => {
    const request = vi.fn().mockResolvedValue({ deleted: true })
    await createFilesApi(request).deleteFile('company/reports/report.pdf')
    expect(request).toHaveBeenCalledWith('/files', expect.objectContaining({ method: 'DELETE', body: { key: 'company/reports/report.pdf' } }))
  })
  it('deletes a folder prefix and rejects partial completion', async () => {
    const request = vi.fn().mockResolvedValueOnce({ deleted: 3 }).mockResolvedValueOnce({ errors: ['company/reports/locked.pdf'] })
    await expect(createFilesApi(request).deleteFolder('reports/')).resolves.toEqual({ deleted: 3 })
    await expect(createFilesApi(request).deleteFolder('reports/')).rejects.toMatchObject({ code: 'PARTIAL_FOLDER_DELETE' })
    expect(request).toHaveBeenCalledWith('/folders', expect.objectContaining({ method: 'DELETE', body: { folder: 'reports/' } }))
  })
})
