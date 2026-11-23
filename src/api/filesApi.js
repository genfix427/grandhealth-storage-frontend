import { ApiError } from './apiClient.js'

export async function putPresignedFile(url, data, { signal, fetchImpl = fetch } = {}) {
  let response
  try {
    response = await fetchImpl(url, {
      method: 'PUT',
      signal,
      credentials: 'omit',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data,
    })
  } catch (cause) {
    if (cause?.name === 'AbortError') throw cause
    throw new ApiError('Unable to upload the edited file. Check your connection.', { code: 'NETWORK_ERROR' })
  }
  if (!response.ok) throw new ApiError('The edited file could not be saved to secure storage.', { status: response.status, code: 'S3_UPLOAD_FAILED' })
}

export function createFilesApi(apiRequest, putImpl = putPresignedFile) {
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
    async saveEditedCopy({ filename, folder = '', data, signal }) {
      const upload = await apiRequest('/files/upload-url', {
        method: 'POST',
        body: { filename, folder, size: data.size },
        signal,
      })
      if (!upload?.url || !upload?.key) throw new ApiError('The server did not return a valid upload destination.', { code: 'INVALID_UPLOAD_RESPONSE' })
      await putImpl(upload.url, data, { signal })
      return { ...upload, filename, size: data.size }
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
