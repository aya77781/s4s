import type { RevelationType } from '../types'

interface Props {
  type: RevelationType
}

/** Badge pilule : مكية (teinte or) / مدنية (teinte verte). */
export default function RevelationBadge({ type }: Props) {
  if (!type) return null
  const cls = type === 'مكية' ? 'badge meccan' : 'badge medinan'
  return <span className={cls}>{type}</span>
}
