import { clearOAuthParameters } from './cognitoConfig.js'

let pendingCallback = null

// React StrictMode intentionally remounts effects in development. Keep one
// token exchange in flight so an authorization code is never redeemed twice.
export function processOAuthCallback(manager) {
  if (!pendingCallback) {
    pendingCallback = manager.signinRedirectCallback().finally(clearOAuthParameters)
  }
  return pendingCallback
}
