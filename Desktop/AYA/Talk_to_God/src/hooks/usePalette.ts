import { useCallback, useEffect, useState } from 'react'

const PALETTE_KEY = 'ayah-palette'

export type Palette = 'green' | 'red' | 'blue'

const PALETTES: Palette[] = ['green', 'red', 'blue']

function isPalette(value: string | null): value is Palette {
  return value === 'green' || value === 'red' || value === 'blue'
}

/**
 * Gère la couleur d'accent (vert / rouge / bleu), persistée en localStorage et
 * appliquée via l'attribut `data-palette` sur <html>.
 */
export function usePalette() {
  const [palette, setPalette] = useState<Palette>(() => {
    const saved = localStorage.getItem(PALETTE_KEY)
    return isPalette(saved) ? saved : 'green'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-palette', palette)
    localStorage.setItem(PALETTE_KEY, palette)
  }, [palette])

  const choose = useCallback((next: Palette) => setPalette(next), [])

  return { palette, choose, palettes: PALETTES }
}
