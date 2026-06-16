import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api, getToken, setToken, type AccountUser, type SavedAyah } from '../api'
import type { RandomAyah } from '../types'

interface AuthContextValue {
  user: AccountUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, displayName: string) => Promise<void>
  logout: () => void
  updateDisplayName: (name: string) => Promise<void>
  toggleFavorite: (ayah: RandomAyah) => Promise<void>
  recordHistory: (ayah: RandomAyah) => void
  isFavorite: (ayah: RandomAyah) => boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

function keyOf(a: { surahId: number; verseNumber: number }) {
  return `${a.surahId}:${a.verseNumber}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Référence toujours à jour vers `user`, pour les callbacks stables
  // (évite de recréer recordHistory à chaque changement de `user`, ce qui
  // provoquerait une boucle de rendu via l'effet d'enregistrement d'historique).
  const userRef = useRef<AccountUser | null>(null)
  useEffect(() => {
    userRef.current = user
  }, [user])

  // Au démarrage : si un jeton est présent, on restaure la session.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => setToken(null)) // jeton invalide/expiré
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const { token, user } = await api.login(username, password)
    setToken(token)
    setUser(user)
  }, [])

  const register = useCallback(
    async (username: string, password: string, displayName: string) => {
      const { token, user } = await api.register(username, password, displayName)
      setToken(token)
      setUser(user)
    },
    [],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const updateDisplayName = useCallback(async (name: string) => {
    const { user } = await api.updateProfile(name)
    setUser(user)
  }, [])

  const toggleFavorite = useCallback(
    async (ayah: RandomAyah) => {
      if (!user) return
      const { favorites } = await api.toggleFavorite(ayah)
      setUser((u) => (u ? { ...u, favorites } : u))
    },
    [user],
  )

  // Enregistre dans l'historique sans bloquer l'UI (best-effort).
  // Callback STABLE (deps vides) : lit `user` via la ref → pas de boucle.
  const recordHistory = useCallback((ayah: RandomAyah) => {
    if (!userRef.current) return
    api
      .addHistory(ayah)
      .then(({ history }) => setUser((u) => (u ? { ...u, history } : u)))
      .catch(() => {
        /* non bloquant */
      })
  }, [])

  const isFavorite = useCallback(
    (ayah: RandomAyah) => {
      if (!user) return false
      const k = keyOf(ayah)
      return user.favorites.some((f: SavedAyah) => keyOf(f) === k)
    },
    [user],
  )

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      updateDisplayName,
      toggleFavorite,
      recordHistory,
      isFavorite,
    }),
    [user, loading, login, register, logout, updateDisplayName, toggleFavorite, recordHistory, isFavorite],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return ctx
}
