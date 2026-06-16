import { useAuth } from '../auth/AuthContext'
import { Star } from './Ornaments'
import PaletteSwitcher from './PaletteSwitcher'

interface Props {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenAuth: () => void
}

/** En-tête : emblème + titre, sélecteur de couleur, compte, bascule thème. */
export default function Header({ theme, onToggleTheme, onOpenAuth }: Props) {
  const { user, logout } = useAuth()

  return (
    <header className="hdr">
      <div className="brand">
        <h1>آية من القرآن الكريم</h1>
        <Star className="glyph" />
      </div>

      <div className="controls">
        <PaletteSwitcher />

        {user ? (
          <button type="button" className="btn" onClick={logout}>
            خروج
          </button>
        ) : (
          <button type="button" className="btn" onClick={onOpenAuth}>
            تسجيل الدخول
          </button>
        )}

        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
          title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
        >
          {theme === 'dark' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4.2" />
              <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  )
}
