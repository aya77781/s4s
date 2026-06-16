import { useEffect, useRef, useState } from 'react'
import AyahCard from './components/AyahCard'
import ActionButtons from './components/ActionButtons'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import SavedList from './components/SavedList'
import { useQuranData } from './hooks/useQuranData'
import { useTheme } from './hooks/useTheme'
import { useAuth } from './auth/AuthContext'
import { applyZellige } from './lib/zellige'
import type { SavedAyah } from './api'

type Tab = 'verse' | 'favorites' | 'history'

export default function App() {
  const { status, ayah, newAyah, retry, showAyah } = useQuranData()
  const { theme, toggle } = useTheme()
  const { user, toggleFavorite, recordHistory, isFavorite } = useAuth()

  const [animationKey, setAnimationKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('verse')
  const toastTimer = useRef<number | undefined>(undefined)

  const isLoading = status === 'loading'

  // Motif zellige : (re)généré au montage puis à chaque changement de
  // thème (html.dark) ou de palette (data-palette).
  useEffect(() => {
    applyZellige()
    const observer = new MutationObserver(() => applyZellige())
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-palette'],
    })
    return () => observer.disconnect()
  }, [])

  // Relance l'animation et enregistre l'historique à chaque nouveau verset.
  useEffect(() => {
    if (!ayah) return
    setAnimationKey((k) => k + 1)
    recordHistory(ayah)
  }, [ayah, recordHistory])

  function showToast(message: string) {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 1800)
  }

  function referenceText(): string {
    if (!ayah) return ''
    return `${ayah.text}\n﴿سورة ${ayah.surahName}: ${ayah.verseNumber}﴾`
  }

  async function handleCopy() {
    if (!ayah) return
    try {
      await navigator.clipboard.writeText(referenceText())
      showToast('تم نسخ الآية')
    } catch {
      showToast('تعذّر النسخ')
    }
  }

  async function handleShare() {
    if (!ayah) return
    if (navigator.share) {
      try {
        await navigator.share({ title: 'آية من القرآن الكريم', text: referenceText() })
      } catch {
        /* annulé par l'utilisateur */
      }
    } else {
      await handleCopy()
      showToast('تم نسخ الآية للمشاركة')
    }
  }

  async function handleFavorite() {
    if (!ayah) return
    if (!user) {
      setAuthOpen(true)
      return
    }
    const wasFav = isFavorite(ayah)
    try {
      await toggleFavorite(ayah)
      showToast(wasFav ? 'أُزيلت من المفضلة' : 'أُضيفت إلى المفضلة')
    } catch {
      showToast('تعذّر الحفظ')
    }
  }

  async function handleRemoveFavorite(item: SavedAyah) {
    try {
      await toggleFavorite(item)
    } catch {
      showToast('تعذّرت الإزالة')
    }
  }

  // Sélection d'un verset depuis une liste → l'afficher dans l'onglet آية.
  function handleSelect(item: SavedAyah) {
    showAyah(item)
    setTab('verse')
  }

  const favorited = ayah ? isFavorite(ayah) : false

  const tabs: { id: Tab; label: string }[] = [
    { id: 'verse', label: 'آية' },
    { id: 'favorites', label: 'المفضلة' },
    { id: 'history', label: 'السجل' },
  ]

  return (
    <div className="app">
      <Header theme={theme} onToggleTheme={toggle} onOpenAuth={() => setAuthOpen(true)} />

      {user && (
        <nav className="tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`tab ${tab === t.id ? 'on' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      )}

      <main className="main">
        <div className="stage">
          {/* Onglet آية */}
          {tab === 'verse' && (
            <>
              {isLoading && !ayah && (
                <div className="center-state">
                  <span className="spin" />
                  <span>جارٍ التحميل...</span>
                </div>
              )}

              {status === 'error' && !ayah && (
                <div className="center-state">
                  <span className="msg">حدث خطأ، تعذّر تحميل الآية</span>
                  <button type="button" className="act primary" onClick={retry}>
                    إعادة المحاولة
                  </button>
                </div>
              )}

              {ayah && (
                <>
                  <AyahCard ayah={ayah} animationKey={animationKey} />
                  <ActionButtons
                    loading={isLoading}
                    favorited={favorited}
                    onNew={newAyah}
                    onFavorite={handleFavorite}
                    onCopy={handleCopy}
                    onShare={handleShare}
                  />
                  {status === 'error' && (
                    <div className="center-state" style={{ padding: '24px 20px' }}>
                      <span className="msg">حدث خطأ، تعذّر تحميل الآية</span>
                      <button type="button" className="btn" onClick={retry}>
                        إعادة المحاولة
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Onglet المفضلة */}
          {tab === 'favorites' && user && (
            <SavedList
              title="الآيات المفضلة"
              emptyBig="لم تقم بإضافة أي آية إلى المفضلة بعد"
              emptySub="فضّل أي آية بالضغط على القلب"
              items={user.favorites}
              onSelect={handleSelect}
              onRemove={handleRemoveFavorite}
            />
          )}

          {/* Onglet السجل */}
          {tab === 'history' && user && (
            <SavedList
              title="سجل الآيات"
              emptyBig="سجلّك فارغ"
              emptySub="الآيات التي تطّلع عليها تظهر هنا"
              items={user.history}
              onSelect={handleSelect}
            />
          )}
        </div>
      </main>

      <footer className="ftr">تطبيق آية — كل يوم نور من كتاب الله</footer>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}
