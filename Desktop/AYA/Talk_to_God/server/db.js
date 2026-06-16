// Mini « base de données » sur fichier JSON (server/db/users.json).
// Toutes les écritures sont sérialisées via une file d'attente pour éviter
// toute corruption en cas de requêtes concurrentes (un seul process Node).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_DIR = join(__dirname, 'db')
const DB_FILE = join(DB_DIR, 'users.json')

// File d'attente d'écriture : chaque opération attend la précédente.
let writeChain = Promise.resolve()

/** Lit l'intégralité de la base (tableau d'utilisateurs). */
export async function readDB() {
  if (!existsSync(DB_FILE)) return []
  try {
    const raw = await readFile(DB_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : []
  } catch {
    // Fichier illisible/corrompu : on repart d'une base vide plutôt que de planter.
    return []
  }
}

/** Écrit l'intégralité de la base de façon atomique-ish et sérialisée. */
export function writeDB(users) {
  writeChain = writeChain.then(async () => {
    if (!existsSync(DB_DIR)) await mkdir(DB_DIR, { recursive: true })
    await writeFile(DB_FILE, JSON.stringify(users, null, 2), 'utf-8')
  })
  return writeChain
}

/**
 * Applique une mutation sur la base de manière sérialisée :
 * lit, transforme via `mutator`, puis réécrit. Renvoie ce que `mutator` retourne.
 */
export function updateDB(mutator) {
  let result
  writeChain = writeChain.then(async () => {
    const users = await readDB()
    result = await mutator(users)
    if (!existsSync(DB_DIR)) await mkdir(DB_DIR, { recursive: true })
    await writeFile(DB_FILE, JSON.stringify(users, null, 2), 'utf-8')
  })
  return writeChain.then(() => result)
}
