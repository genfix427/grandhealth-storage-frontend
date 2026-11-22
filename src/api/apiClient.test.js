import { describe, expect, it, vi } from 'vitest'
import { ApiError, createApiClient } from './apiClient.js'

describe('authenticated API client', () => {
  it('attaches the Cognito access token and parses JSON', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ files: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const request = createApiClient({ baseUrl: 'https://api.example.com', getAccessToken: async () => 'access-token', fetchImpl })
    await expect(request('/files')).resolves.toEqual({ files: [] })
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.com/files', expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer access-token' }) }))
  })
  it('maps an expired session to a safe 401 error', async () => {
    const request = createApiClient({ baseUrl: 'https://api.example.com', getAccessToken: async () => { throw new Error('expired') }, fetchImpl: vi.fn() })
    await expect(request('/files')).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
  })
  it('maps forbidden responses without exposing backend details', async () => {
    const request = createApiClient({ baseUrl: 'https://api.example.com', getAccessToken: async () => 'token', fetchImpl: vi.fn().mockResolvedValue(new Response('{}', { status: 403 })) })
    await expect(request('/files')).rejects.toEqual(expect.objectContaining({ status: 403, message: 'You do not have permission to perform this action.' }))
  })
  it('retains the AWS request reference for backend failures', async () => {
    const response = new Response(JSON.stringify({ message: 'Internal Server Error' }), { status: 500, headers: { 'x-amzn-requestid': 'request-123' } })
    const request = createApiClient({ baseUrl: 'https://api.example.com', getAccessToken: async () => 'token', fetchImpl: vi.fn().mockResolvedValue(response) })
    await expect(request('/files')).rejects.toMatchObject({ status: 500, requestId: 'request-123' })
  })
  it('uses the centralized error type', () => expect(new ApiError('test')).toBeInstanceOf(Error))
})
