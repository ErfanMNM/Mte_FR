import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, profileApi } from '../api/client.js'

const AuthContext = createContext(null)

function readToken() { try { return localStorage.getItem('auth_token') } catch { return null } }
function saveToken(t) { try { localStorage.setItem('auth_token', t) } catch {} }
function clearToken() { try { localStorage.removeItem('auth_token') } catch {} }

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => readToken())
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!token)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let mounted = true
    async function bootstrap() {
      if (!token) { setLoading(false); return }
      try {
        const data = await authApi.me()
        if (mounted) setUser(data.user)
        // load profile info
        try {
          const p = await profileApi.me()
          if (mounted) setProfile(p?.profile || p)
        } catch { /* ignore profile errors */ }
      } catch {
        if (mounted) { setUser(null); setToken(null); clearToken() }
      } finally { if (mounted) setLoading(false) }
    }
    bootstrap()
    return () => { mounted = false }
  }, [token])

  const login = useCallback(async ({ login, password, totp_code }) => {
    const payload = { login, password }
    if (totp_code) payload.totp_code = totp_code
    const data = await authApi.login(payload)
    if (data?.token) { setToken(data.token); saveToken(data.token) }
    if (data?.user) setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    clearToken(); setToken(null); setUser(null); setProfile(null)
  }, [])

  const value = useMemo(() => ({ token, user, profile, loading, login, logout, isAuthenticated: !!token }), [token, user, profile, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
