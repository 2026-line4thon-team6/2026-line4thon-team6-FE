import { useEffect, useState } from 'react'
import { CustomOverlayMap, Map, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import currentLocationIcon from '@/assets/icons/current-location.svg'
import mapPinIcon from '@/assets/icons/map-pin.svg'
import originDotIcon from '@/assets/icons/origin-dot.svg'
import carImage from '@/assets/images/drive/map-car.webp'
import restAreaImage from '@/assets/images/stamp/rest-area.webp'
import type { Coordinate } from '@/types/route'
import styles from './DriveMap.module.scss'

const APP_KEY: string = import.meta.env.VITE_KAKAO_MAP_KEY ?? ''

// 위치를 모를 때 (서울시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_LEVEL = 4

// map-pin.svg는 그림자 여백을 포함한 64 x 74. 핀 끝이 좌표에 오게 한다
const PIN_Y_ANCHOR = 47.5 / 74

// 카카오 선은 그림자 · 그라데이션이 없어서 흐린 넓은 선 · 흰 테두리 · 단색 선을 겹친다
const ROUTE_LINES = [
  { strokeWeight: 20, strokeColor: '#FF8585', strokeOpacity: 0.3 },
  { strokeWeight: 12, strokeColor: '#FFFBFB', strokeOpacity: 1 },
  { strokeWeight: 7, strokeColor: '#FF7F6A', strokeOpacity: 1 },
]

const toLatLng = ({ latitude, longitude }: Coordinate) => ({ lat: latitude, lng: longitude })

interface DriveMapProps {
  current?: Coordinate | null
  // dot: 경로 전 현재 위치 / car: 주행 중 현재 위치
  currentMarker?: 'dot' | 'car'
  path?: Coordinate[]
  origin?: Coordinate | null
  destination?: Coordinate | null
  // 경로 위 휴게소 (Figma 휴게소 1~3). 누르면 상세를 연다
  restAreas?: { id: string; name: string; coordinate: Coordinate }[]
  onRestAreaClick?: (restAreaId: string) => void
  // [위, 오른쪽, 아래, 왼쪽]
  fitPadding?: [number, number, number, number]
  // 바뀔 때마다 현재 위치로 옮긴다
  locateKey?: number
}

function KakaoDriveMap({
  current = null,
  currentMarker = 'dot',
  path = [],
  origin,
  destination,
  restAreas = [],
  onRestAreaClick,
  fitPadding = [40, 40, 40, 40],
  locateKey = 0,
}: DriveMapProps) {
  const [loading, error] = useKakaoLoader({ appkey: APP_KEY })
  const [map, setMap] = useState<kakao.maps.Map | null>(null)
  const [initialCenter] = useState(() => (current ? toLatLng(current) : DEFAULT_CENTER))
  const hasPath = path.length > 1
  const [top, right, bottom, left] = fitPadding

  useEffect(() => {
    if (!map || !hasPath) return
    const bounds = new kakao.maps.LatLngBounds()
    for (const point of path) bounds.extend(new kakao.maps.LatLng(point.latitude, point.longitude))
    map.setBounds(bounds, top, right, bottom, left)
  }, [map, path, hasPath, top, right, bottom, left])

  // 경로가 있으면 전체 경로를 보여 주다가 현재 위치 버튼을 눌렀을 때만 옮긴다
  const lat = current?.latitude
  const lng = current?.longitude
  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return
    if (hasPath && locateKey === 0) return
    map.panTo(new kakao.maps.LatLng(lat, lng))
  }, [map, lat, lng, hasPath, locateKey])

  if (error) return <div className={styles.fallback}>지도를 불러오지 못했어요.</div>
  if (loading) return <div className={styles.map} aria-busy="true" />

  return (
    <Map className={styles.map} center={initialCenter} level={DEFAULT_LEVEL} onCreate={setMap}>
      {hasPath && ROUTE_LINES.map((line) => <Polyline key={line.strokeWeight} path={path.map(toLatLng)} {...line} />)}
      {origin && (
        <CustomOverlayMap position={toLatLng(origin)}>
          <img className={styles.origin} src={originDotIcon} alt="" />
        </CustomOverlayMap>
      )}
      {restAreas.map((area) => (
        <CustomOverlayMap key={area.id} position={toLatLng(area.coordinate)} clickable>
          <button
            type="button"
            className={styles.restArea}
            onClick={() => onRestAreaClick?.(area.id)}
            aria-label={`${area.name} 상세 보기`}
          >
            <img src={restAreaImage} alt="" />
          </button>
        </CustomOverlayMap>
      ))}
      {destination && (
        <CustomOverlayMap position={toLatLng(destination)} yAnchor={PIN_Y_ANCHOR}>
          <img className={styles.pin} src={mapPinIcon} alt="" />
        </CustomOverlayMap>
      )}
      {current && (
        <CustomOverlayMap position={toLatLng(current)}>
          {currentMarker === 'car' ? (
            <img className={styles.car} src={carImage} alt="" />
          ) : (
            <img className={styles.current} src={currentLocationIcon} alt="" />
          )}
        </CustomOverlayMap>
      )}
    </Map>
  )
}

// 키가 없으면 SDK를 부르지 않는다
function DriveMap(props: DriveMapProps) {
  if (!APP_KEY) {
    return (
      <div className={styles.placeholder}>
        <img className={styles.current} src={currentLocationIcon} alt="" />
      </div>
    )
  }
  return <KakaoDriveMap {...props} />
}

export default DriveMap
