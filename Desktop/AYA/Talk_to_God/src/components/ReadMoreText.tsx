import { useEffect, useState } from 'react'

interface Props {
  text: string
  /** Nombre de caractères affichés avant « اقرأ المزيد ». */
  previewChars?: number
}

/** Affiche un texte long, tronqué avec un bouton « اقرأ المزيد » / « عرض أقل ». */
export default function ReadMoreText({ text, previewChars = 360 }: Props) {
  const [expanded, setExpanded] = useState(false)

  // Replie de nouveau quand le texte change (nouveau verset/sourate).
  useEffect(() => {
    setExpanded(false)
  }, [text])

  const isLong = text.length > previewChars
  const shown = !isLong || expanded ? text : `${text.slice(0, previewChars).trimEnd()}…`

  return (
    <div>
      <p className="panel-text">{shown}</p>
      {isLong && (
        <button type="button" className="read-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? 'عرض أقل' : 'اقرأ المزيد'}
        </button>
      )}
    </div>
  )
}
