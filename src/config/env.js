const raw = {
  appName: import.meta.env.VITE_APP_NAME || 'Grand Health Storage',
  region: import.meta.env.VITE_AWS_REGION || 'us-east-2',
  userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-2_CiJYj3IFB',
  clientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'pf87khqjv33mcahe0ihhmfl95',
  scopes: (import.meta.env.VITE_COGNITO_SCOPES || 'openid email').trim(),
  domain: (import.meta.env.VITE_COGNITO_DOMAIN || '').replace(/\/$/, ''),
  redirectUri: import.meta.env.VITE_COGNITO_REDIRECT_URI || `${window.location.origin}/`,
  logoutUri: import.meta.env.VITE_COGNITO_LOGOUT_URI || `${window.location.origin}/`,
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || 'https://9k2rsou9j8.execute-api.us-east-2.amazonaws.com').replace(/\/$/, ''),
  googleWorkspaceEnabled: import.meta.env.VITE_GOOGLE_WORKSPACE_ENABLED === 'true',
}

export const env = Object.freeze(raw)

export const configurationErrors = [
  !raw.domain && 'VITE_COGNITO_DOMAIN is required before sign-in can be used.',
  !raw.clientId && 'VITE_COGNITO_CLIENT_ID is required.',
  !raw.userPoolId && 'VITE_COGNITO_USER_POOL_ID is required.',
  !raw.apiBaseUrl && 'VITE_API_BASE_URL is required.',
].filter(Boolean)
