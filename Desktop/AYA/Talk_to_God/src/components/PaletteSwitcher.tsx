import { usePalette, type Palette } from '../hooks/usePalette'

// Couleur de pastille et libellé arabe de chaque accent.
const OPTIONS: { id: Palette; color: string; label: string }[] = [
  { id: 'green', color: '#1f7d4f', label: 'اللون الأخضر' },
  { id: 'red', color: '#b5503c', label: 'اللون الأحمر' },
  { id: 'blue', color: '#3f6fb0', label: 'اللون الأزرق' },
]

/** Sélecteur de couleur d'accent : vert / rouge / bleu. */
export default function PaletteSwitcher() {
  const { palette, choose } = usePalette()

  return (
    <div className="swatches">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => choose(opt.id)}
          aria-label={opt.label}
          aria-pressed={palette === opt.id}
          title={opt.label}
          className={`swatch ${palette === opt.id ? 'on' : ''}`}
          style={{ backgroundColor: opt.color, color: opt.color }}
        />
      ))}
    </div>
  )
}
