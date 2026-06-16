import type { ReactNode } from 'react'

interface Props {
  label: string
  open: boolean
  children: ReactNode
}

/** Panneau qui se déplie en douceur (grid-rows 0fr → 1fr), en-tête doré. */
export default function CollapsiblePanel({ label, open, children }: Props) {
  return (
    <div className={`panel ${open ? 'open' : ''}`} aria-hidden={!open}>
      <div className="panel-inner">
        <div className="panel-box">
          <h3>
            <span className="ln" />
            {label}
          </h3>
          {children}
        </div>
      </div>
    </div>
  )
}
