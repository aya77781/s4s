// Types décrivant un verset prêt à afficher (issu de api.alquran.cloud).

/** Verset tiré au hasard, avec son tafsir. */
export interface RandomAyah {
  /** Numéro global du verset (1 → 6236). */
  globalNumber: number
  /** Texte arabe du verset (édition quran-uthmani, avec tashkeel). */
  text: string
  /** Tafsir al-Muyassar (édition ar.muyassar). */
  tafsir: string
  /** Nom de la sourate en arabe. */
  surahName: string
  /** Numéro de la sourate (surah.number). */
  surahId: number
  /** Numéro du verset dans la sourate (numberInSurah). */
  verseNumber: number
  /** Type de révélation en arabe : « مكية » ou « مدنية ». */
  revelationType: RevelationType
}

/** Type de révélation traduit en arabe pour l'affichage. */
export type RevelationType = 'مكية' | 'مدنية' | ''
