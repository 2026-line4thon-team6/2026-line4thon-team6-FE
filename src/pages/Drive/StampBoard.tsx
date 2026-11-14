import stampMapIcon from '@/assets/icons/stamp-map.svg'
import boardImage from '@/assets/images/stamp/stamp-board.webp'
import coralStamp from '@/assets/images/stamp/stamp-coral.webp'
import lockedStamp from '@/assets/images/stamp/stamp-locked.webp'
import pinkStamp from '@/assets/images/stamp/stamp-pink.webp'
import type { RestArea, StampBook } from '@/types/restArea'
import styles from './StampBoard.module.scss'

// Figma 289:20501 도장판(359 x 630) 위 칸 16개의 왼쪽 위 좌표
const SLOTS = [
  [98, 44],
  [177, 34],
  [288, 99],
  [177, 142],
  [95, 142],
  [2, 179],
  [62, 240],
  [288, 263],
  [199, 343],
  [116, 343],
  [5, 384],
  [79, 444],
  [164, 443],
  [293, 486],
  [172, 552],
  [83, 527],
] as const

interface StampBoardProps {
  book: StampBook | null
  onStampClick: (restArea: RestArea) => void
  onEmptyClick: () => void
}

const chunk = <T,>(items: T[], size: number) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size))

// 휴게소 스탬프 탭 (Figma 289:20501). 찍은 도장을 먼저 찍은 순서대로 채우고, 나머지는 잠긴 칸
function StampBoard({ book, onStampClick, onEmptyClick }: StampBoardProps) {
  const earned = (book?.items ?? [])
    .filter((area) => area.earned)
    .sort((a, b) => (a.earnedAt ?? '').localeCompare(b.earnedAt ?? ''))
  const capacity = Math.max(book?.capacity ?? SLOTS.length, earned.length)
  const slots: (RestArea | null)[] = Array.from({ length: capacity }, (_, i) => earned[i] ?? null)

  return (
    <>
      <p className={styles.eyebrow}>
        <span className={styles.eyebrowText}>함께 모아가는 작은 드라이브 기록</span>
        <img src={stampMapIcon} alt="" />
      </p>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>휴게소 스탬프</h2>
        {book && (
          <p className={styles.count} aria-label={`${book.capacity}개 중 ${book.earnedCount}개`}>
            {book.earnedCount} / {book.capacity}
          </p>
        )}
      </div>

      {/* 칸이 16개를 넘으면 도장판을 이어 붙인다 */}
      {chunk(slots, SLOTS.length).map((boardSlots, boardIndex) => (
        <ul key={boardIndex} className={styles.board} style={{ backgroundImage: `url(${boardImage})` }}>
          {boardSlots.map((area, i) => {
            const [left, top] = SLOTS[i]
            const index = boardIndex * SLOTS.length + i
            return (
              <li key={area?.id ?? `empty-${index}`} className={styles.slot} style={{ left, top }}>
                {area ? (
                  <button type="button" className={styles.stamp} onClick={() => onStampClick(area)} aria-label={`${area.name} 도장`}>
                    <img src={index % 2 === 1 ? pinkStamp : coralStamp} alt="" />
                  </button>
                ) : (
                  <button type="button" className={styles.stamp} onClick={onEmptyClick} aria-label="도장 찍기">
                    <img src={lockedStamp} alt="" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ))}
    </>
  )
}

export default StampBoard
