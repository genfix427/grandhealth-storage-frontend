import { WebStorageStateStore } from 'oidc-client-ts'
import { env } from '../config/env.js'

export const cognitoSettings = {
  authority: `https://cognito-idp.${env.region}.amazonaws.com/${env.userPoolId}`,
  client_id: env.clientId,
  redirect_uri: env.redirectUri,
  post_logout_redirect_uri: env.logoutUri,
  response_type: 'code',
  scope: env.scopes,
  loadUserInfo: false,
  monitorSession: false,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),
  metadata: env.domain ? {
    issuer: `https://cognito-idp.${env.region}.amazonaws.com/${env.userPoolId}`,
    authorization_endpoint: `${env.domain}/oauth2/authorize`,
    token_endpoint: `${env.domain}/oauth2/token`,
    userinfo_endpoint: `${env.domain}/oauth2/userInfo`,
    end_session_endpoint: `${env.domain}/logout`,
    jwks_uri: `https://cognito-idp.${env.region}.amazonaws.com/${env.userPoolId}/.well-known/jwks.json`,
  } : undefined,
}

export function hasOAuthCallback(search = window.location.search) {
  const params = new URLSearchParams(search)
  return params.has('state') && (params.has('code') || params.has('error'))
}

export function clearOAuthParameters() {
  const url = new URL(window.location.href)
  ;['code', 'state', 'session_state', 'error', 'error_description'].forEach((key) => url.searchParams.delete(key))
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`)
}
