import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react'
import musicNoteIcon from '@/assets/icons/music-note.svg'
import DriveMap from '@/components/DriveMap/DriveMap'
import DriveNameSheet from '@/components/DriveNameSheet/DriveNameSheet'
import DriveStats from '@/components/DriveStats/DriveStats'
import DriveTitleBar from '@/components/DriveTitleBar/DriveTitleBar'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import RouteSearchButton from '@/components/RouteSearchButton/RouteSearchButton'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import Toast from '@/components/Toast/Toast'
import type { Drive } from '@/types/drive'
import type { Coordinate } from '@/types/route'
import { getDriveStats } from '@/utils/driveStats'
import styles from './DrivePage.module.scss'
import DriveConfirmModal from './DriveConfirmModal'
import RestAreaAlert from './RestAreaAlert'

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
  origin?: Coordinate | null
  destination?: Coordinate | null
  restAreas?: { id: string; name: string; coordinate: Coordinate }[]
  onRestAreaClick?: (restAreaId: string) => void
  // 앞쪽 휴게소 접근 알림. 없으면 null
  restAreaAlert?: { name: string; meters: number } | null
  onRestAreaAlertClose?: () => void
  onRename: (title: string) => Promise<boolean>
  onRouteSearch: () => void
  onLocate?: () => void
  onPause?: () => void
  onResume?: () => void
  // 실패하면 false. 마치기 팝업이 그대로 남는다
  onEnd?: () => Promise<boolean>
  locationDenied?: boolean
  // 위치 재요청, 허용되면 true
  onLocationRetry?: () => Promise<boolean>
  // 콘텐츠 탭 카드
  contents?: ReactNode
  // 휴게소 스탬프 탭
  stamps?: ReactNode
}

const FIT_PADDING: [number, number, number, number] = [90, 70, 140, 40]

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

function DrivePage({
  status,
  drive,
  currentCoordinate = null,
  routePath,
  origin,
  destination,
  restAreas,
  onRestAreaClick,
  restAreaAlert = null,
  onRestAreaAlertClose,
  onRename,
  onRouteSearch,
  onLocate,
  onPause,
  onResume,
  onEnd,
  locationDenied = false,
  onLocationRetry,
  contents,
  stamps,
}: DrivePageProps) {
  const [renaming, setRenaming] = useState(false)
  const [confirmingEnd, setConfirmingEnd] = useState(false)
  const [ending, setEnding] = useState(false)
  const [tab, setTab] = useState<PanelTab>('contents')
  const [locateKey, setLocateKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  // 하단 패널: 기본 높이 ↔ 화면 전체 (Figma 드라이브 289:20284 · 스탬프 289:20501)
  const [expanded, setExpanded] = useState(false)
  const dragStartY = useRef<number | null>(null)
  const runningSeconds = useRunningSeconds(drive)

  const [locationDismissed, setLocationDismissed] = useState(false)
  const [prevLocationDenied, setPrevLocationDenied] = useState(locationDenied)
  if (locationDenied !== prevLocationDenied) {
    setPrevLocationDenied(locationDenied)
    if (!locationDenied) setLocationDismissed(false)
  }

  const driving = drive?.status === 'ACTIVE' || drive?.status === 'PAUSED'
  const paused = drive?.status === 'PAUSED'
  const askLocation = locationDenied && drive?.status === 'ACTIVE' && !locationDismissed && !confirmingEnd

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

  // 손잡이를 위아래로 밀거나 누르면 패널을 펼치고 접는다
  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const start = dragStartY.current
    dragStartY.current = null
    if (start === null) return
    const dy = event.clientY - start
    setExpanded((value) => (dy < -20 ? true : dy > 20 ? false : !value))
  }

  const locate = () => {
    setLocateKey((key) => key + 1)
    onLocate?.()
  }

  const retryLocation = async () => {
    setLocationDismissed(true)
    if (!(await onLocationRetry?.())) setToast('브라우저 설정에서 위치 권한을 허용해 주세요.')
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
          currentMarker={driving ? 'car' : 'dot'}
          path={routePath}
          origin={origin}
          destination={destination}
          restAreas={restAreas}
          onRestAreaClick={onRestAreaClick}
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

      <div className={[styles.bottom, expanded && styles.expanded].filter(Boolean).join(' ')}>
        <div className={styles.overlay} hidden={expanded}>
          <div className={styles.controlRow}>
            {restAreaAlert && (
              <RestAreaAlert
                className={styles.alert}
                name={restAreaAlert.name}
                meters={restAreaAlert.meters}
                onClose={() => onRestAreaAlertClose?.()}
              />
            )}
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
          </div>
          <DriveStats items={getDriveStats(drive, runningSeconds)} />
        </div>

        <section className={styles.panel} aria-label="드라이브 콘텐츠">
          <button
            type="button"
            className={styles.handle}
            aria-label={expanded ? '패널 접기' : '패널 펼치기'}
            aria-expanded={expanded}
            onPointerDown={(event) => {
              dragStartY.current = event.clientY
            }}
            onPointerUp={handlePointerUp}
            // 키보드(Enter · Space)로 누를 때
            onClick={(event) => event.detail === 0 && setExpanded((value) => !value)}
          />
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
        <DriveConfirmModal
          title="드라이브를 마치시겠어요?"
          description="조금 더 달리고 싶다면 경로를 수정해 보세요."
          cancelLabel="경로 수정"
          confirmLabel="드라이브 종료"
          cancelWidth={117}
          confirmDisabled={ending}
          onCancel={editRoute}
          onConfirm={() => void handleEnd()}
          onClose={() => setConfirmingEnd(false)}
        />
      )}

      {askLocation && (
        <DriveConfirmModal
          title="위치 권한이 꺼져있어요."
          description="위치 권한 허용이 안될 시 드라이브 주행 기록이 불가해요."
          cancelLabel="주행 중단하기"
          confirmLabel="설정으로 이동하기"
          cancelWidth={136}
          onCancel={() => onPause?.()}
          onConfirm={() => void retryLocation()}
          onClose={() => setLocationDismissed(true)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

export default DrivePage
