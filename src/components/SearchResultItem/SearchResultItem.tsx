import pinIcon from '@/assets/icons/pin-coral.svg'
import arrowImage from '@/assets/images/drive/search-arrow.webp'
import styles from './SearchResultItem.module.scss'

interface SearchResultItemProps {
  name: string // 예) 서울 반포 한강공원
  keyword: string // 이름에서 강조할 검색어. 예) 한강공원
  distance: string | null // 표시용 거리. 예) 3.2km. 위치를 모르면 null
  address: string // 주소 또는 휴게소가 있는 도로명
  // place: 목적지 검색 (화살표) / restArea: 휴게소 검색 (핀)
  variant?: 'place' | 'restArea'
  onSelect: () => void
  className?: string
}

// 이름 안의 검색어를 찾아 강조할 부분과 나머지로 나눈다 (대소문자 · 공백 무시, 처음 한 곳만)
function splitByKeyword(text: string, keyword: string) {
  const chars = [...keyword.replace(/\s+/g, '')]
  if (chars.length === 0) return null
  const pattern = chars.map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*')
  const match = new RegExp(pattern, 'i').exec(text)
  if (!match) return null
  const end = match.index + match[0].length
  return [text.slice(0, match.index), match[0], text.slice(end)]
}

// 장소 · 휴게소 검색 결과 한 줄. 목록(ul > li) 안에서 쓴다
function SearchResultItem({
  name,
  keyword,
  distance,
  address,
  variant = 'place',
  onSelect,
  className,
}: SearchResultItemProps) {
  const parts = splitByKeyword(name, keyword)

  return (
    <button type="button" className={[styles.item, className].filter(Boolean).join(' ')} onClick={onSelect}>
      {variant === 'place' ? (
        <img className={styles.arrow} src={arrowImage} alt="" />
      ) : (
        <img className={styles.pin} src={pinIcon} alt="" />
      )}
      <span className={styles.text}>
        <span className={styles.name}>
          {parts ? (
            <>
              {parts[0]}
              <mark className={styles.highlight}>{parts[1]}</mark>
              {parts[2]}
            </>
          ) : (
            name
          )}
        </span>
        <span className={styles.meta}>
          {distance && <span className={styles.distance}>{distance}</span>}
          <span className={styles.address}>{address}</span>
        </span>
      </span>
    </button>
  )
}

export default SearchResultItem
