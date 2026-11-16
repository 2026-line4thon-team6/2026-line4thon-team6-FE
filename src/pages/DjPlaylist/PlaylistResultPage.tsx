import { useEffect, useRef, useState, type PointerEvent } from 'react'
import dragDots from '@/assets/icons/dj/drag-dots.svg'
import GlassIconButton from '@/components/GlassIconButton/GlassIconButton'
import type { Playlist, PlaylistTrack } from '@/types/playlist'
import { keywordOf } from '@/utils/playlistKeywords'
import styles from './PlaylistResultPage.module.scss'

// Figma 곡 한 줄(47) + 위아래 여백(10) + 구분선
const ROW_PITCH = 67
const EDGE = 72
const MAX_SPEED = 14
const FRAME_MS = 16

function scrollParent(element: HTMLElement): HTMLElement {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node)
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node
  }
  return (document.scrollingElement as HTMLElement | null) ?? document.documentElement
}
const SWIPE_OPEN = 72
const SWIPE_MIN = 8
const SWIPE_OVERSHOOT = 16

interface PlaylistResultPageProps {
  playlist: Playlist
  onToggleSave: () => void
  onReorder: (trackIds: string[]) => void
  onDelete: (trackId: string) => void
  onRestart: () => void
  onSave: () => void
  onBack: () => void
}

const pad = (value: number) => String(value).padStart(2, '0')
const formatTrackTime = (seconds: number) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`
const formatTotal = (seconds: number) => {
  const minutes = Math.round(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `약 ${hours}시간 ${pad(minutes % 60)}분` : `약 ${minutes}분`
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="20.4" height="26.4" viewBox="0 0 20.4 26.4" fill="none" aria-hidden>
      <path
        d="M1.2 7.6C1.2 5.36 1.2 4.24 1.62 3.38C1.99 2.63 2.58 2.02 3.31 1.64C4.13 1.2 5.21 1.2 7.37 1.2H13.03C15.19 1.2 16.27 1.2 17.09 1.64C17.82 2.02 18.41 2.63 18.78 3.38C19.2 4.24 19.2 5.36 19.2 7.6V25.2L10.2 19.87L1.2 25.2V7.6Z"
        fill={filled ? '#F49780' : '#FFEAE6'}
        stroke="#F49780"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface TrackRowProps {
  track: PlaylistTrack
  index: number
  open: boolean
  offset: number
  dragging: boolean
  onSwipe: (open: boolean) => void
  onDelete: () => void
  onDragStart: (event: PointerEvent<HTMLButtonElement>) => void
  onDragMove: (event: PointerEvent<HTMLButtonElement>) => void
  onDragEnd: () => void
}

function TrackRow({
  track,
  index,
  open,
  offset,
  dragging,
  onSwipe,
  onDelete,
  onDragStart,
  onDragMove,
  onDragEnd,
}: TrackRowProps) {
  const swipeStart = useRef<number | null>(null)
  const moved = useRef(false)
  const [swipeX, setSwipeX] = useState<number | null>(null)
  const restX = open ? -SWIPE_OPEN : 0
  const x = swipeX ?? restX
  const fromHandle = (event: PointerEvent<HTMLDivElement>) => !!(event.target as HTMLElement).closest('button')
  const settle = (clientX: number) => {
    const start = swipeStart.current
    swipeStart.current = null
    setSwipeX(null)
    if (start === null) return
    const dx = clientX - start
    if (Math.abs(dx) < SWIPE_MIN) return
    onSwipe(restX + dx < -SWIPE_OPEN / 2)
  }

  const info = (
    <>
      {track.albumImageUrl ? (
        <img className={styles.album} src={track.albumImageUrl} alt="" />
      ) : (
        <span className={styles.album} />
      )}
      <span className={styles.names}>
        <span className={styles.songTitle}>{track.title}</span>
        <span className={styles.artist}>{track.artist}</span>
      </span>
      <span className={styles.time}>{formatTrackTime(track.durationSeconds)}</span>
    </>
  )

  return (
    <li
      className={[styles.track, dragging && styles.dragging].filter(Boolean).join(' ')}
      style={{ transform: offset ? `translateY(${offset}px)` : undefined }}
    >
      <div
        className={[styles.trackBody, swipeX !== null && styles.swiping].filter(Boolean).join(' ')}
        style={{ transform: x ? `translateX(${x}px)` : undefined }}
        onPointerDown={(event) => {
          if (fromHandle(event)) return
          swipeStart.current = event.clientX
          moved.current = false
        }}
        onPointerMove={(event) => {
          const start = swipeStart.current
          if (start === null) return
          const dx = event.clientX - start
          if (swipeX === null && Math.abs(dx) < SWIPE_MIN) return
          if (!moved.current) {
            moved.current = true
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }
          setSwipeX(Math.min(0, Math.max(-SWIPE_OPEN - SWIPE_OVERSHOOT, restX + dx)))
        }}
        onPointerUp={(event) => settle(event.clientX)}
        onPointerCancel={() => {
          swipeStart.current = null
          setSwipeX(null)
        }}
      >
        <span className={styles.order}>{pad(index + 1)}</span>
        {track.externalUrl ? (
          <a
            className={styles.info}
            href={track.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${track.title} - ${track.artist}, 스포티파이에서 듣기`}
            onClick={(event) => {
              const swiped = moved.current
              moved.current = false
              if (!swiped && !open) return
              event.preventDefault()
              if (open && !swiped) onSwipe(false)
            }}
          >
            {info}
          </a>
        ) : (
          <span className={styles.info}>{info}</span>
        )}
        <button
          type="button"
          className={styles.handle}
          aria-label={`${track.title} 순서 바꾸기`}
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <img src={dragDots} alt="" />
          <img src={dragDots} alt="" />
        </button>
      </div>
      <button
        type="button"
        className={styles.delete}
        style={{ opacity: Math.min(1, -x / SWIPE_OPEN), transition: swipeX !== null ? 'none' : undefined }}
        tabIndex={open ? 0 : -1}
        aria-hidden={!open}
        onClick={onDelete}
      >
        삭제
      </button>
    </li>
  )
}

