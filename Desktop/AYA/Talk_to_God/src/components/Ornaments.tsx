// Petits ornements SVG marocains, dérivés de la géométrie partagée.
import { starPath } from '../lib/ornaments'

/** Étoile à 8 branches simple (utilisée pour l'emblème et le filet). */
export function Star({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 22 22" className={className} fill="none" stroke="currentColor" strokeWidth="1.1">
      <path d={starPath(11, 11, 9, 3.9, 8)} />
    </svg>
  )
}

/** Étoile dans un carré tourné — ornement de coin de la carte. */
export function CornerStar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="1.1">
      <rect x="5" y="5" width="30" height="30" rx="3" transform="rotate(45 20 20)" opacity="0.55" />
      <path d={starPath(20, 20, 15, 6.6, 8)} />
    </svg>
  )
}

/** Arche mihrab (arc mauresque en double trait) — couronne de la carte. */
export function MihrabArch({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 150 92" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M75 6 L78 12 L72 12 Z" fill="currentColor" stroke="none" />
      <circle cx="75" cy="3.2" r="2.2" fill="currentColor" stroke="none" />
      <path d="M20 92 L20 50 Q24 22 75 14 Q126 22 130 50 L130 92" />
      <path d="M30 92 L30 52 Q34 30 75 23 Q116 30 120 52 L120 92" strokeWidth="1" opacity="0.6" />
    </svg>
  )
}

/** Médaillon du numéro de verset (cercle + étoile + petite arche). */
export function Medallion({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 70" className={className} fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="35" cy="35" r="31" />
      <path d={starPath(35, 35, 30, 13, 8)} opacity="0.5" />
      <path d="M28 8 Q35 2 42 8" strokeWidth="1.4" />
    </svg>
  )
}
