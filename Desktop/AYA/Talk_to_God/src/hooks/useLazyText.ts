import { useCallback, useEffect, useRef, useState } from 'react'

export type LazyStatus = 'idle' | 'loading' | 'ready' | 'error'

/**
 * Charge un texte À LA DEMANDE (non bloquant) et le met en cache jusqu'au
 * changement de `resetKey`. Idéal pour les sections dépliables : on ne déclenche
 * `load()` que lorsque l'utilisateur ouvre la section.
 *
 * @param resetKey  quand cette clé change, l'état est réinitialisé (ex. nouveau verset)
 * @param loader    fonction asynchrone renvoyant le texte
 */
export function useLazyText(resetKey: string | number, loader: () => Promise<string>) {
  const [status, setStatus] = useState<LazyStatus>('idle')
  const [text, setText] = useState('')

  // Référence toujours à jour vers le loader → `load` reste stable.
  const loaderRef = useRef(loader)
  loaderRef.current = loader
  const startedRef = useRef(false)

  // Réinitialise dès que la ressource cible change (nouveau verset/sourate).
  useEffect(() => {
    startedRef.current = false
    setStatus('idle')
    setText('')
  }, [resetKey])

  const run = useCallback(async () => {
    startedRef.current = true
    setStatus('loading')
    try {
      const result = await loaderRef.current()
      setText(result)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  // Déclenche le chargement une seule fois (sauf retry explicite).
  const load = useCallback(() => {
    if (startedRef.current) return
    run()
  }, [run])

  return { status, text, load, retry: run }
}
