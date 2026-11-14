import { useEffect, useState, type ReactNode } from 'react'
import musicNoteIcon from '@/assets/icons/music-note.svg'
import DriveMap from '@/components/DriveMap/DriveMap'
import DriveNameSheet from '@/components/DriveNameSheet/DriveNameSheet'
import DriveStats from '@/components/DriveStats/DriveStats'
import DriveTitleBar from '@/components/DriveTitleBar/DriveTitleBar'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import RouteSearchButton from '@/components/RouteSearchButton/RouteSearchButton'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import type { Drive } from '@/types/drive'
import type { Coordinate } from '@/types/route'
import { getDriveStats } from '@/utils/driveStats'
import styles from './DrivePage.module.scss'
import EndDriveModal from './EndDriveModal'

type PanelTab = 'contents' | 'stamps'

const TABS = [
  { value: 'contents' as const, label: '콘텐츠' },
  { value: 'stamps' as const, label: '휴게소 스탬프' },
]

interface DrivePageProps {
  status: 'loading' | 'ready' | 'error'
  drive: Drive | null
  currentCoordinate?: Coordinate | null
  routePath?: Coordinate[]
  destination?: Coordinate | null
  onRename: (title: string) => Promise<boolean>
  onRouteSearch: () => void
  onLocate?: () => void
  onPause?: () => void
  onResume?: () => void
  // 성공하면 true. 팝업은 실패했을 때만 남는다
  onEnd?: () => Promise<boolean>
  // 콘텐츠 탭 카드 (DJ 플레이리스트 · 라디오 · 게임)
  contents?: ReactNode
  // 휴게소 스탬프 탭
  stamps?: ReactNode
}

// 경로 전체를 맞출 때 제목 · 버튼 · 주행 정보에 가리지 않게 띄운다
const FIT_PADDING: [number, number, number, number] = [90, 70, 140, 40]

// 주행 중에는 마지막으로 받은 주행 시간에 화면에서 흐른 초를 더해 보여 준다
function useRunningSeconds(drive: Drive | null) {
  const [tick, setTick] = useState({ drive, seconds: 0 })

  useEffect(() => {
    if (drive?.status !== 'ACTIVE') return
    const syncedAt = Date.now()
    const id = setInterval(() => setTick({ drive, seconds: Math.floor((Date.now() - syncedAt) / 1000) }), 1000)
    return () => clearInterval(id)
  }, [drive])

  return tick.drive === drive ? tick.seconds : 0
}

// 드라이브 모드 (Figma 첫 진입 화면 289:20959, 드라이브 289:20284, 주행 중단 289:19560)
function DrivePage({
  status,
  drive,
  currentCoordinate = null,
  routePath,
  destination,
  onRename,
  onRouteSearch,
  onLocate,
  onPause,
  onResume,
  onEnd,
  contents,
  stamps,
}: DrivePageProps) {
  const [renaming, setRenaming] = useState(false)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const [tab, setTab] = useState<PanelTab>('contents')
  const [locateKey, setLocateKey] = useState(0)
  const runningSeconds = useRunningSeconds(drive)

  const driving = drive?.status === 'ACTIVE' || drive?.status === 'PAUSED'
  const paused = drive?.status === 'PAUSED'

  const handleRename = async (title: string) => {
    if (await onRename(title)) setRenaming(false)
  }

  const handleEnd = async () => {
    if (!onEnd) return
    setEnding(true)
    const ended = await onEnd()
    setEnding(false)
    if (ended) setConfirmingEnd(false)
  }

  const locate = () => {
    setLocateKey((key) => key + 1)
    onLocate?.()
  }

  const editRoute = () => {
    setConfirmingEnd(false)
    onRouteSearch()
  }

  return (
    <div className={styles.page}>
      <div className={styles.map}>
        <DriveMap
          current={currentCoordinate}
          path={routePath}
          destination={destination}
          fitPadding={FIT_PADDING}
          locateKey={locateKey}
        />
      </div>

      {paused && (
        <button type="button" className={styles.pausedLayer} onClick={onResume} aria-label="주행 재개">
          <span className={styles.pausedText}>
            <strong className={styles.pausedTitle}>기록이 중단되었어요.</strong>
            화면을 한 번 터치해 주행을 재개해 주세요.
          </span>
        </button>
      )}

      <header className={styles.header}>
        {drive && <DriveTitleBar className={styles.title} title={drive.title} onClick={() => setRenaming(true)} />}
        <RouteSearchButton className={styles.routeButton} onClick={onRouteSearch} />
      </header>

      {status === 'error' && (
        <p role="alert" className={styles.error}>
          드라이브 정보를 불러오지 못했어요.
        </p>
      )}

      <div className={styles.bottom}>
        <div className={styles.overlay}>
          <div className={styles.controls}>
            {driving && (
              <>
                <GlassIconButton icon="exit" aria-label="드라이브 마치기" onClick={() => setConfirmingEnd(true)} />
                <GlassIconButton
                  icon="pause"
                  aria-label="주행 기록 일시정지"
                  aria-pressed={paused}
                  onClick={paused ? onResume : onPause}
                />
              </>
            )}
            <GlassIconButton icon="locate" aria-label="현재 위치로 이동" onClick={locate} />
          </div>
          <DriveStats items={getDriveStats(drive, runningSeconds)} />
        </div>

        <section className={styles.panel} aria-label="드라이브 콘텐츠">
          <div className={styles.handle} />
          <SegmentedControl aria-label="콘텐츠 종류" options={TABS} value={tab} onChange={setTab} />

          {tab === 'contents' ? (
            <div role="tabpanel" aria-label="콘텐츠" className={styles.tabPanel}>
              <p className={styles.eyebrow}>
                <span className={styles.eyebrowText}>둘만의 드라이브를 더욱 특별하게</span>
                <img src={musicNoteIcon} alt="" />
              </p>
              <h2 className={styles.heading}>함께 즐길 콘텐츠</h2>
              {contents}
            </div>
          ) : (
            <div role="tabpanel" aria-label="휴게소 스탬프" className={styles.tabPanel}>
              {stamps}
            </div>
          )}
        </section>
      </div>

      {drive && (
        <DriveNameSheet
          open={renaming}
          mode="edit"
          defaultName={drive.title}
          onSubmit={(title) => void handleRename(title)}
          onClose={() => setRenaming(false)}
        />
      )}

      {confirmingEnd && (
        <EndDriveModal
          ending={ending}
          onEditRoute={editRoute}
          onEnd={() => void handleEnd()}
          onClose={() => setConfirmingEnd(false)}
        />
      )}
    </div>
  )
}

export default DrivePage
