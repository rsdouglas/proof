import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export const API_URL = import.meta.env.VITE_API_URL || 'https://api.useproof.com'

export interface Account {
  id: string
  email: string
  name: string
  plan: string
}

interface AuthCtx {
  account: Account | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
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

  const logout = useCallback(async () => {
    await fetch(`${API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
    setToken(null)
    setAccountState(null)
    localStorage.removeItem('proof_token')
    localStorage.removeItem('proof_account')
  }, [])

  const setAccount = useCallback((a: Account) => {
    setAccountState(a)
    localStorage.setItem('proof_account', JSON.stringify(a))
  }, [])

  const request = useCallback(async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/api${path}`, { ...options, headers, credentials: 'include' })
    if (res.status === 401) {
      setToken(null); setAccountState(null)
      localStorage.removeItem('proof_token'); localStorage.removeItem('proof_account')
      throw new Error('Session expired')
    }
    const data = await res.json()
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed')
    return data as T
  }, [token])

  return (
    <AuthContext.Provider value={{ account, token, login, signup, logout, setAccount }}>
      <ApiContext.Provider value={{ request }}>
        {children}
      </ApiContext.Provider>
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export const useApi = () => useContext(ApiContext)
