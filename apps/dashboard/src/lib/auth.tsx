import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.socialproof.dev'

export interface Account {
  id: string
  email: string
  name: string
  plan: string
}

interface AuthCtx {
  account: Account | null
  token: string | null
  isDemo: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  loginDemo: () => Promise<void>
  logout: () => Promise<void>
  setAccount: (a: Account) => void
}

interface ApiCtx {
  request: <T = unknown>(path: string, options?: RequestInit) => Promise<T>
}

const AuthContext = createContext<AuthCtx>(null!)
const ApiContext = createContext<ApiCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('proof_token'))
  const [account, setAccountState] = useState<Account | null>(() => {
    const s = localStorage.getItem('proof_account')
    return s ? JSON.parse(s) : null
  })

  const persist = (tok: string, acc: Account) => {
    setToken(tok)
    setAccountState(acc)
    localStorage.setItem('proof_token', tok)
    localStorage.setItem('proof_account', JSON.stringify(acc))
  }

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { token: string; account: Account; error?: string }
    if (!res.ok) throw new Error(data.error || 'Login failed')
    persist(data.token, data.account)
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json() as { token: string; account: Account; error?: string }
    if (!res.ok) throw new Error(data.error || 'Signup failed')
    persist(data.token, data.account)
  }, [])

  const loginDemo = useCallback(async () => {
    const res = await fetch(`${API_URL}/api/auth/demo`, { credentials: 'include' })
    const data = await res.json() as { token: string; account: Account; demo: boolean; error?: string }
    if (!res.ok) throw new Error(data.error || 'Demo login failed')
    persist(data.token, data.account)
  }, [])

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    setToken(null)
    setAccountState(null)
    localStorage.removeItem('proof_token')
    localStorage.removeItem('proof_account')
  }, [])

  const setAccount = (a: Account) => {
    setAccountState(a)
    localStorage.setItem('proof_account', JSON.stringify(a))
  }

  const isDemo = account?.id === 'demo-account-vouch'

  return (
    <AuthContext.Provider value={{ account, token, isDemo, login, signup, loginDemo, logout, setAccount }}>
      <ApiContext.Provider value={{ request: async (path, opts) => {
          const res = await fetch(`${API_URL}${path}`, {
            ...opts,
            credentials: 'include',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts?.headers || {}) },
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: string }
            throw new Error(err.error || res.statusText)
          }
          return res.json()
        }}}>
        {children}
      </ApiContext.Provider>
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
export function useApi() { return useContext(ApiContext) }
