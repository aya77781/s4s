import type { SavedAyah } from '../api'

interface Props {
  title: string
  emptyBig: string
  emptySub: string
  items: SavedAyah[]
  /** Clic sur un élément → afficher ce verset. */
  onSelect?: (ayah: SavedAyah) => void
  /** Retirer un élément (favoris / historique). */
  onRemove?: (ayah: SavedAyah) => void
}

/** Liste des versets sauvegardés (favoris ou historique). */
export default function SavedList({ title, emptyBig, emptySub, items, onSelect, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="empty">
        <div className="big">{emptyBig}</div>
        <div>{emptySub}</div>
      </div>
    )
  }

  return (
    <>
      <div className="section-head">{title}</div>
      <div className="list">
        {items.map((item) => (
          <div
            key={`${item.surahId}:${item.verseNumber}:${item.savedAt ?? item.viewedAt ?? ''}`}
            className="list-item"
            onClick={() => onSelect?.(item)}
          >
            {onRemove && (
              <button
                type="button"
                className="li-del"
                title="حذف"
                aria-label="حذف"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(item)
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M6 7l1 13h10l1-13" />
                </svg>
              </button>
            )}
            <div className="li-verse">{item.text}</div>
            <div className="li-meta">
              <span>سورة {item.surahName}</span>
              <span className="dot" />
              <span>الآية {item.verseNumber}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
