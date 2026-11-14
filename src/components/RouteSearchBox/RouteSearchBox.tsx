import type { FormEvent, InputHTMLAttributes } from 'react'
import pinsIcon from '@/assets/icons/route-pins.svg'
import waypointAddIcon from '@/assets/icons/waypoint-add.svg'
import styles from './RouteSearchBox.module.scss'

interface RouteSearchBoxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSubmit'> {
  originLabel: string
  originDetail?: string
  destination: string
  onDestinationChange: (value: string) => void
  onSearch: (keyword: string) => void
  onAddWaypoint?: () => void
}

function RouteSearchBox({
  originLabel,
  originDetail,
  destination,
  onDestinationChange,
  onSearch,
  onAddWaypoint,
  className,
  placeholder = '도착지를 입력해주세요.',
  ...inputProps
}: RouteSearchBoxProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const keyword = destination.trim()
    if (keyword) onSearch(keyword)
  }

  return (
    <form role="search" className={[styles.box, className].filter(Boolean).join(' ')} onSubmit={handleSubmit}>
      <img className={styles.pins} src={pinsIcon} alt="" />

      <div className={styles.fields}>
        <p className={styles.origin}>
          <span className={styles.originLabel}>{originLabel}</span>
          {originDetail && <span className={styles.originDetail}>({originDetail})</span>}
        </p>
        <input
          type="text"
          className={styles.destination}
          value={destination}
          onChange={(event) => onDestinationChange(event.target.value)}
          placeholder={placeholder}
          aria-label="도착지"
          enterKeyHint="search"
          autoComplete="off"
          {...inputProps}
        />
      </div>

      {onAddWaypoint && (
        <button type="button" className={styles.waypoint} aria-label="경유지 추가" onClick={onAddWaypoint}>
          <img src={waypointAddIcon} alt="" />
        </button>
      )}
    </form>
  )
}

export default RouteSearchBox
