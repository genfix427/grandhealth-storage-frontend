import { beforeEach, describe, expect, it, vi } from 'vitest'

const clearOAuthParameters = vi.fn()

vi.mock('./cognitoConfig.js', () => ({ clearOAuthParameters }))

describe('OAuth callback processing', () => {
  beforeEach(() => clearOAuthParameters.mockClear())

  it('redeems an authorization code only once during concurrent StrictMode effects', async () => {
    const user = { access_token: 'test-token' }
    const manager = { signinRedirectCallback: vi.fn().mockResolvedValue(user) }
    const { processOAuthCallback } = await import('./oauthCallback.js')

    await expect(Promise.all([processOAuthCallback(manager), processOAuthCallback(manager)])).resolves.toEqual([user, user])
    expect(manager.signinRedirectCallback).toHaveBeenCalledTimes(1)
    expect(clearOAuthParameters).toHaveBeenCalledTimes(1)
  })
})
