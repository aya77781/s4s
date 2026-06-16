// Module centralisant les appels à l'API publique api.alquran.cloud.
// Aucune clé ni authentification requise — appels directs côté client.
import type { RandomAyah, RevelationType } from './types'

const BASE_URL = 'https://api.alquran.cloud/v1'

/** Nombre total de versets dans le Coran (numéro global maximum). */
export const TOTAL_AYAHS = 6236

// Éditions demandées : texte arabe + tafsir, en un seul appel.
const QURAN_EDITION = 'quran-uthmani'
const TAFSIR_EDITION = 'ar.muyassar'

interface ApiEdition {
  text: string
  numberInSurah: number
  edition: { identifier: string }
  surah: { number: number; name: string; revelationType: string }
}

/** Convertit le type de révélation (renvoyé en anglais) en arabe. */
function toArabicRevelation(type?: string): RevelationType {
  if (type === 'Meccan') return 'مكية'
  if (type === 'Medinan') return 'مدنية'
  return ''
}

/** Tire un numéro de verset aléatoire (1 → 6236), différent de `exclude`. */
export function randomAyahNumber(exclude?: number): number {
  let n = Math.floor(Math.random() * TOTAL_AYAHS) + 1
  let guard = 0
  while (n === exclude && guard < 5) {
    n = Math.floor(Math.random() * TOTAL_AYAHS) + 1
    guard++
  }
  return n
}

/**
 * Récupère un verset (texte + tafsir) par son numéro global, en un seul appel
 * grâce aux éditions multiples. Lève une erreur si l'API échoue ou répond mal.
 */
export async function fetchAyah(
  globalNumber: number,
  signal?: AbortSignal,
): Promise<RandomAyah> {
  const url = `${BASE_URL}/ayah/${globalNumber}/editions/${QURAN_EDITION},${TAFSIR_EDITION}`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const editions: ApiEdition[] = json?.data
  if (!Array.isArray(editions) || editions.length < 2) {
    throw new Error('Réponse API invalide')
  }

  // On retrouve chaque édition par son identifiant (ordre non garanti).
  const quran =
    editions.find((e) => e.edition?.identifier === QURAN_EDITION) ?? editions[0]
  const tafsir =
    editions.find((e) => e.edition?.identifier === TAFSIR_EDITION) ?? editions[1]

  return {
    globalNumber,
    text: quran.text,
    tafsir: tafsir.text,
    surahName: quran.surah?.name ?? '',
    surahId: quran.surah?.number ?? 0,
    verseNumber: quran.numberInSurah ?? 0,
    revelationType: toArabicRevelation(quran.surah?.revelationType),
  }
}

// --- Tafsir approfondi & présentation de sourate (dépôt spa5k/tafsir_api) -----
// CDN, sans clé. Ces appels sont facultatifs et chargés à la demande.
const TAFSIR_CDN = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir'

/** Nettoie le HTML éventuel et normalise les espaces d'un texte de tafsir. */
function cleanTafsirText(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, '\n') // <br> → saut de ligne
    .replace(/<[^>]+>/g, ' ') // retire les autres balises
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n') // au plus une ligne vide
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim()
}

/**
 * Récupère le tafsir d'Ibn Kathir (contexte / أسباب النزول) d'un verset.
 * Renvoie '' si le verset n'a pas de contexte (404 / texte vide) plutôt que
 * de lever une erreur ; lève une erreur uniquement en cas de panne réseau.
 */
export async function fetchIbnKathir(
  surahId: number,
  verseNumber: number,
  signal?: AbortSignal,
): Promise<string> {
  const url = `${TAFSIR_CDN}/ar-tafsir-ibn-kathir/${surahId}/${verseNumber}.json`
  const res = await fetch(url, { signal })
  // Toute réponse non-OK (404/403…) = contenu indisponible → '' (pas d'erreur).
  // Seul un échec réseau (fetch qui rejette) sera traité comme une erreur.
  if (!res.ok) return ''
  const json = await res.json()
  return cleanTafsirText(json?.text ?? '')
}

/**
 * Récupère la présentation d'une sourate (تعريف بالسورة) : le tafsir al-Muyassar
 * du PREMIER verset commence par une introduction de la sourate.
 */
export async function fetchSurahIntro(
  surahId: number,
  signal?: AbortSignal,
): Promise<string> {
  const url = `${TAFSIR_CDN}/ar-tafsir-muyassar/${surahId}/1.json`
  const res = await fetch(url, { signal })
  if (!res.ok) return '' // indisponible → message « vide », pas d'erreur
  const json = await res.json()
  return cleanTafsirText(json?.text ?? '')
}
