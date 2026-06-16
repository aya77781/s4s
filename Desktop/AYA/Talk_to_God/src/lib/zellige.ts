import { starPath } from './ornaments'

/**
 * Génère le motif zellige (étoile khatim + losange + quarts d'étoile dans les
 * coins) sous forme d'URL de données, teinté avec les variables CSS courantes
 * (--pat / --pat2). À recalculer après chaque changement de thème/palette.
 */
export function zelligeURI(): string {
  const cs = getComputedStyle(document.body)
  const c1 = cs.getPropertyValue('--pat').trim() || 'rgba(184,146,58,0.16)'
  const c2 = cs.getPropertyValue('--pat2').trim() || 'rgba(31,111,81,0.10)'
  const S = 132
  const star = starPath(S / 2, S / 2, S * 0.3, S * 0.125, 8)
  const sq = `M${S / 2} ${S * 0.1}L${S * 0.9} ${S / 2}L${S / 2} ${S * 0.9}L${S * 0.1} ${S / 2}Z`
  const corner = starPath(0, 0, S * 0.3, S * 0.125, 8)
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${S}' height='${S}' viewBox='0 0 ${S} ${S}'>` +
    `<path d='${star}' fill='none' stroke='${c1}' stroke-width='1.1'/>` +
    `<path d='${sq}' fill='none' stroke='${c2}' stroke-width='0.9'/>` +
    `<g transform='translate(0 0)'><path d='${corner}' fill='none' stroke='${c1}' stroke-width='1.1'/></g>` +
    `<g transform='translate(${S} 0)'><path d='${corner}' fill='none' stroke='${c1}' stroke-width='1.1'/></g>` +
    `<g transform='translate(0 ${S})'><path d='${corner}' fill='none' stroke='${c1}' stroke-width='1.1'/></g>` +
    `<g transform='translate(${S} ${S})'><path d='${corner}' fill='none' stroke='${c1}' stroke-width='1.1'/></g>` +
    `</svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}

/** Applique le motif zellige sur <html> via la variable --zellige. */
export function applyZellige(): void {
  // requestAnimationFrame : s'assure que les classes (dark/palette) sont appliquées.
  requestAnimationFrame(() => {
    document.documentElement.style.setProperty('--zellige', zelligeURI())
  })
}
