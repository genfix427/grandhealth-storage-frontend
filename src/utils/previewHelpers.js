export function isInteractiveTarget(target) {
  return target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button, [contenteditable="true"], audio, video'))
}

export async function fetchPreviewBuffer(url, { signal, maxBytes, expectedBytes } = {}) {
  if (maxBytes && expectedBytes > maxBytes) throw new Error('FILE_TOO_LARGE')
  let response
  try { response = await fetch(url, { signal, credentials: 'omit' }) }
  catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new Error('PREVIEW_NETWORK_OR_CORS', { cause: error })
  }
  if (!response.ok) {
    if ([401, 403].includes(response.status)) throw new Error('PREVIEW_URL_EXPIRED')
    if (response.status === 404) throw new Error('PREVIEW_NOT_FOUND')
    throw new Error('PREVIEW_FETCH_FAILED')
  }
  const contentLength = Number(response.headers.get('content-length'))
  if (maxBytes && contentLength && contentLength > maxBytes) throw new Error('FILE_TOO_LARGE')
  const buffer = await response.arrayBuffer()
  if (maxBytes && buffer.byteLength > maxBytes) throw new Error('FILE_TOO_LARGE')
  return buffer
}

export function previewErrorMessage(error) {
  if (error?.status === 401) return 'Your session expired. Sign in again before requesting a preview.'
  if (error?.status === 403) return 'You do not have permission to preview this file.'
  if (error?.status === 404) return 'This file could not be found in storage.'
  if (error?.status >= 500) return 'The storage service could not generate a preview link. Try again after the backend issue is resolved.'
  const code = error?.message
  return ({
    FILE_TOO_LARGE: 'This file is too large for a safe browser preview. Download the original file instead.',
    PREVIEW_NETWORK_OR_CORS: 'The preview could not reach private storage. Check your connection and the S3 GET/HEAD CORS configuration.',
    PREVIEW_URL_EXPIRED: 'The secure preview link expired or access was denied. Request a fresh preview and try again.',
    PREVIEW_NOT_FOUND: 'This file could not be found in storage.',
    PREVIEW_FETCH_FAILED: 'The file could not be loaded for preview.',
    INVALID_LEGACY_DOC: 'This file does not contain a valid Word 97–2003 document. It may have the wrong extension or be damaged.',
    LEGACY_DOC_ENCRYPTED: 'Password-protected legacy Word documents cannot be previewed. Download the original and open it in Microsoft Word.',
    LEGACY_DOC_UNSUPPORTED: 'This legacy Word document uses content the browser renderer could not read. Download the original to open it in Microsoft Word.',
    UNSUPPORTED_CODEC: 'Your browser cannot play this media codec. Download the original file or use a compatible player.',
  })[code] || 'This file could not be rendered. It may be corrupted or use an unsupported format.'
}

export function columnLabel(index) {
  let value = index + 1
  let label = ''
  while (value > 0) { value -= 1; label = String.fromCharCode(65 + (value % 26)) + label; value = Math.floor(value / 26) }
  return label
}
