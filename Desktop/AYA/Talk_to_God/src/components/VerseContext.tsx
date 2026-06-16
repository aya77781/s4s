import { useEffect, useState } from 'react'
import type { RandomAyah } from '../types'
import { fetchIbnKathir, fetchSurahIntro } from '../quranApi'
import { useLazyText, type LazyStatus } from '../hooks/useLazyText'
import CollapsiblePanel from './CollapsiblePanel'
import ReadMoreText from './ReadMoreText'

interface Props {
  ayah: RandomAyah
}

/**
 * Trois niveaux de profondeur, repliés par défaut :
 *  - التفسير        : tafsir al-Muyassar (déjà chargé avec le verset)
 *  - سياق الآية      : Ibn Kathir (contexte / أسباب النزول), chargé à la demande
 *  - تعريف بالسورة   : introduction de la sourate, chargée à la demande
 */
export default function VerseContext({ ayah }: Props) {
  const [openTafsir, setOpenTafsir] = useState(false)
  const [openContext, setOpenContext] = useState(false)
  const [openIntro, setOpenIntro] = useState(false)

  const context = useLazyText(`${ayah.surahId}:${ayah.verseNumber}`, () =>
    fetchIbnKathir(ayah.surahId, ayah.verseNumber),
  )
  const intro = useLazyText(`${ayah.surahId}`, () => fetchSurahIntro(ayah.surahId))

  // À chaque nouveau verset, on replie toutes les sections.
  useEffect(() => {
    setOpenTafsir(false)
    setOpenContext(false)
    setOpenIntro(false)
  }, [ayah.globalNumber])

  function toggleContext() {
    setOpenContext((v) => {
      if (!v) context.load()
      return !v
    })
  }
  function toggleIntro() {
    setOpenIntro((v) => {
      if (!v) intro.load()
      return !v
    })
  }

  return (
    <>
      <div className="depth-row">
        <button
          type="button"
          className={`depth-btn ${openTafsir ? 'on' : ''}`}
          aria-pressed={openTafsir}
          onClick={() => setOpenTafsir((v) => !v)}
        >
          التفسير
        </button>
        <button
          type="button"
          className={`depth-btn ${openContext ? 'on' : ''}`}
          aria-pressed={openContext}
          onClick={toggleContext}
        >
          سياق الآية
        </button>
        <button
          type="button"
          className={`depth-btn ${openIntro ? 'on' : ''}`}
          aria-pressed={openIntro}
          onClick={toggleIntro}
        >
          تعريف بالسورة
        </button>
      </div>

      <CollapsiblePanel label="التفسير الميسر" open={openTafsir}>
        <p className="panel-text">{ayah.tafsir}</p>
      </CollapsiblePanel>

      <CollapsiblePanel label="سياق الآية — ابن كثير" open={openContext}>
        <LazyContent
          status={context.status}
          text={context.text}
          onRetry={context.retry}
          emptyText="لا يوجد سياق خاص لهذه الآية"
        />
      </CollapsiblePanel>

      <CollapsiblePanel label="تعريف بالسورة" open={openIntro}>
        <LazyContent
          status={intro.status}
          text={intro.text}
          onRetry={intro.retry}
          emptyText="لا يوجد تعريف متاح لهذه السورة"
        />
      </CollapsiblePanel>
    </>
  )
}

/** Rendu du contenu paresseux : chargement / erreur / vide / texte. */
function LazyContent({
  status,
  text,
  onRetry,
  emptyText,
}: {
  status: LazyStatus
  text: string
  onRetry: () => void
  emptyText: string
}) {
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="panel-state">
        <span className="spin sm" />
        <span>جارٍ التحميل...</span>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="panel-state" style={{ flexDirection: 'column' }}>
        <span style={{ color: '#c0533a' }}>تعذّر تحميل المحتوى</span>
        <button type="button" className="btn" onClick={onRetry}>
          إعادة المحاولة
        </button>
      </div>
    )
  }

  if (!text) {
    return <p className="panel-empty">{emptyText}</p>
  }

  return <ReadMoreText text={text} />
}
