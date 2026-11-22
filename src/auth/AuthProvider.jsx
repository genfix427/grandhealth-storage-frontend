import { useCallback, useEffect, useMemo, useState } from 'react'
import { UserManager } from 'oidc-client-ts'
import { toast } from 'sonner'
import { cognitoSettings, clearOAuthParameters, hasOAuthCallback } from './cognitoConfig.js'
import { processOAuthCallback } from './oauthCallback.js'
import { configurationErrors, env } from '../config/env.js'
import { AuthContext } from './useAuth.js'
import { getPrimaryRole, hasPermission } from './permissions.js'

function toIdentity(user) {
  const profile = user?.profile || {}
  const rawGroups = profile['cognito:groups']
  const groups = Array.isArray(rawGroups) ? rawGroups : rawGroups ? [rawGroups] : []
  return {
    name: profile.name || profile.given_name || profile.email || 'Grand Health user',
    email: profile.email || 'Not provided',
    username: profile['cognito:username'] || profile.preferred_username || profile.sub || 'Unknown',
    groups,
    role: getPrimaryRole(groups),
  }
}

export function AuthProvider({ children }) {
  const [manager] = useState(() => configurationErrors.length ? null : new UserManager(cognitoSettings))
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(configurationErrors.length ? 'configuration-error' : 'loading')
  const [error, setError] = useState(null)

  const acceptUser = useCallback((nextUser) => {
    setUser(nextUser && !nextUser.expired ? nextUser : null)
    setStatus(nextUser && !nextUser.expired ? 'authenticated' : 'unauthenticated')
  }, [])

  useEffect(() => {
    if (!manager) return undefined
    const onExpired = () => {
      setUser(null)
      setStatus('unauthenticated')
      toast.error('Your session has expired. Please sign in again.')
    }
    const onLoaded = (loadedUser) => acceptUser(loadedUser)
    manager.events.addAccessTokenExpired(onExpired)
    manager.events.addUserLoaded(onLoaded)
    ;(async () => {
      try {
        if (hasOAuthCallback()) {
          const callbackUser = await processOAuthCallback(manager)
          acceptUser(callbackUser)
          toast.success('Welcome back. Your secure workspace is ready.')
          return
        }
        acceptUser(await manager.getUser())
      } catch (cause) {
        clearOAuthParameters()
        setError(cause)
        setStatus('unauthenticated')
      }
    })()
    return () => {
      manager.events.removeAccessTokenExpired(onExpired)
      manager.events.removeUserLoaded(onLoaded)
    }
  }, [acceptUser, manager])

  const signIn = useCallback(async () => {
    if (!manager) return
    setError(null)
    setStatus('loading')
    try {
      await manager.signinRedirect()
    } catch (cause) {
      setError(cause)
      setStatus('unauthenticated')
    }
  }, [manager])

  const signOut = useCallback(async () => {
    if (!manager) return
    try {
      await manager.removeUser()
      setUser(null)
      setStatus('unauthenticated')
      await manager.signoutRedirect({ extraQueryParams: { client_id: env.clientId, logout_uri: env.logoutUri } })
    } catch {
      setUser(null)
      setStatus('unauthenticated')
      window.location.assign('/login')
    }
  }, [manager])

  const getAccessToken = useCallback(async () => {
    let current = await manager?.getUser()
    if (!current || current.expired) {
      try { current = await manager?.signinSilent() } catch { current = null }
    }
    if (!current?.access_token) {
      acceptUser(null)
      throw new Error('SESSION_EXPIRED')
    }
    return current.access_token
  }, [acceptUser, manager])

  const identity = useMemo(() => toIdentity(user), [user])
  const value = useMemo(() => ({
    user,
    identity,
    status,
    error,
    configurationErrors,
    isAuthenticated: status === 'authenticated',
    signIn,
    signOut,
    getAccessToken,
    can: (permission) => hasPermission(identity.groups, permission),
  }), [user, identity, status, error, signIn, signOut, getAccessToken])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
