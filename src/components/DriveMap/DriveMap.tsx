import { useEffect, useState } from 'react'
import { CustomOverlayMap, Map, Polyline, useKakaoLoader } from 'react-kakao-maps-sdk'
import currentLocationIcon from '@/assets/icons/current-location.svg'
import mapPinIcon from '@/assets/icons/map-pin.svg'
import type { Coordinate } from '@/types/route'
import styles from './DriveMap.module.scss'

const APP_KEY: string = import.meta.env.VITE_KAKAO_MAP_KEY ?? ''

// 위치를 아직 모를 때 (서울시청)
const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_LEVEL = 4

// map-pin.svg는 그림자 여백을 포함한 64 x 74. 핀 끝(그림자 타원 가운데)이 좌표에 오게 한다
const PIN_Y_ANCHOR = 47.5 / 74

// Figma 경로 선: 흰 테두리 12px 위에 코랄 그라데이션 7px. 카카오 선은 단색이라 가운데 색을 쓴다
const ROUTE_BORDER = { strokeWeight: 12, strokeColor: '#FFFBFB', strokeOpacity: 1 }
const ROUTE_LINE = { strokeWeight: 7, strokeColor: '#FF7F6A', strokeOpacity: 1 }

const toLatLng = ({ latitude, longitude }: Coordinate) => ({ lat: latitude, lng: longitude })

interface DriveMapProps {
  className?: string
  current: Coordinate | null
  path?: Coordinate[]
  destination?: Coordinate | null
  // 경로 전체를 맞춰 보일 때 화면 가장자리에서 띄울 여백 [위, 오른쪽, 아래, 왼쪽]
  fitPadding?: [number, number, number, number]
  // 바뀔 때마다 현재 위치로 지도를 옮긴다
  locateKey?: number
}

function KakaoDriveMap({ className, current, path = [], destination, fitPadding = [40, 40, 40, 40], locateKey = 0 }: DriveMapProps) {
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

  // 경로를 보여 줄 때는 현재 위치 버튼을 눌렀을 때만 옮긴다
  const lat = current?.latitude
  const lng = current?.longitude
  useEffect(() => {
    if (!map || lat === undefined || lng === undefined) return
    if (hasPath && locateKey === 0) return
    map.panTo(new kakao.maps.LatLng(lat, lng))
  }, [map, lat, lng, hasPath, locateKey])

  if (error) return <div className={[styles.fallback, className].filter(Boolean).join(' ')}>지도를 불러오지 못했어요.</div>
  if (loading) return <div className={[styles.map, className].filter(Boolean).join(' ')} aria-busy="true" />

  return (
    <Map className={[styles.map, className].filter(Boolean).join(' ')} center={initialCenter} level={DEFAULT_LEVEL} onCreate={setMap}>
      {hasPath && (
        <>
          <Polyline path={path.map(toLatLng)} {...ROUTE_BORDER} />
          <Polyline path={path.map(toLatLng)} {...ROUTE_LINE} />
        </>
      )}
      {destination && (
        <CustomOverlayMap position={toLatLng(destination)} yAnchor={PIN_Y_ANCHOR}>
          <img className={styles.pin} src={mapPinIcon} alt="" />
        </CustomOverlayMap>
      )}
      {current && (
        <CustomOverlayMap position={toLatLng(current)}>
          <img className={styles.current} src={currentLocationIcon} alt="" />
        </CustomOverlayMap>
      )}
    </Map>
  )
}

// 드라이브 모드 지도. 키가 없으면 SDK를 부르지 않고 현재 위치 점만 있는 빈 지도를 보여 준다
function DriveMap(props: DriveMapProps) {
  if (!APP_KEY) {
    return (
      <div className={[styles.placeholder, props.className].filter(Boolean).join(' ')}>
        <img className={styles.current} src={currentLocationIcon} alt="" />
      </div>
    )
  }
  return <KakaoDriveMap {...props} />
}

export default DriveMap
