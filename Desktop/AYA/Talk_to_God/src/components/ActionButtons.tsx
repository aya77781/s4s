interface Props {
  loading: boolean
  favorited: boolean
  onNew: () => void
  onFavorite: () => void
  onCopy: () => void
  onShare: () => void
}

/** Barre d'actions : favori, copier, آية جديدة (principal), partager. */
export default function ActionButtons({
  loading,
  favorited,
  onNew,
  onFavorite,
  onCopy,
  onShare,
}: Props) {
  return (
    <div className="actions">
      <button
        type="button"
        className={`act fav ${favorited ? 'on' : ''}`}
        onClick={onFavorite}
        aria-label={favorited ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}
        title="المفضلة"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" fill={favorited ? 'currentColor' : 'none'}>
          <path d="M12 20s-7-4.6-9.2-8.6C1 8 2.6 4.6 6 4.6c2 0 3.2 1.2 4 2.4.8-1.2 2-2.4 4-2.4 3.4 0 5 3.4 3.2 6.8C19 15.4 12 20 12 20Z" />
        </svg>
      </button>

      <button type="button" className="act" onClick={onCopy} aria-label="نسخ" title="نسخ">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="11" height="11" rx="2.5" />
          <path d="M5 15V5a2 2 0 0 1 2-2h8" />
        </svg>
      </button>

      <button type="button" className="act primary" onClick={onNew} disabled={loading} aria-label="آية جديدة">
        {loading ? (
          <span className="spin sm" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 15.5-6.3M21 4v4h-4" />
            <path d="M21 12a9 9 0 0 1-15.5 6.3M3 20v-4h4" />
          </svg>
        )}
        آية جديدة
      </button>

      <button type="button" className="act" onClick={onShare} aria-label="مشاركة" title="مشاركة">
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="6" cy="12" r="2.6" />
          <circle cx="17" cy="6" r="2.6" />
          <circle cx="17" cy="18" r="2.6" />
          <path d="M8.3 10.8l6.4-3.6M8.3 13.2l6.4 3.6" />
        </svg>
      </button>
    </div>
  )
}
