// Utilitaires d'authentification : hachage des mots de passe (bcrypt) et
// génération/vérification de jetons JWT.

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Secret JWT : défini via la variable d'environnement en production.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production'
const TOKEN_TTL = '7d'

export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash)
}

export function signToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL })
}

/** Middleware Express : exige un jeton valide et renseigne req.userId. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' })
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'انتهت صلاحية الجلسة' })
  }
}
