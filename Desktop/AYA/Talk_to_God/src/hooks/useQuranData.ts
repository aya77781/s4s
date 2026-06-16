import { useCallback, useEffect, useRef, useState } from 'react'
import type { RandomAyah } from '../types'
import { fetchAyah, randomAyahNumber } from '../quranApi'

type Status = 'loading' | 'ready' | 'error'

/**
 * Gère le tirage aléatoire d'un verset depuis api.alquran.cloud :
 * états chargement / prêt / erreur, et fonction pour en tirer un nouveau
 * (en évitant de retomber 2× de suite sur le même verset).
 */
export function useQuranData() {
  const [status, setStatus] = useState<Status>('loading')
  const [ayah, setAyah] = useState<RandomAyah | null>(null)

  // Dernier numéro tiré (mémoire de session, pas de répétition immédiate).
  const lastNumber = useRef<number | undefined>(undefined)
  // Permet d'annuler un fetch en cours si l'utilisateur reclique rapidement.
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setStatus('loading')
    const number = randomAyahNumber(lastNumber.current)
    try {
      const result = await fetchAyah(number, controller.signal)
      lastNumber.current = number
      setAyah(result)
      setStatus('ready')
    } catch (err) {
      // Une annulation volontaire ne doit pas afficher d'erreur.
      if (controller.signal.aborted) return
      setStatus('error')
    }
  }, [])

  // Affiche directement un verset déjà connu (ex. depuis les favoris / le sjeel).
  const showAyah = useCallback((value: RandomAyah) => {
    abortRef.current?.abort()
    setAyah(value)
    setStatus('ready')
  }, [])

  // Premier verset au montage.
  useEffect(() => {
    load()
    return () => abortRef.current?.abort()
  }, [load])

  return { status, ayah, newAyah: load, retry: load, showAyah }
}
