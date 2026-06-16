import type { RandomAyah } from '../types'
import { CornerStar, MihrabArch, Star } from './Ornaments'
import VerseMedallion from './VerseMedallion'
import VerseContext from './VerseContext'
import RevelationBadge from './RevelationBadge'

interface Props {
  ayah: RandomAyah
  /** Change à chaque nouveau verset → relance l'animation du texte. */
  animationKey: number
}

/** Carte centrale marocaine : arche, zellige, verset, référence et contexte. */
export default function AyahCard({ ayah, animationKey }: Props) {
  return (
    <>
      <div className="card">
        <MihrabArch className="arch" />
        <CornerStar className="corner tl" />
        <CornerStar className="corner tr" />
        <CornerStar className="corner bl" />
        <CornerStar className="corner br" />

        {/* La `key` relance l'animation de fondu à chaque nouveau verset */}
        <p key={animationKey} className="verse">
          {ayah.text}
        </p>

        <div className="divider">
          <span className="ln" />
          <Star className="st" />
          <span className="ln" />
        </div>

        <div className="ayah-no">
          <VerseMedallion number={ayah.verseNumber} />
          <div className="surah">
            <span>سورة {ayah.surahName}</span>
            <RevelationBadge type={ayah.revelationType} />
            <span className="sub">· الآية {ayah.verseNumber}</span>
          </div>
        </div>

        {/* Sections de profondeur : tafsir, contexte (Ibn Kathir), intro sourate */}
        <VerseContext ayah={ayah} />
      </div>
    </>
  )
}
