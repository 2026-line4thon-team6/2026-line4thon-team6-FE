import pinIcon from '@/assets/icons/pin-coral.svg'
import arrowImage from '@/assets/images/drive/search-arrow.webp'
import styles from './SearchResultItem.module.scss'

interface SearchResultItemProps {
  name: string
  keyword: string
  distance: string | null
  address: string
  variant?: 'place' | 'restArea'
  onSelect: () => void
  className?: string
}

function splitByKeyword(text: string, keyword: string) {
  const chars = [...keyword.replace(/\s+/g, '')]
  if (chars.length === 0) return null
  const pattern = chars.map((char) => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s*')
  const match = new RegExp(pattern, 'i').exec(text)
  if (!match) return null
  const end = match.index + match[0].length
  return [text.slice(0, match.index), match[0], text.slice(end)]
}

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