// DJ 플레이리스트 생성 완료 (Figma 289:19927 · 삭제 289:20105)
function PlaylistResultPage({
  playlist,
  onToggleSave,
  onReorder,
  onDelete,
  onRestart,
  onSave,
  onBack,
}: PlaylistResultPageProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [drag, setDrag] = useState<{ id: string; startY: number; dy: number } | null>(null)
  const scroller = useRef<HTMLElement | null>(null)
  const pointerY = useRef(0)
  const footer = useRef<HTMLElement>(null)
  const keywords = [...playlist.moods, playlist.weather, ...playlist.genres].map(keywordOf)

  const tracks = playlist.tracks
  const dragIndex = drag ? tracks.findIndex((track) => track.id === drag.id) : -1
  const targetIndex = drag
    ? Math.min(Math.max(dragIndex + Math.round(drag.dy / ROW_PITCH), 0), tracks.length - 1)
    : -1

  // 끄는 곡이 지나간 자리의 곡들을 한 칸씩 밀어 보여 준다
  const offsetOf = (index: number) => {
    if (!drag) return 0
    if (index === dragIndex) return drag.dy
    if (dragIndex < index && index <= targetIndex) return -ROW_PITCH
    if (targetIndex <= index && index < dragIndex) return ROW_PITCH
    return 0
  }

  const dragging = drag !== null
  useEffect(() => {
    const element = scroller.current
    if (!dragging || !element) return
    const tick = () => {
      const isPage = element === document.scrollingElement
      const top = isPage ? 0 : element.getBoundingClientRect().top
      const bottom =
        footer.current?.getBoundingClientRect().top ??
        (isPage ? window.innerHeight : element.getBoundingClientRect().bottom)
      const y = pointerY.current
      const down = Math.min(1, Math.max(0, (y - (bottom - EDGE)) / EDGE))
      const up = Math.min(1, Math.max(0, (top + EDGE - y) / EDGE))
      const speed = down - up
      if (speed !== 0) {
        const before = element.scrollTop
        element.scrollTop += speed * MAX_SPEED
        if (element.scrollTop !== before) {
          setDrag((prev) => (prev ? { ...prev, dy: y + element.scrollTop - prev.startY } : prev))
        }
      }
    }
    const timer = setInterval(tick, FRAME_MS)
    return () => clearInterval(timer)
  }, [dragging])

  const endDrag = () => {
    if (!drag) return
    if (targetIndex !== dragIndex) {
      const ids = tracks.map((track) => track.id)
      const [moved] = ids.splice(dragIndex, 1)
      ids.splice(targetIndex, 0, moved)
      onReorder(ids)
    }
    setDrag(null)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <GlassIconButton icon="back" aria-label="뒤로가기" onClick={onBack} />
        <h1 className={styles.headerTitle}>DJ 플레이리스트</h1>
      </header>

      <main className={styles.content}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>{playlist.title}</h2>
          <button
            type="button"
            className={styles.save}
            aria-label={playlist.savedByMe ? '플레이리스트 저장 취소' : '플레이리스트 저장'}
            aria-pressed={playlist.savedByMe}
            onClick={onToggleSave}
          >
            <BookmarkIcon filled={playlist.savedByMe} />
          </button>
        </div>
        <p className={styles.meta}>
          총 {playlist.trackCount}곡 · {formatTotal(playlist.durationSeconds)}
        </p>

        <ul className={styles.keywords} aria-label="선택한 키워드">
          {keywords.map(({ code, emoji, label }) => (
            <li key={code} className={styles.keyword}>
              {emoji && <span className={styles.emoji}>{emoji}</span>}
              {label}
            </li>
          ))}
        </ul>

        <ol className={styles.tracks} aria-label="곡 목록">
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              open={openId === track.id}
              offset={offsetOf(index)}
              dragging={drag?.id === track.id}
              onSwipe={(open) => setOpenId(open ? track.id : null)}
              onDelete={() => {
                setOpenId(null)
                onDelete(track.id)
              }}
              onDragStart={(event) => {
                event.currentTarget.setPointerCapture?.(event.pointerId)
                setOpenId(null)
                scroller.current = scrollParent(event.currentTarget)
                pointerY.current = event.clientY
                setDrag({ id: track.id, startY: event.clientY + scroller.current.scrollTop, dy: 0 })
              }}
              onDragMove={(event) => {
                pointerY.current = event.clientY
                const scrollTop = scroller.current?.scrollTop ?? 0
                setDrag((prev) =>
                  prev && prev.id === track.id ? { ...prev, dy: event.clientY + scrollTop - prev.startY } : prev,
                )
              }}
              onDragEnd={endDrag}
            />
          ))}
        </ol>
      </main>

      <footer ref={footer} className={styles.footer}>
        <button type="button" className={styles.restart} onClick={onRestart}>
          다시 만들기
        </button>
        <button type="button" className={styles.saveButton} onClick={onSave}>
          저장하기
        </button>
      </footer>
    </div>
  )
}

export default PlaylistResultPage
