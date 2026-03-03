import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'https://api.useproof.com'

interface Account {
  id: string
  email: string
  name: string
  plan: string
}

interface AuthCtx {
  account: Account | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

interface ApiCtx {
  request: (path: string, options?: RequestInit) => Promise<unknown>
}

const AuthContext = createContext<AuthCtx>(null!)
const ApiContext = createContext<ApiCtx>(null!)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('proof_token'))
  const [account, setAccount] = useState<Account | null>(() => {
    const s = localStorage.getItem('proof_account')
    return s ? JSON.parse(s) : null
  })

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json() as { token: string; account: Account; error?: string }
    if (!res.ok) throw new Error(data.error || 'Login failed')
    setToken(data.token)
    setAccount(data.account)
    localStorage.setItem('proof_token', data.token)
    localStorage.setItem('proof_account', JSON.stringify(data.account))
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    })
    const data = await res.json() as { token: string; account: Account; error?: string }
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    setToken(data.token)
    setAccount(data.account)
    localStorage.setItem('proof_token', data.token)
    localStorage.setItem('proof_account', JSON.stringify(data.account))
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setAccount(null)
    localStorage.removeItem('proof_token')
    localStorage.removeItem('proof_account')
  }, [])

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/api${path}`, { ...options, headers })
    if (res.status === 401) {
      // Token expired — force logout
      setToken(null); setAccount(null)
      localStorage.removeItem('proof_token'); localStorage.removeItem('proof_account')
      throw new Error('Session expired')
    }
    const data = await res.json()
    if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed')
    return data
  }, [token])

  return (
    <AuthContext.Provider value={{ account, token, login, register, logout }}>
      <ApiContext.Provider value={{ request }}>
        {children}
      </ApiContext.Provider>
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
export const useApi = () => useContext(ApiContext)
