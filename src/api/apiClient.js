export class ApiError extends Error {
  constructor(message, { status = 0, code = 'UNKNOWN_ERROR', details = null, requestId = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
    this.requestId = requestId
  }
}

const messages = {
  400: 'The request could not be completed. Please check the details and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource could not be found.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Something went wrong while accessing cloud storage.',
}

export function createApiClient({ baseUrl, getAccessToken, fetchImpl = fetch }) {
  return async function apiRequest(path, { method = 'GET', body, signal, headers = {} } = {}) {
    let token
    try { token = await getAccessToken() } catch {
      throw new ApiError(messages[401], { status: 401, code: 'SESSION_EXPIRED' })
    }
    let response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        signal,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause
      throw new ApiError('Unable to connect to the server. Check your internet connection.', { code: 'NETWORK_ERROR' })
    }
    if (!response.ok) {
      let details = null
      try { details = await response.json() } catch { /* response may be empty */ }
      const requestId = response.headers.get('x-amzn-requestid') || response.headers.get('x-amz-apigw-id') || details?.requestId || null
      throw new ApiError(details?.error || messages[response.status] || messages[500], { status: response.status, code: details?.code, details, requestId })
    }
    if (response.status === 204) return null
    return response.json()
  }
}
