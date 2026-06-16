// Géométrie partagée des ornements marocains (étoiles à 8 branches, etc.).

/** Trace une étoile à `pts` branches (chemin SVG fermé). */
export function starPath(cx: number, cy: number, R: number, r: number, pts = 8): string {
  let p = ''
  for (let i = 0; i < pts * 2; i++) {
    const a = (Math.PI / pts) * i - Math.PI / 2
    const rad = i % 2 ? r : R
    p += (i ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(2) + ' ' + (cy + rad * Math.sin(a)).toFixed(2) + ' '
  }
  return p + 'Z'
}

/** Convertit un nombre en chiffres arabes-orientaux (٠١٢…). */
export function toArabicDigits(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)])
}
