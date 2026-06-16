import type { ReactNode } from 'react'

interface Props {
  label: string
  onClick: () => void
  children: ReactNode
  /** `primary` = bouton principal « آية أخرى » ; `ghost` = actions secondaires. */
  variant?: 'primary' | 'ghost'
  disabled?: boolean
}

/** Bouton réutilisable avec effets hover/press soignés. */
export default function IconButton({
  label,
  onClick,
  children,
  variant = 'ghost',
  disabled = false,
}: Props) {
  const base =
    'font-arabic inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-bold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-transparent active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100'

  const styles =
    variant === 'primary'
      ? 'bg-emerald-deep text-cream shadow-lg shadow-emerald-deep/30 hover:bg-emerald-night hover:shadow-emerald-deep/40 hover:-translate-y-0.5 dark:bg-gold dark:text-midnight dark:shadow-gold/20 dark:hover:bg-gold/90'
      : 'border border-gold/40 bg-transparent text-emerald-deep hover:bg-gold/10 dark:text-cream dark:hover:bg-white/5'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${base} ${styles}`}
    >
      {children}
    </button>
  )
}
