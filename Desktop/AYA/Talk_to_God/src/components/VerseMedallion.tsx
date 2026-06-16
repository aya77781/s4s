import { Medallion } from './Ornaments'
import { toArabicDigits } from '../lib/ornaments'

interface Props {
  number: number
}

/** Médaillon stylisé affichant le numéro du verset (chiffres arabes). */
export default function VerseMedallion({ number }: Props) {
  return (
    <span className="medallion" aria-label={`الآية رقم ${number}`}>
      <Medallion />
      <span className="n">{toArabicDigits(number)}</span>
    </span>
  )
}
