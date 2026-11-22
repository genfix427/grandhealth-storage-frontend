import { ApiError } from './apiClient.js'

export function createFilesApi(apiRequest) {
  return {
    list({ folder = '', cursor, signal } = {}) {
      const params = new URLSearchParams()
      if (folder) params.set('folder', folder)
      if (cursor) params.set('cursor', cursor)
      const query = params.toString()
      return apiRequest(`/files${query ? `?${query}` : ''}`, { signal })
    },
    createUploadUrl(payload, signal) {
      return apiRequest('/files/upload-url', { method: 'POST', body: payload, signal })
    },
    createDownloadUrl(key, signal) {
      return apiRequest('/files/download-url', { method: 'POST', body: { key }, signal })
    },
    createPreviewUrl(key, signal) {
      return apiRequest('/files/download-url', { method: 'POST', body: { key }, signal })
    },
    deleteFile(key, signal) {
      return apiRequest('/files', { method: 'DELETE', body: { key }, signal })
    },
    async deleteFolder(folder, signal) {
      const result = await apiRequest('/folders', { method: 'DELETE', body: { folder }, signal })
      if (result?.errors?.length) throw new ApiError('Folder deletion failed or partially completed.', { status: 500, code: 'PARTIAL_FOLDER_DELETE', details: result.errors })
      return result
    },
  }
}
