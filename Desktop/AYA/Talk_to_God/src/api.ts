// Petit client HTTP pour l'API du backend (comptes, favoris, historique).
import type { RandomAyah } from './types'

const TOKEN_KEY = 'ayah-token'

export interface SavedAyah extends RandomAyah {
  savedAt?: string
  viewedAt?: string
}

export interface AccountUser {
  id: string
  username: string
  displayName: string
  favorites: SavedAyah[]
  history: SavedAyah[]
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Appel générique : ajoute le jeton et remonte un message d'erreur en arabe. */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'حدث خطأ في الخادم')
  }
  return data as T
}

export const api = {
  register(username: string, password: string, displayName: string) {
    return request<{ token: string; user: AccountUser }>('/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName }),
    })
  },
  login(username: string, password: string) {
    return request<{ token: string; user: AccountUser }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
  },
  me() {
    return request<{ user: AccountUser }>('/me')
  },
  updateProfile(displayName: string) {
    return request<{ user: AccountUser }>('/profile', {
      method: 'PUT',
      body: JSON.stringify({ displayName }),
    })
  },
  toggleFavorite(ayah: RandomAyah) {
    return request<{ favorites: SavedAyah[] }>('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ ayah }),
    })
  },
  addHistory(ayah: RandomAyah) {
    return request<{ history: SavedAyah[] }>('/history', {
      method: 'POST',
      body: JSON.stringify({ ayah }),
    })
  },
}
