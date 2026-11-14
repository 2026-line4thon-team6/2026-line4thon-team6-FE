import type { FormEvent, InputHTMLAttributes } from 'react'
import pinsIcon from '@/assets/icons/route-pins.svg'
import waypointAddIcon from '@/assets/icons/waypoint-add.svg'
import styles from './RouteSearchBox.module.scss'

interface RouteSearchBoxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'onSubmit'> {
  // 출발지. 예) originLabel '내 위치', originDetail '서초구 서초동'
  originLabel: string
  originDetail?: string
  destination: string
  onDestinationChange: (value: string) => void
  // 키보드 검색(Enter)으로 검색어를 확정할 때
  onSearch: (keyword: string) => void
  // 경유지 추가 (+). 결과 화면 미정이라 생략하면 버튼을 숨긴다
  onAddWaypoint?: () => void
}

// 장소 검색·경로 설정 상단의 출발지 / 도착지 입력창
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
