import { useState, type ReactNode } from 'react'
import currentLocationIcon from '@/assets/icons/current-location.svg'
import musicNoteIcon from '@/assets/icons/music-note.svg'
import DriveNameSheet from '@/components/DriveNameSheet/DriveNameSheet'
import DriveStats from '@/components/DriveStats/DriveStats'
import DriveTitleBar from '@/components/DriveTitleBar/DriveTitleBar'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import RouteSearchButton from '@/components/RouteSearchButton/RouteSearchButton'
import SegmentedControl from '@/components/SegmentedControl/SegmentedControl'
import type { Drive } from '@/types/drive'
import { getDriveStats } from '@/utils/driveStats'
import styles from './DrivePage.module.scss'

type PanelTab = 'contents' | 'stamps'

const TABS = [
  { value: 'contents' as const, label: '콘텐츠' },
  { value: 'stamps' as const, label: '휴게소 스탬프' },
]

interface DrivePageProps {
  status: 'loading' | 'ready' | 'error'
  drive: Drive | null
  onRename: (title: string) => Promise<boolean>
  onRouteSearch: () => void
  onLocate?: () => void
  // 콘텐츠 탭 카드 (DJ 플레이리스트 · 라디오 · 게임)
  contents?: ReactNode
  // 휴게소 스탬프 탭
  stamps?: ReactNode
}

// 드라이브 모드 첫 진입 화면 (Figma 289:20959)
function DrivePage({ status, drive, onRename, onRouteSearch, onLocate, contents, stamps }: DrivePageProps) {
  const [renaming, setRenaming] = useState(false)
  const [tab, setTab] = useState<PanelTab>('contents')

  const handleRename = async (title: string) => {
    if (await onRename(title)) setRenaming(false)
  }

  return (
    <div className={styles.page}>
      {/* TODO: 카카오맵 연동 */}
      <div className={styles.map} aria-hidden="true">
        <img className={styles.marker} src={currentLocationIcon} alt="" />
      </div>

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
          <GlassIconButton className={styles.locate} icon="locate" aria-label="현재 위치로 이동" onClick={onLocate} />
          <DriveStats items={getDriveStats(drive)} />
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
    </div>
  )
}

export default DrivePage
