import { describe, expect, it } from 'vitest'
import { hasOAuthCallback } from './cognitoConfig.js'

describe('OAuth callback detection', () => {
  it('requires both authorization code and state', () => {
    expect(hasOAuthCallback('?code=secret-code&state=random-state')).toBe(true)
    expect(hasOAuthCallback('?code=secret-code')).toBe(false)
    expect(hasOAuthCallback('?state=random-state')).toBe(false)
  })
  it('recognizes OAuth error callbacks so the UI can report them', () => {
    expect(hasOAuthCallback('?error=invalid_scope&error_description=invalid_scope&state=random-state')).toBe(true)
    expect(hasOAuthCallback('?error=invalid_scope')).toBe(false)
  })
})
