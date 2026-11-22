import { FOLDER_MARKER_NAME, normalizeFolder, validateFolderName } from '../utils/validators.js'

const FOLDER_MARKER_CONTENT = 'Grand Health folder\n'

export async function createFolder(filesApi, parentFolder, name, put = fetch) {
  const error = validateFolderName(name)
  if (error) throw new Error(error)

  const folder = normalizeFolder(`${parentFolder}${name}`)
  const size = new TextEncoder().encode(FOLDER_MARKER_CONTENT).byteLength
  const signed = await filesApi.createUploadUrl({ filename: FOLDER_MARKER_NAME, folder, size })
  if (!signed?.url) throw new Error('The storage service did not return an upload URL.')

  const response = await put(signed.url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: FOLDER_MARKER_CONTENT,
    credentials: 'omit',
  })
  if (!response.ok) throw new Error('The folder marker could not be stored in S3.')
  return folder
}
