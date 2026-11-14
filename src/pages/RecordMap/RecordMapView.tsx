import { CustomOverlayMap, Map, useKakaoLoader } from 'react-kakao-maps-sdk'
import type { RecordMapMarker } from '@/types/record'
import RecordMarker from './RecordMarker'
import styles from './RecordMapView.module.scss'

// 카카오 개발자 콘솔의 JavaScript 키. 콘솔에 등록한 웹 도메인(localhost:5173 등)에서만 동작한다
const APP_KEY: string = import.meta.env.VITE_KAKAO_MAP_KEY ?? ''

// 처음에는 남한 전체가 보이게 한다 (Figma 기록 지도 화면)
// 카카오 지도 레벨은 정수 단계뿐이라, 12는 남한이 잘리고 13이 Figma에 가장 가깝다
const KOREA_CENTER = { lat: 35.8, lng: 127.9 }
const KOREA_LEVEL = 13

// 마커 전체 높이 71px(말풍선 61 + 점 10) 중 점의 가운데(66px)가 좌표에 오게 한다
const MARKER_Y_ANCHOR = 66 / 71

interface RecordMapViewProps {
  markers: RecordMapMarker[]
  onMarkerClick: (marker: RecordMapMarker) => void
}

function KakaoRecordMap({ markers, onMarkerClick }: RecordMapViewProps) {
  const [loading, error] = useKakaoLoader({ appkey: APP_KEY })

  if (error) return <p className={styles.fallback}>지도를 불러오지 못했어요.</p>
  if (loading) return <div className={styles.map} aria-busy="true" />

  return (
    <Map className={styles.map} center={KOREA_CENTER} level={KOREA_LEVEL}>
      {markers.map((marker) => (
        <CustomOverlayMap
          key={marker.groupKey}
          position={{ lat: marker.coordinate.latitude, lng: marker.coordinate.longitude }}
          yAnchor={MARKER_Y_ANCHOR}
          clickable
        >
          <RecordMarker marker={marker} onClick={onMarkerClick} />
        </CustomOverlayMap>
      ))}
    </Map>
  )
}

// 카카오 지도 위에 기록 사진 마커를 올린다. 키가 없으면 SDK를 부르지 않고 안내만 보여준다
function RecordMapView(props: RecordMapViewProps) {
  if (!APP_KEY) return <p className={styles.fallback}>지도 키(VITE_KAKAO_MAP_KEY)가 설정되지 않았어요.</p>
  return <KakaoRecordMap {...props} />
}

export default RecordMapView
