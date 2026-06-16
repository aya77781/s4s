// Serveur API : comptes utilisateurs, favoris, historique et profil.
// Base de données = fichier JSON (server/db/users.json).

import express from 'express'
import cors from 'cors'
import { randomUUID } from 'node:crypto'
import { readDB, updateDB } from './db.js'
import {
  hashPassword,
  verifyPassword,
  signToken,
  requireAuth,
} from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Limites pour garder le fichier JSON raisonnable.
const MAX_HISTORY = 50
const MAX_FAVORITES = 300

/** Clé unique d'un verset : "sourate:verset". */
function ayahKey(a) {
  return `${a.surahId}:${a.verseNumber}`
}

/** Normalise un verset reçu du client (anti-données superflues). */
function sanitizeAyah(a) {
  if (!a || typeof a !== 'object') return null
  const surahId = Number(a.surahId)
  const verseNumber = Number(a.verseNumber)
  if (!Number.isInteger(surahId) || !Number.isInteger(verseNumber)) return null
  return {
    surahId,
    verseNumber,
    surahName: String(a.surahName ?? ''),
    text: String(a.text ?? ''),
    // On conserve le tafsir pour les favoris / l'historique.
    tafsir: String(a.tafsir ?? ''),
    // Type de révélation (déjà en arabe côté client : « مكية » / « مدنية »).
    revelationType: String(a.revelationType ?? ''),
  }
}

/** Version « publique » d'un utilisateur (sans le hash du mot de passe). */
function publicUser(u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    favorites: u.favorites ?? [],
    history: u.history ?? [],
  }
}

// --- Inscription -----------------------------------------------------------
app.post('/api/register', async (req, res) => {
  const { username, password, displayName } = req.body ?? {}

  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'اسم المستخدم قصير جداً (3 أحرف على الأقل)' })
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'كلمة المرور قصيرة جداً (6 أحرف على الأقل)' })
  }

  const cleanUsername = username.trim()
  const passwordHash = await hashPassword(password)

  try {
    const created = await updateDB((users) => {
      const exists = users.some(
        (u) => u.username.toLowerCase() === cleanUsername.toLowerCase(),
      )
      if (exists) throw new Error('USERNAME_TAKEN')

      const user = {
        id: randomUUID(),
        username: cleanUsername,
        displayName:
          typeof displayName === 'string' && displayName.trim()
            ? displayName.trim()
            : cleanUsername,
        passwordHash,
        createdAt: new Date().toISOString(),
        favorites: [],
        history: [],
      }
      users.push(user)
      return user
    })

    const token = signToken(created.id)
    return res.status(201).json({ token, user: publicUser(created) })
  } catch (err) {
    if (err.message === 'USERNAME_TAKEN') {
      return res.status(409).json({ error: 'اسم المستخدم مستخدم بالفعل' })
    }
    return res.status(500).json({ error: 'حدث خطأ في الخادم' })
  }
})

// --- Connexion -------------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'بيانات غير صحيحة' })
  }

  const users = await readDB()
  const user = users.find(
    (u) => u.username.toLowerCase() === username.trim().toLowerCase(),
  )
  // Message volontairement générique (ne révèle pas si le compte existe).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' })
  }

  const token = signToken(user.id)
  return res.json({ token, user: publicUser(user) })
})

// --- Profil courant --------------------------------------------------------
app.get('/api/me', requireAuth, async (req, res) => {
  const users = await readDB()
  const user = users.find((u) => u.id === req.userId)
  if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' })
  return res.json({ user: publicUser(user) })
})

// --- Mise à jour du nom affiché -------------------------------------------
app.put('/api/profile', requireAuth, async (req, res) => {
  const { displayName } = req.body ?? {}
  if (typeof displayName !== 'string' || !displayName.trim()) {
    return res.status(400).json({ error: 'الاسم غير صالح' })
  }
  const updated = await updateDB((users) => {
    const user = users.find((u) => u.id === req.userId)
    if (!user) return null
    user.displayName = displayName.trim().slice(0, 60)
    return user
  })
  if (!updated) return res.status(404).json({ error: 'المستخدم غير موجود' })
  return res.json({ user: publicUser(updated) })
})

// --- Basculer un favori (ajoute si absent, retire si présent) ---------------
app.post('/api/favorites/toggle', requireAuth, async (req, res) => {
  const ayah = sanitizeAyah(req.body?.ayah)
  if (!ayah) return res.status(400).json({ error: 'آية غير صالحة' })

  const updated = await updateDB((users) => {
    const user = users.find((u) => u.id === req.userId)
    if (!user) return null
    user.favorites = user.favorites ?? []
    const key = ayahKey(ayah)
    const idx = user.favorites.findIndex((f) => ayahKey(f) === key)
    if (idx >= 0) {
      user.favorites.splice(idx, 1)
    } else {
      user.favorites.unshift({ ...ayah, savedAt: new Date().toISOString() })
      if (user.favorites.length > MAX_FAVORITES) {
        user.favorites.length = MAX_FAVORITES
      }
    }
    return user
  })
  if (!updated) return res.status(404).json({ error: 'المستخدم غير موجود' })
  return res.json({ favorites: updated.favorites })
})

// --- Ajouter à l'historique ------------------------------------------------
app.post('/api/history', requireAuth, async (req, res) => {
  const ayah = sanitizeAyah(req.body?.ayah)
  if (!ayah) return res.status(400).json({ error: 'آية غير صالحة' })

  const updated = await updateDB((users) => {
    const user = users.find((u) => u.id === req.userId)
    if (!user) return null
    user.history = user.history ?? []
    const key = ayahKey(ayah)
    // On évite les doublons consécutifs et on garde le plus récent en tête.
    user.history = user.history.filter((h) => ayahKey(h) !== key)
    user.history.unshift({ ...ayah, viewedAt: new Date().toISOString() })
    if (user.history.length > MAX_HISTORY) user.history.length = MAX_HISTORY
    return user
  })
  if (!updated) return res.status(404).json({ error: 'المستخدم غير موجود' })
  return res.json({ history: updated.history })
})

app.listen(PORT, () => {
  console.log(`✅ API en écoute sur http://localhost:${PORT}`)
})
