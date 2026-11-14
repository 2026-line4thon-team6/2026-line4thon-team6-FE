import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'
import { getDeviceScale } from '@/utils/deviceScale'
import styles from './DeviceFrame.module.scss'

function useDeviceScale() {
  const [scale, setScale] = useState(() => getDeviceScale(window.innerHeight))

  useEffect(() => {
    const update = () => setScale(getDeviceScale(window.innerHeight))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return scale
}

interface DeviceFrameProps {
  children: ReactNode
}

// 데스크톱에서 앱을 아이폰 16 모양 프레임 안에 띄운다. 모바일 · 태블릿에서는 프레임이 사라지고 앱이 화면 전체를 쓴다 (CSS)
function DeviceFrame({ children }: DeviceFrameProps) {
  const scale = useDeviceScale()

  return (
    <div className={styles.device} style={{ '--device-scale': scale } as CSSProperties}>
      <span data-device-deco aria-hidden="true" className={`${styles.deco} ${styles.button} ${styles.action}`} />
      <span data-device-deco aria-hidden="true" className={`${styles.deco} ${styles.button} ${styles.volumeUp}`} />
      <span data-device-deco aria-hidden="true" className={`${styles.deco} ${styles.button} ${styles.volumeDown}`} />
      <span data-device-deco aria-hidden="true" className={`${styles.deco} ${styles.button} ${styles.power}`} />
      {/* 바깥(screen)은 position: fixed의 기준, 안쪽(scroller)은 스크롤 영역. 한 요소가 둘 다 하면 고정 요소가 내용과 같이 스크롤된다 */}
      <div className={styles.screen}>
        <div className={styles.scroller} data-scroll-root>
          {children}
        </div>
      </div>
      <span data-device-deco aria-hidden="true" className={`${styles.deco} ${styles.island}`} />
      <span data-device-deco aria-hidden="true" className={`${styles.deco} ${styles.homeIndicator}`} />
    </div>
  )
}

export default DeviceFrame
