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

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 }
const DEFAULT_LEVEL = 4

const PIN_Y_ANCHOR = 47.5 / 74

const ROUTE_LINES = [
  { strokeWeight: 20, strokeColor: '#FF8585', strokeOpacity: 0.3 },
  { strokeWeight: 12, strokeColor: '#FFFBFB', strokeOpacity: 1 },
  { strokeWeight: 7, strokeColor: '#FF7F6A', strokeOpacity: 1 },
]

const toLatLng = ({ latitude, longitude }: Coordinate) => ({ lat: latitude, lng: longitude })

interface DriveMapProps {
  current?: Coordinate | null
  currentMarker?: 'dot' | 'car'
  path?: Coordinate[]
  origin?: Coordinate | null
  destination?: Coordinate | null
  restAreas?: { id: string; name: string; coordinate: Coordinate }[]
  onRestAreaClick?: (restAreaId: string) => void
  fitPadding?: [number, number, number, number]
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
